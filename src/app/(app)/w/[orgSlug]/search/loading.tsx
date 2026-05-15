import { PageHeader } from "@/components/primitives/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <PageHeader
        title="Search"
        description="Hybrid semantic and keyword retrieval across your intelligence corpus."
      />
      <Skeleton className="h-[38px] w-full max-w-xl" />
      <div className="space-y-0 rounded-lg border border-border/70">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-border/60 px-4 py-4 last:border-b-0"
          >
            <Skeleton className="mb-2 h-3 w-40" />
            <Skeleton className="mb-2 h-4 w-[85%]" />
            <Skeleton className="h-3 w-[70%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
