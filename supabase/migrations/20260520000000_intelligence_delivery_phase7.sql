-- Phase 7: Intelligence delivery + workflow — monitoring rules, alerts, digests, workflow.

-- ---------------------------------------------------------------------------
-- Monitoring rules
-- ---------------------------------------------------------------------------
create table if not exists public.monitoring_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_id uuid references public.tracked_entities (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  min_signal_score integer not null default 75 check (
    min_signal_score >= 0 and min_signal_score <= 100
  ),
  event_types text[] not null default '{}'::text[],
  source_types text[] not null default '{}'::text[],
  recency_hours integer not null default 168 check (recency_hours > 0),
  last_triggered_at timestamptz,
  last_matched_event_id uuid references public.intelligence_events (id) on delete set null,
  trigger_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_monitoring_rules_org_active
  on public.monitoring_rules (organization_id, is_active);

create index if not exists idx_monitoring_rules_entity
  on public.monitoring_rules (organization_id, entity_id)
  where entity_id is not null;

-- ---------------------------------------------------------------------------
-- In-app alerts
-- ---------------------------------------------------------------------------
create table if not exists public.intelligence_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  event_id uuid not null references public.intelligence_events (id) on delete cascade,
  monitoring_rule_id uuid references public.monitoring_rules (id) on delete set null,
  severity text not null check (severity in ('high', 'medium', 'low')),
  title text not null,
  body text not null,
  explain jsonb not null default '{}'::jsonb,
  dedupe_key text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint intelligence_alerts_dedupe unique (organization_id, dedupe_key)
);

create index if not exists idx_intelligence_alerts_org_unread
  on public.intelligence_alerts (organization_id, is_read, created_at desc);

create index if not exists idx_intelligence_alerts_user_unread
  on public.intelligence_alerts (organization_id, user_id, is_read, created_at desc);

create index if not exists idx_intelligence_alerts_event
  on public.intelligence_alerts (event_id);

-- ---------------------------------------------------------------------------
-- Delivery log (email + future channels)
-- ---------------------------------------------------------------------------
create table if not exists public.alert_delivery_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  channel text not null check (channel in ('in_app', 'email')),
  delivery_type text not null check (
    delivery_type in ('alert', 'digest', 'digest_batch')
  ),
  reference_id uuid,
  status text not null default 'pending' check (
    status in ('pending', 'sent', 'failed', 'skipped')
  ),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_alert_delivery_org_created
  on public.alert_delivery_log (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Intelligence digests (stored reports)
-- ---------------------------------------------------------------------------
create table if not exists public.intelligence_digests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  digest_type text not null check (
    digest_type in (
      'daily',
      'weekly',
      'high_signal',
      'competitor_watch',
      'entity_report'
    )
  ),
  title text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  content jsonb not null default '{}'::jsonb,
  entity_id uuid references public.tracked_entities (id) on delete set null,
  status text not null default 'complete' check (
    status in ('generating', 'complete', 'failed')
  ),
  generated_by text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists idx_intelligence_digests_org_type
  on public.intelligence_digests (organization_id, digest_type, created_at desc);

-- ---------------------------------------------------------------------------
-- Workflow: collections + items
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_collections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  collection_type text not null check (
    collection_type in ('bookmarks', 'watchlist', 'investigation')
  ),
  description text,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workflow_collections_org_user
  on public.workflow_collections (organization_id, user_id);

create table if not exists public.workflow_collection_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  collection_id uuid not null references public.workflow_collections (id) on delete cascade,
  item_type text not null check (item_type in ('event', 'entity')),
  item_id uuid not null,
  note text,
  created_at timestamptz not null default now(),
  constraint workflow_collection_items_unique unique (
    collection_id,
    item_type,
    item_id
  )
);

create index if not exists idx_workflow_items_collection
  on public.workflow_collection_items (collection_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Pinned entities (per user)
-- ---------------------------------------------------------------------------
create table if not exists public.pinned_entities (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_id uuid not null references public.tracked_entities (id) on delete cascade,
  pinned_at timestamptz not null default now(),
  primary key (organization_id, user_id, entity_id)
);

create index if not exists idx_pinned_entities_user
  on public.pinned_entities (organization_id, user_id, pinned_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists monitoring_rules_set_updated_at on public.monitoring_rules;
create trigger monitoring_rules_set_updated_at
  before update on public.monitoring_rules
  for each row execute function public.set_updated_at();

drop trigger if exists workflow_collections_set_updated_at on public.workflow_collections;
create trigger workflow_collections_set_updated_at
  before update on public.workflow_collections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.monitoring_rules enable row level security;
alter table public.intelligence_alerts enable row level security;
alter table public.alert_delivery_log enable row level security;
alter table public.intelligence_digests enable row level security;
alter table public.workflow_collections enable row level security;
alter table public.workflow_collection_items enable row level security;
alter table public.pinned_entities enable row level security;

-- monitoring_rules
drop policy if exists "monitoring_rules_select_member" on public.monitoring_rules;
create policy "monitoring_rules_select_member"
  on public.monitoring_rules for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = monitoring_rules.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "monitoring_rules_insert_member" on public.monitoring_rules;
create policy "monitoring_rules_insert_member"
  on public.monitoring_rules for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = monitoring_rules.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "monitoring_rules_update_member" on public.monitoring_rules;
create policy "monitoring_rules_update_member"
  on public.monitoring_rules for update
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = monitoring_rules.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "monitoring_rules_delete_member" on public.monitoring_rules;
create policy "monitoring_rules_delete_member"
  on public.monitoring_rules for delete
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = monitoring_rules.organization_id
        and m.user_id = auth.uid()
    )
  );

