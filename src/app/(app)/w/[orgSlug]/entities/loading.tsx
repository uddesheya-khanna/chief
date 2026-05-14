import { Skeleton } from "@/components/ui/skeleton";

export default function EntitiesLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-border/60 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-md" />
          ))}
        </div>
      </div>
      <div className="space-y-2 rounded-xl border border-border/60 bg-card p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[52px] w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
