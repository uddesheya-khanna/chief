import { PageHeader } from "@/components/primitives/page-header";
import { Surface } from "@/components/primitives/surface";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Settings"
        description="Workspace identity, membership, and integrations."
      />
      <Surface variant="muted" className="border-dashed">
        <p className="text-sm text-muted-foreground">
          Team and billing controls will extend this panel. Authentication and
          organization RLS are already enforced at the data layer.
        </p>
      </Surface>
    </div>
  );
}
