import { z } from "zod";

import { RELATIONSHIP_TYPES } from "@/modules/relationships/constants";

export const createRelationshipSchema = z.object({
  from_entity_id: z.string().uuid(),
  to_entity_id: z.string().uuid(),
  relationship_type: z.enum(RELATIONSHIP_TYPES),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  note: z.string().max(500).optional(),
});
