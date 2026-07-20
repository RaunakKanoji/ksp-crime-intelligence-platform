import { type DetailedValidationReport } from "@/lib/dataset-upload/types";
import { type UserRole } from "@/lib/permissions";
import { getDetailedValidationReport } from "@/lib/dataset-upload/service";

export async function fetchDetailedValidationReport(
  fileName: string,
  role: UserRole
): Promise<DetailedValidationReport> {
  const query = new URLSearchParams({ fileName, role });
  try {
    const response = await fetch(`/api/datasets/validation-details?${query.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to fetch detailed validation report");
    return (await response.json()) as DetailedValidationReport;
  } catch (error) {
    console.warn("API fallback to local detailed validation service:", error);
    return getDetailedValidationReport(fileName);
  }
}
