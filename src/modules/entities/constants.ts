import {
  Building2,
  Globe2,
  Handshake,
  type LucideIcon,
  Users,
} from "lucide-react";

import { workspaceHref } from "@/modules/shell/nav";

export const ENTITY_TYPES = [
  "competitor",
  "investor",
  "partner",
  "market",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  competitor: "Competitor",
  investor: "Investor",
  partner: "Partner",
  market: "Market",
};

export const ENTITY_TYPE_LABEL_PLURAL: Record<EntityType, string> = {
  competitor: "Competitors",
  investor: "Investors",
  partner: "Partners",
  market: "Market",
};

export const ENTITY_TYPE_ICON: Record<EntityType, LucideIcon> = {
  competitor: Users,
  investor: Building2,
  partner: Handshake,
  market: Globe2,
};

export function entityTypeHref(orgSlug: string, type: EntityType): string {
  const paths: Record<EntityType, string> = {
    competitor: "/competitors",
    investor: "/investors",
    partner: "/partners",
    market: "/market",
  };
  return workspaceHref(orgSlug, paths[type]);
}

export function isEntityType(value: string): value is EntityType {
  return (ENTITY_TYPES as readonly string[]).includes(value);
}
