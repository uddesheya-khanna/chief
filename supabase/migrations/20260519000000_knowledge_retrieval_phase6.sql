-- Phase 6: Knowledge + retrieval — pgvector embeddings, relationships, hybrid search.

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Embeddings (chunked: title, summary, implication per event; profile per entity)
-- ---------------------------------------------------------------------------
create table if not exists public.intelligence_embeddings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_type text not null check (source_type in ('event', 'entity')),
  source_id uuid not null,
  chunk_kind text not null check (
    chunk_kind in ('title', 'summary', 'implication', 'profile')
  ),
  chunk_index integer not null default 0 check (chunk_index >= 0),
  content text not null,
  content_hash text not null,
  embedding vector (1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intelligence_embeddings_unique_chunk unique (
    organization_id,
    source_type,
    source_id,
    chunk_kind,
    chunk_index
  )
);

create index if not exists idx_embeddings_org_source
  on public.intelligence_embeddings (organization_id, source_type, source_id);

create index if not exists idx_embeddings_event_chunks
  on public.intelligence_embeddings (organization_id, source_id)
  where source_type = 'event';

create index if not exists idx_embeddings_vector
  on public.intelligence_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ---------------------------------------------------------------------------
-- Entity relationships (lightweight graph — no graph DB)
-- ---------------------------------------------------------------------------
create table if not exists public.entity_relationships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  from_entity_id uuid not null references public.tracked_entities (id) on delete cascade,
  to_entity_id uuid not null references public.tracked_entities (id) on delete cascade,
  relationship_type text not null check (
    relationship_type in (
      'competes_with',
      'invested_in',
      'partnered_with',
      'supplies',
      'markets_with',
      'executive_at',
      'acquired',
      'other'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  valid_from timestamptz,
  valid_until timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entity_relationships_distinct_entities check (from_entity_id <> to_entity_id)
);

create index if not exists idx_entity_relationships_org_from
  on public.entity_relationships (organization_id, from_entity_id);

create index if not exists idx_entity_relationships_org_to
  on public.entity_relationships (organization_id, to_entity_id);

-- ---------------------------------------------------------------------------
-- Event relationships (related signals, recurring themes)
-- ---------------------------------------------------------------------------
create table if not exists public.event_relationships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  from_event_id uuid not null references public.intelligence_events (id) on delete cascade,
  to_event_id uuid not null references public.intelligence_events (id) on delete cascade,
  relationship_type text not null check (
    relationship_type in ('related', 'recurring_theme', 'follow_up', 'duplicate_of')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint event_relationships_distinct_events check (from_event_id <> to_event_id),
  constraint event_relationships_unique_link unique (
    organization_id,
    from_event_id,
    to_event_id,
    relationship_type
  )
);

create index if not exists idx_event_relationships_from
  on public.event_relationships (organization_id, from_event_id);

create index if not exists idx_event_relationships_to
  on public.event_relationships (organization_id, to_event_id);

-- ---------------------------------------------------------------------------
-- Full-text search documents (keyword leg of hybrid search)
-- ---------------------------------------------------------------------------
alter table public.intelligence_events
  add column if not exists search_document tsvector;

alter table public.tracked_entities
  add column if not exists search_document tsvector;

create or replace function public.intelligence_events_search_document()
returns trigger
language plpgsql
as $$
begin
  new.search_document :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.implication, '')), 'C');
  return new;
end;
$$;

drop trigger if exists intelligence_events_search_document_trg on public.intelligence_events;
create trigger intelligence_events_search_document_trg
  before insert or update of title, summary, implication on public.intelligence_events
  for each row execute function public.intelligence_events_search_document();

create or replace function public.tracked_entities_search_document()
returns trigger
language plpgsql
as $$
begin
  new.search_document :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.domain, '')), 'C');
  return new;
end;
$$;

drop trigger if exists tracked_entities_search_document_trg on public.tracked_entities;
create trigger tracked_entities_search_document_trg
  before insert or update of name, description, domain on public.tracked_entities
  for each row execute function public.tracked_entities_search_document();

