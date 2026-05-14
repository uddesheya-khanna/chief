-- Tracked entities: competitors, investors, partners, market (per workspace).
-- RLS: any workspace member can read/write entities in that workspace.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.tracked_entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  type text not null check (type in ('competitor', 'investor', 'partner', 'market')),
  name text not null,
  domain text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tracked_entities_org_type_active_idx
  on public.tracked_entities (organization_id, type, is_active);

create index if not exists tracked_entities_org_updated_idx
  on public.tracked_entities (organization_id, updated_at desc);

create index if not exists tracked_entities_org_name_lower_idx
  on public.tracked_entities (organization_id, lower(name));

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tracked_entities_set_updated_at on public.tracked_entities;
create trigger tracked_entities_set_updated_at
  before update on public.tracked_entities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.tracked_entities enable row level security;

drop policy if exists "tracked_entities_select_member" on public.tracked_entities;
create policy "tracked_entities_select_member"
  on public.tracked_entities for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = tracked_entities.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "tracked_entities_insert_member" on public.tracked_entities;
create policy "tracked_entities_insert_member"
  on public.tracked_entities for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = tracked_entities.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "tracked_entities_update_member" on public.tracked_entities;
create policy "tracked_entities_update_member"
  on public.tracked_entities for update
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = tracked_entities.organization_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = tracked_entities.organization_id
        and m.user_id = auth.uid()
    )
  );
