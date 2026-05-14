import { PageHeader } from "@/components/primitives/page-header";
import { Stack } from "@/components/primitives/stack";
import { Surface } from "@/components/primitives/surface";

export default function DashboardPage() {
  return (
    <Stack gap="lg" className="max-w-3xl">
      <PageHeader
        title="Dashboard"
        description="Your intelligence home. When signals arrive, they will surface here with full context and lineage."
      />
      <Surface variant="muted" className="border-dashed">
        <p className="text-sm leading-relaxed text-muted-foreground">
          No signals yet — the foundation is ready. Connect sources and entities
          when you extend beyond this shell; the layout, auth, and workspace
          model are already production-shaped.
        </p>
      </Surface>
    </Stack>
  );
}
