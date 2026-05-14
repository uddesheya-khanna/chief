import { cn } from "@/lib/utils";

type ContentContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: "default" | "narrow" | "wide";
};

const maxWidth: Record<NonNullable<ContentContainerProps["size"]>, string> = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
};

export function ContentContainer({
  className,
  size = "default",
  ...props
}: ContentContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        maxWidth[size],
        className,
      )}
      {...props}
    />
  );
}
