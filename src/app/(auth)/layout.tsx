import { ContentContainer } from "@/components/primitives/content-container";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/15">
      <ContentContainer className="flex flex-1 flex-col items-center justify-center py-16">
        <div className="w-full max-w-[400px]">{children}</div>
      </ContentContainer>
    </div>
  );
}
