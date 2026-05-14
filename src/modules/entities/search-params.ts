import { entityListQuerySchema, type EntityListQuery } from "@/modules/entities/schemas";

function first(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parseEntityListQuery(
  searchParams: Record<string, string | string[] | undefined>,
): EntityListQuery {
  const parsed = entityListQuerySchema.safeParse({
    type: first(searchParams.type),
    q: first(searchParams.q),
    status: first(searchParams.status),
  });
  if (!parsed.success) {
    return { type: undefined, q: undefined, status: "active" };
  }
  return parsed.data;
}
