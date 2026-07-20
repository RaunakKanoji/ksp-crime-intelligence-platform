import { generateReportPreview } from "./service";
import type { ReportConfig, ReportPreviewData } from "./types";
import type { UserRole } from "@/lib/permissions";

export async function fetchReportPreview(
  config: ReportConfig,
  role: UserRole
): Promise<ReportPreviewData> {
  try {
    const response = await fetch(`/api/reports?role=${role}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Report preview API failed.");
    return (await response.json()) as ReportPreviewData;
  } catch (error) {
    console.warn("API fallback to local service:", error);
    return generateReportPreview(config, role);
  }
}

export async function downloadReportFile(
  config: ReportConfig,
  role: UserRole,
  format: "pdf" | "csv"
): Promise<void> {
  const response = await fetch(`/api/reports/export/${format}?role=${role}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(`Export to ${format.toUpperCase()} failed.`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  // Format dates for file name
  const titleSlug = config.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  link.setAttribute("download", `${titleSlug}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
