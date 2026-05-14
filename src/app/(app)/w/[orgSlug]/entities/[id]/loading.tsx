import { Skeleton } from "@/components/ui/skeleton";

/** Shared loading for entity-scoped routes (e.g. edit) outside the workspace shell. */
export default function EntitySegmentLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-4">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
