-- Ingestion jobs: crawl runs per workspace and tracked entity.
-- Snapshots live in storage bucket ingestion-snapshots (service role writes).

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_id uuid not null references public.tracked_entities (id) on delete cascade,
  rule_id uuid,
  source_type text not null check (source_type in ('website', 'pricing_page')),
  source_url text not null,
  status text not null default 'queued' check (
    status in ('queued', 'running', 'completed', 'failed', 'skipped')
  ),
  result_type text check (
    result_type is null
    or result_type in ('new_content', 'no_change', 'error', 'skipped_duplicate')
  ),
  raw_content text,
  snapshot_path text,
  previous_snapshot_path text,
  diff_summary text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ingestion_jobs_org_status
  on public.ingestion_jobs (organization_id, status, created_at desc);

create index if not exists idx_ingestion_jobs_entity
  on public.ingestion_jobs (entity_id, created_at desc);

create index if not exists idx_ingestion_jobs_org_created
  on public.ingestion_jobs (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Integrity: entity must belong to organization
-- ---------------------------------------------------------------------------
create or replace function public.enforce_ingestion_job_entity_org()
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
    raise exception 'ingestion_jobs: tracked entity not found';
  end if;

  if v_org <> new.organization_id then
    raise exception 'ingestion_jobs: entity does not belong to organization';
  end if;

  return new;
end;
$$;

drop trigger if exists ingestion_jobs_entity_org_check on public.ingestion_jobs;
create trigger ingestion_jobs_entity_org_check
  before insert or update of organization_id, entity_id on public.ingestion_jobs
  for each row execute function public.enforce_ingestion_job_entity_org();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.ingestion_jobs enable row level security;

drop policy if exists "ingestion_jobs_select_member" on public.ingestion_jobs;
create policy "ingestion_jobs_select_member"
  on public.ingestion_jobs for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = ingestion_jobs.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "ingestion_jobs_insert_member" on public.ingestion_jobs;
create policy "ingestion_jobs_insert_member"
  on public.ingestion_jobs for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = ingestion_jobs.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "ingestion_jobs_update_member" on public.ingestion_jobs;
create policy "ingestion_jobs_update_member"
  on public.ingestion_jobs for update
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = ingestion_jobs.organization_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = ingestion_jobs.organization_id
        and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage bucket for page snapshots (private; service role for pipeline writes)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ingestion-snapshots',
  'ingestion-snapshots',
  false,
  5242880,
  array['text/plain', 'text/markdown']
)
on conflict (id) do nothing;

drop policy if exists "ingestion_snapshots_select_member" on storage.objects;
create policy "ingestion_snapshots_select_member"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ingestion-snapshots'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text
      from public.organization_members m
      where m.user_id = auth.uid()
    )
  );
