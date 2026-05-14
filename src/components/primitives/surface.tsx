import { cn } from "@/lib/utils";

type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "muted" | "inset";
};

const surface: Record<NonNullable<SurfaceProps["variant"]>, string> = {
  default: "border border-border/90 bg-card shadow-sm",
  muted: "border border-transparent bg-muted/40",
  inset: "border border-border/60 bg-background",
};

export function Surface({
  className,
  variant = "default",
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn("rounded-xl p-6", surface[variant], className)}
      {...props}
    />
  );
}
