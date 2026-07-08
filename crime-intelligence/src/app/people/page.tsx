import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

export default function PeoplePage() {
  return (
    <FeaturePlaceholder
      title="Accused & Victims"
      description="Profiles and case links for accused persons and victims, subject to role-based redaction."
      requiredPermission="page:people"
      featureId="017"
    />
  );
}
