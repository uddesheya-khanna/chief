import { z } from "zod";

import { ENTITY_TYPES, isEntityType } from "./constants";

const optionalUrl = z.union([
  z.literal(""),
  z.string().trim().url("Enter a valid URL."),
]);

function normalizeDomainInput(input: string): string {
  const t = input.trim().toLowerCase();
  if (!t) {
    return "";
  }
  return t.replace(/^https?:\/\//, "").split("/")[0].split("?")[0].split(":")[0];
}

const optionalDomain = z
  .string()
  .max(280)
  .transform(normalizeDomainInput)
  .refine(
    (s) =>
      !s ||
      s === "localhost" ||
      /^[\w.-]+\.[a-z]{2,63}$/i.test(s),
    {
      message: "Enter a valid domain (e.g. acme.com).",
    },
  );

export const entityMetadataSchema = z.object({
  linkedin_url: optionalUrl,
  crunchbase_url: optionalUrl,
  ticker: z.string().trim().max(32).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type EntityMetadata = z.infer<typeof entityMetadataSchema>;

export const createEntitySchema = z.object({
  type: z.enum(ENTITY_TYPES),
  name: z.string().trim().min(1, "Name is required.").max(200),
  domain: optionalDomain,
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  metadata: entityMetadataSchema.optional(),
});

export const updateEntityFormSchema = createEntitySchema.extend({
  id: z.string().uuid(),
});

export const entityListQuerySchema = z
  .object({
    type: z
      .string()
      .optional()
      .transform((v) => (v && isEntityType(v) ? v : undefined)),
    q: z.string().trim().max(200).optional(),
    status: z.enum(["active", "archived", "all"]).optional(),
  })
  .transform((o) => ({
    type: o.type,
    q: o.q,
    status: o.status ?? "active",
  }));

export type EntityListQuery = z.infer<typeof entityListQuerySchema>;
