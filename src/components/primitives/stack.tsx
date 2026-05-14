import { cn } from "@/lib/utils";

type StackProps = React.HTMLAttributes<HTMLDivElement> & {
  gap?: "none" | "xs" | "sm" | "md" | "lg";
};

const gapClass: Record<NonNullable<StackProps["gap"]>, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

export function Stack({
  className,
  gap = "md",
  ...props
}: StackProps) {
  return (
    <div className={cn("flex flex-col", gapClass[gap], className)} {...props} />
  );
}
