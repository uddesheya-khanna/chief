import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ContentContainer } from "@/components/primitives/content-container";
import { cn } from "@/lib/utils";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur-sm">
        <ContentContainer className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="font-heading text-[15px] font-semibold tracking-tight"
          >
            Chief
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "no-underline",
              )}
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className={cn(buttonVariants({ size: "sm" }), "no-underline")}
            >
              Get started
            </Link>
          </div>
        </ContentContainer>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
