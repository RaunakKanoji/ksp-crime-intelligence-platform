import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

export default function MapPage() {
  return (
    <FeaturePlaceholder
      title="Crime Map"
      description="Geospatial view of incidents with clustering and hotspot overlays."
      requiredPermission="page:map"
      featureId="011"
    />
  );
}
