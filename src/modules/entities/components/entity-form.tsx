"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  createEntity,
  updateEntity,
  type EntityActionState,
} from "@/actions/entities";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ENTITY_TYPES,
  ENTITY_TYPE_LABEL,
  isEntityType,
  type EntityType,
} from "@/modules/entities/constants";
import { entityDetailHref } from "@/modules/entities/entity-url";
import {
  normalizeMetadata,
  type TrackedEntityRow,
} from "@/modules/entities/loaders";
import { workspaceHref } from "@/modules/shell/nav";

type EntityFormProps = {
  mode: "create" | "edit";
  orgSlug: string;
  defaultType?: EntityType;
  entity?: TrackedEntityRow;
};

function metaString(
  entity: TrackedEntityRow | undefined,
  key: string,
): string {
  if (!entity) {
    return "";
  }
  const m = normalizeMetadata(entity.metadata);
  const v = m[key];
  return typeof v === "string" ? v : "";
}

export function EntityForm({ mode, orgSlug, defaultType, entity }: EntityFormProps) {
  const action = mode === "create" ? createEntity : updateEntity;
  const [state, formAction, pending] = useActionState<
    EntityActionState | null,
    FormData
  >(action, null);

  const typeDefault =
    entity?.type && isEntityType(entity.type)
      ? entity.type
      : defaultType ?? "competitor";

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      {entity ? <input type="hidden" name="id" value={entity.id} /> : null}

      {state?.formError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.formError}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            key={typeDefault}
            defaultValue={typeDefault}
            className="h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ENTITY_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.type?.[0] ? (
            <p className="text-xs text-destructive">{state.fieldErrors.type[0]}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="domain">Primary domain</Label>
          <Input
            id="domain"
            name="domain"
            defaultValue={entity?.domain ?? ""}
            placeholder="acme.com"
            autoComplete="off"
          />
          {state?.fieldErrors?.domain?.[0] ? (
            <p className="text-xs text-destructive">{state.fieldErrors.domain[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Legal or brand name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={entity?.name ?? ""}
          placeholder="Acme Corporation"
          autoComplete="organization"
        />
        {state?.fieldErrors?.name?.[0] ? (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Positioning & context</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={entity?.description ?? ""}
          placeholder="What they sell, where they play, and why they matter to you."
        />
        {state?.fieldErrors?.description?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-border/60 pt-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Reference links
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              defaultValue={metaString(entity, "linkedin_url")}
              placeholder="https://linkedin.com/company/…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crunchbase_url">Crunchbase URL</Label>
            <Input
              id="crunchbase_url"
              name="crunchbase_url"
              defaultValue={metaString(entity, "crunchbase_url")}
              placeholder="https://crunchbase.com/organization/…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker</Label>
            <Input
              id="ticker"
              name="ticker"
              defaultValue={metaString(entity, "ticker")}
              placeholder="ACME"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={metaString(entity, "notes")}
              placeholder="Deal context, board relationships, or watch-outs."
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-6">
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create entity"
              : "Save changes"}
        </Button>
        {entity ? (
          <Link
            href={entityDetailHref(orgSlug, entity.id)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "no-underline",
            )}
          >
            Cancel
          </Link>
        ) : (
          <Link
            href={workspaceHref(orgSlug, "/entities")}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "no-underline",
            )}
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
