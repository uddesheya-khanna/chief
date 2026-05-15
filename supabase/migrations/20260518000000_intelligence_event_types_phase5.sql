-- Phase 5: expand intelligence event_type taxonomy for AI classification.

alter table public.intelligence_events
  drop constraint if exists intelligence_events_event_type_check;

alter table public.intelligence_events
  add constraint intelligence_events_event_type_check
  check (
    event_type in (
      'pricing_change',
      'product_launch',
      'hiring_surge',
      'funding',
      'exec_move',
      'partnership',
      'positioning_change',
      'market_expansion',
      'compliance_security',
      'other'
    )
  );