-- Backfill search documents
update public.intelligence_events
set search_document =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(implication, '')), 'C')
where search_document is null;

update public.tracked_entities
set search_document =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(domain, '')), 'C')
where search_document is null;

create index if not exists idx_events_search_document
  on public.intelligence_events using gin (search_document);

create index if not exists idx_entities_search_document
  on public.tracked_entities using gin (search_document);

-- ---------------------------------------------------------------------------
-- Semantic match RPC (org-scoped; RLS on joined tables applies)
-- ---------------------------------------------------------------------------
create or replace function public.match_intelligence_embeddings(
  p_organization_id uuid,
  p_query_embedding vector (1536),
  p_match_count integer default 40,
  p_min_similarity double precision default 0.5
)
returns table (
  source_type text,
  source_id uuid,
  chunk_kind text,
  semantic_similarity double precision
)
language sql
stable
as $$
  select
    e.source_type,
    e.source_id,
    e.chunk_kind,
    (1 - (e.embedding <=> p_query_embedding))::double precision as semantic_similarity
  from public.intelligence_embeddings e
  where e.organization_id = p_organization_id
    and e.embedding is not null
    and (1 - (e.embedding <=> p_query_embedding)) >= p_min_similarity
  order by e.embedding <=> p_query_embedding
  limit greatest(p_match_count, 1);
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.intelligence_embeddings enable row level security;
alter table public.entity_relationships enable row level security;
alter table public.event_relationships enable row level security;

drop policy if exists "intelligence_embeddings_select_member" on public.intelligence_embeddings;
create policy "intelligence_embeddings_select_member"
  on public.intelligence_embeddings for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_embeddings.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "intelligence_embeddings_insert_member" on public.intelligence_embeddings;
create policy "intelligence_embeddings_insert_member"
  on public.intelligence_embeddings for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_embeddings.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "intelligence_embeddings_update_member" on public.intelligence_embeddings;
create policy "intelligence_embeddings_update_member"
  on public.intelligence_embeddings for update
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_embeddings.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "intelligence_embeddings_delete_member" on public.intelligence_embeddings;
create policy "intelligence_embeddings_delete_member"
  on public.intelligence_embeddings for delete
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_embeddings.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "entity_relationships_select_member" on public.entity_relationships;
create policy "entity_relationships_select_member"
  on public.entity_relationships for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = entity_relationships.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "entity_relationships_insert_member" on public.entity_relationships;
create policy "entity_relationships_insert_member"
  on public.entity_relationships for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = entity_relationships.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "entity_relationships_update_member" on public.entity_relationships;
create policy "entity_relationships_update_member"
  on public.entity_relationships for update
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = entity_relationships.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "entity_relationships_delete_member" on public.entity_relationships;
create policy "entity_relationships_delete_member"
  on public.entity_relationships for delete
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = entity_relationships.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "event_relationships_select_member" on public.event_relationships;
create policy "event_relationships_select_member"
  on public.event_relationships for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = event_relationships.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "event_relationships_insert_member" on public.event_relationships;
create policy "event_relationships_insert_member"
  on public.event_relationships for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = event_relationships.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "event_relationships_delete_member" on public.event_relationships;
create policy "event_relationships_delete_member"
  on public.event_relationships for delete
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = event_relationships.organization_id
        and m.user_id = auth.uid()
    )
  );

drop trigger if exists entity_relationships_set_updated_at on public.entity_relationships;
create trigger entity_relationships_set_updated_at
  before update on public.entity_relationships
  for each row execute function public.set_updated_at();

drop trigger if exists intelligence_embeddings_set_updated_at on public.intelligence_embeddings;
create trigger intelligence_embeddings_set_updated_at
  before update on public.intelligence_embeddings
  for each row execute function public.set_updated_at();

grant execute on function public.match_intelligence_embeddings(uuid, vector, integer, double precision) to authenticated;
