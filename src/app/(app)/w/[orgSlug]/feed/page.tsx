import { PageHeader } from "@/components/primitives/page-header";
import { Surface } from "@/components/primitives/surface";

export default function FeedPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Feed"
        description="A chronological stream of intelligence events for this workspace."
      />
      <Surface variant="muted" className="border-dashed">
        <p className="text-sm text-muted-foreground">
          Feed scaffolding is wired; ingestion and events are intentionally out
          of scope for this foundation.
        </p>
      </Surface>
    </div>
  );
}
