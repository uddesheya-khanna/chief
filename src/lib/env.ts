import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function parseClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid public environment: ${msg}`);
  }
  return parsed.data;
}

let cached: ClientEnv | null = null;

export function getClientEnv(): ClientEnv {
  if (!cached) {
    cached = parseClientEnv();
  }
  return cached;
}
