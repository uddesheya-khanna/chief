import { Skeleton } from "@/components/ui/skeleton";

export default function EntityWorkspaceLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-border/60 pb-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-2 border-b border-border/60 pb-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
