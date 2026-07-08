import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

export default function AdminSettingsPage() {
  return (
    <FeaturePlaceholder
      title="System Settings"
      description="Administer users, permissions, and system-wide configuration."
      requiredPermission="page:admin-settings"
      featureId="058"
    />
  );
}
