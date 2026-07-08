import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

export default function FirSearchPage() {
  return (
    <FeaturePlaceholder
      title="FIR Search"
      description="Search and filter First Information Reports across districts and stations."
      requiredPermission="page:fir-search"
      featureId="008"
    />
  );
}
