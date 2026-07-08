import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

export default function AnalyticsPage() {
  return (
    <FeaturePlaceholder
      title="Crime Analytics"
      description="Aggregated trends, category breakdowns, and comparative crime analytics."
      requiredPermission="page:dashboard"
      featureId="015"
    />
  );
}
