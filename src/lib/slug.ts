const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function slugify(input: string): string {
  const raw = input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 62);

  if (!raw) {
    return "workspace";
  }
  return SLUG_RE.test(raw) ? raw : raw.replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "") || "workspace";
}

export function isValidOrgSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}
