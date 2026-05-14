-- Intelligence events: core signal records per workspace and tracked entity.
-- RLS: workspace members read/write events in their organization.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.intelligence_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_id uuid not null references public.tracked_entities (id) on delete cascade,
  source_url text,
  source_type text not null check (
    source_type in ('website', 'news', 'job_board', 'linkedin', 'sec', 'manual')
  ),
  event_type text not null check (
    event_type in (
      'pricing_change',
      'product_launch',
      'hiring_surge',
      'funding',
      'exec_move',
      'partnership',
      'other'
    )
  ),
  title text not null,
  summary text not null,
  implication text,
  raw_content text,
  signal_score integer not null default 50 check (signal_score >= 0 and signal_score <= 100),
  metadata jsonb not null default '{}'::jsonb,
  is_dismissed boolean not null default false,
  dismissed_at timestamptz,
  dismissed_by uuid references auth.users (id) on delete set null,
  detected_at timestamptz not null default now(),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (Phase 2 roadmap)
-- ---------------------------------------------------------------------------
create index if not exists idx_events_org_detected
  on public.intelligence_events (organization_id, detected_at desc);

create index if not exists idx_events_entity
  on public.intelligence_events (entity_id, detected_at desc);

create index if not exists idx_events_org_score
  on public.intelligence_events (organization_id, signal_score desc);

create index if not exists idx_events_org_type
  on public.intelligence_events (organization_id, event_type, detected_at desc);

create index if not exists idx_events_org_dismissed
  on public.intelligence_events (organization_id, is_dismissed, detected_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.intelligence_events enable row level security;

drop policy if exists "intelligence_events_select_member" on public.intelligence_events;
create policy "intelligence_events_select_member"
  on public.intelligence_events for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_events.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "intelligence_events_insert_member" on public.intelligence_events;
create policy "intelligence_events_insert_member"
  on public.intelligence_events for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_events.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "intelligence_events_update_member" on public.intelligence_events;
create policy "intelligence_events_update_member"
  on public.intelligence_events for update
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_events.organization_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_events.organization_id
        and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Integrity: event.organization_id must match the entity's workspace
-- ---------------------------------------------------------------------------
create or replace function public.enforce_intelligence_event_entity_org()
returns trigger
language plpgsql
as $$
declare
  v_org uuid;
begin
  select te.organization_id into v_org
  from public.tracked_entities te
  where te.id = new.entity_id;

  if v_org is null then
    raise exception 'intelligence_events: tracked entity not found';
  end if;

  if v_org <> new.organization_id then
    raise exception 'intelligence_events: entity does not belong to organization';
  end if;

  return new;
end;
$$;

drop trigger if exists intelligence_events_entity_org_check on public.intelligence_events;
create trigger intelligence_events_entity_org_check
  before insert or update of organization_id, entity_id on public.intelligence_events
  for each row execute function public.enforce_intelligence_event_entity_org();
