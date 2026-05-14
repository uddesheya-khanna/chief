import { Skeleton } from "@/components/ui/skeleton";

export default function EntityDetailLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-border/60 pb-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-2/3 max-w-xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
