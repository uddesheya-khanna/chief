import { cn } from "@/lib/utils";
import { ENTITY_TYPE_LABEL, type EntityType } from "@/modules/entities/constants";
import { Badge } from "@/components/ui/badge";

const tone: Record<EntityType, string> = {
  competitor:
    "border-emerald-700/15 bg-emerald-700/[0.06] text-emerald-800 dark:text-emerald-200",
  investor:
    "border-indigo-600/15 bg-indigo-600/[0.06] text-indigo-900 dark:text-indigo-100",
  partner:
    "border-amber-700/15 bg-amber-700/[0.06] text-amber-900 dark:text-amber-100",
  market:
    "border-sky-700/15 bg-sky-700/[0.06] text-sky-900 dark:text-sky-100",
};

export function EntityTypeBadge({
  type,
  className,
}: {
  type: EntityType | string;
  className?: string;
}) {
  const t = type as EntityType;
  const label =
    t in ENTITY_TYPE_LABEL ? ENTITY_TYPE_LABEL[t] : String(type);
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-1.5 py-0 text-[11px] font-medium uppercase tracking-[0.06em]",
        tone[t as EntityType] ?? "text-muted-foreground",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
