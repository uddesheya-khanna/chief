"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getTrackedEntity } from "@/modules/entities/loaders";
import { INGESTION_SOURCE_TYPES } from "@/lib/ingestion/types";
import { getWorkspaceContext } from "@/modules/org/workspace-context";
import {
  runEntityIngestionNow,
  type ScheduleEntityIngestionInput,
} from "@/jobs/ingestion";

const triggerIngestionSchema = z.object({
  orgSlug: z.string().min(1),
  entityId: z.string().uuid(),
  sourceType: z.enum(INGESTION_SOURCE_TYPES),
});

export type IngestionActionState = {
  ok?: boolean;
  formError?: string;
  resultType?: string | null;
  jobId?: string;
  eventId?: string;
};

function revalidateEntityAfterIngestion(orgSlug: string, entityId: string) {
  revalidatePath(`/w/${orgSlug}/entities/${entityId}`, "layout");
  revalidatePath(`/w/${orgSlug}/feed`);
  revalidatePath(`/w/${orgSlug}/dashboard`);
}

export async function triggerEntityIngestion(
  _prev: IngestionActionState | null,
  formData: FormData,
): Promise<IngestionActionState> {
  const parsed = triggerIngestionSchema.safeParse({
    orgSlug: String(formData.get("orgSlug") ?? ""),
    entityId: String(formData.get("entityId") ?? ""),
    sourceType: String(formData.get("sourceType") ?? "website"),
  });

  if (!parsed.success) {
    return { formError: "Invalid crawl request." };
  }

  const { orgSlug, entityId, sourceType } = parsed.data;
  const ctx = await getWorkspaceContext(orgSlug);
  if (!ctx) {
    return { formError: "Workspace not found or access denied." };
  }

  const entity = await getTrackedEntity(
    ctx.supabase,
    ctx.organization.id,
    entityId,
  );
  if (!entity) {
    return { formError: "Entity not found." };
  }
  if (!entity.is_active) {
    return { formError: "Resume monitoring on this entity before crawling." };
  }
  if (!entity.domain?.trim()) {
    return {
      formError: "Add a domain on the entity profile before website monitoring can run.",
    };
  }

  const input: ScheduleEntityIngestionInput = {
    organizationId: ctx.organization.id,
    entityId: entity.id,
    entityName: entity.name,
    entityType: entity.type,
    domain: entity.domain,
    sourceType,
  };

  const result = await runEntityIngestionNow(input);

  revalidateEntityAfterIngestion(orgSlug, entityId);

  if (result.error || result.status === "failed") {
    return {
      ok: false,
      formError: result.errorMessage ?? result.error ?? "Crawl failed.",
      jobId: result.jobId || undefined,
      resultType: result.resultType,
    };
  }

  return {
    ok: true,
    jobId: result.jobId,
    resultType: result.resultType,
    eventId: result.eventId,
  };
}
