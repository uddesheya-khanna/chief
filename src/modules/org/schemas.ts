import { z } from "zod";

import { isValidOrgSlug } from "@/lib/slug";

export const createWorkspaceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(80, "Name is too long."),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(62)
      .refine(isValidOrgSlug, {
        message:
          "Use lowercase letters, numbers, and single hyphens. Start and end with a letter or number.",
      }),
  })
  .strict();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
