import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

export default function AiQueryPage() {
  return (
    <FeaturePlaceholder
      title="AI Assistant"
      description="Ask natural-language questions about crime data with explainable results."
      requiredPermission="page:ai-query"
      featureId="006"
    />
  );
}
