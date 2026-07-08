import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

export default function DatasetUploadPage() {
  return (
    <FeaturePlaceholder
      title="Dataset Upload"
      description="Import and validate crime datasets into the intelligence platform."
      requiredPermission="page:dataset-upload"
      featureId="036"
    />
  );
}
