import { PageHeader } from "@/components/primitives/page-header";
import { Surface } from "@/components/primitives/surface";

export default function SearchPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Search"
        description="Structured and semantic search across your intelligence corpus."
      />
      <Surface variant="muted" className="border-dashed">
        <p className="text-sm text-muted-foreground">
          Search UI and indexing are deferred; routing and shell are in place.
        </p>
      </Surface>
    </div>
  );
}
