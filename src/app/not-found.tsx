import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ContentContainer } from "@/components/primitives/content-container";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <ContentContainer className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
          This view does not exist
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The workspace or page may have been moved, or you may not have access.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ className: "mt-8" }))}
        >
          Back to Chief
        </Link>
      </ContentContainer>
    </div>
  );
}
