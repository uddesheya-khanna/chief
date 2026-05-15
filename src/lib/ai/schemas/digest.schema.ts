import { z } from "zod";

export const DigestSectionSchema = z.object({
  heading: z.string().max(120),
  body: z.string().max(1200),
});

export const ExecutiveDigestSchema = z.object({
  executive_summary: z.string().max(800),
  key_movements: z.array(DigestSectionSchema).max(6),
  recommended_actions: z.array(z.string().max(200)).max(5),
  confidence: z.number().min(0).max(1),
});

export type ExecutiveDigest = z.infer<typeof ExecutiveDigestSchema>;

export const FALLBACK_DIGEST: ExecutiveDigest = {
  executive_summary:
    "Digest summary unavailable — review linked signals directly.",
  key_movements: [],
  recommended_actions: [],
  confidence: 0,
};
