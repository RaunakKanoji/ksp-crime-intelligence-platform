import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

export default function ReportsPage() {
  return (
    <FeaturePlaceholder
      title="Reports"
      description="Build and export crime intelligence reports as PDF or CSV."
      requiredPermission="feature:export-pdf"
      featureId="030"
    />
  );
}