-- intelligence_alerts
drop policy if exists "intelligence_alerts_select_member" on public.intelligence_alerts;
create policy "intelligence_alerts_select_member"
  on public.intelligence_alerts for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_alerts.organization_id
        and m.user_id = auth.uid()
    )
    and (user_id is null or user_id = auth.uid())
  );

drop policy if exists "intelligence_alerts_insert_member" on public.intelligence_alerts;
create policy "intelligence_alerts_insert_member"
  on public.intelligence_alerts for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_alerts.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "intelligence_alerts_update_member" on public.intelligence_alerts;
create policy "intelligence_alerts_update_member"
  on public.intelligence_alerts for update
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_alerts.organization_id
        and m.user_id = auth.uid()
    )
    and (user_id is null or user_id = auth.uid())
  );

-- alert_delivery_log (read for members; insert via service role in jobs)
drop policy if exists "alert_delivery_log_select_member" on public.alert_delivery_log;
create policy "alert_delivery_log_select_member"
  on public.alert_delivery_log for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = alert_delivery_log.organization_id
        and m.user_id = auth.uid()
    )
  );

-- intelligence_digests
drop policy if exists "intelligence_digests_select_member" on public.intelligence_digests;
create policy "intelligence_digests_select_member"
  on public.intelligence_digests for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_digests.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "intelligence_digests_insert_member" on public.intelligence_digests;
create policy "intelligence_digests_insert_member"
  on public.intelligence_digests for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = intelligence_digests.organization_id
        and m.user_id = auth.uid()
    )
  );

-- workflow_collections
drop policy if exists "workflow_collections_select_member" on public.workflow_collections;
create policy "workflow_collections_select_member"
  on public.workflow_collections for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.organization_id = workflow_collections.organization_id
        and m.user_id = auth.uid()
    )
    and (is_shared = true or user_id = auth.uid())
  );

drop policy if exists "workflow_collections_insert_own" on public.workflow_collections;
create policy "workflow_collections_insert_own"
  on public.workflow_collections for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.organization_members m
      where m.organization_id = workflow_collections.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "workflow_collections_update_own" on public.workflow_collections;
create policy "workflow_collections_update_own"
  on public.workflow_collections for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "workflow_collections_delete_own" on public.workflow_collections;
create policy "workflow_collections_delete_own"
  on public.workflow_collections for delete
  using (user_id = auth.uid());

-- workflow_collection_items
drop policy if exists "workflow_items_select_member" on public.workflow_collection_items;
create policy "workflow_items_select_member"
  on public.workflow_collection_items for select
  using (
    exists (
      select 1 from public.workflow_collections c
      join public.organization_members m
        on m.organization_id = c.organization_id
      where c.id = workflow_collection_items.collection_id
        and m.user_id = auth.uid()
        and (c.is_shared = true or c.user_id = auth.uid())
    )
  );

drop policy if exists "workflow_items_insert_own_collection" on public.workflow_collection_items;
create policy "workflow_items_insert_own_collection"
  on public.workflow_collection_items for insert
  with check (
    exists (
      select 1 from public.workflow_collections c
      where c.id = workflow_collection_items.collection_id
        and c.user_id = auth.uid()
        and c.organization_id = workflow_collection_items.organization_id
    )
  );

drop policy if exists "workflow_items_delete_own_collection" on public.workflow_collection_items;
create policy "workflow_items_delete_own_collection"
  on public.workflow_collection_items for delete
  using (
    exists (
      select 1 from public.workflow_collections c
      where c.id = workflow_collection_items.collection_id
        and c.user_id = auth.uid()
    )
  );

-- pinned_entities
drop policy if exists "pinned_entities_select_own" on public.pinned_entities;
create policy "pinned_entities_select_own"
  on public.pinned_entities for select
  using (user_id = auth.uid());

drop policy if exists "pinned_entities_insert_own" on public.pinned_entities;
create policy "pinned_entities_insert_own"
  on public.pinned_entities for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.organization_members m
      where m.organization_id = pinned_entities.organization_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "pinned_entities_delete_own" on public.pinned_entities;
create policy "pinned_entities_delete_own"
  on public.pinned_entities for delete
  using (user_id = auth.uid());
