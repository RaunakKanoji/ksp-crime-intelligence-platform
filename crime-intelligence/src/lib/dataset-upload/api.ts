import { type DatasetUploadJob, type SchemaValidationResult } from "./types";
import { type UserRole } from "@/lib/permissions";
import { getUploadJobs, validateDatasetFile, startImportJob } from "./service";

export async function validateDataset(
  content: string,
  fileName: string,
  fileSize: string,
  role: UserRole
): Promise<SchemaValidationResult> {
  const query = new URLSearchParams({ role });
  try {
    const response = await fetch(`/api/datasets/validate?${query.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, fileName, fileSize }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Validation failed");
    }
    return (await response.json()) as SchemaValidationResult;
  } catch (error) {
    console.warn("API fallback to local validation service:", error);
    return validateDatasetFile(fileName, content);
  }
}

export async function startImport(
  fileName: string,
  fileSize: string,
  rowCount: number,
  role: UserRole
): Promise<DatasetUploadJob> {
  const query = new URLSearchParams({ role });
  try {
    const response = await fetch(`/api/datasets/import?${query.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileSize, rowCount }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Import failed");
    }
    return (await response.json()) as DatasetUploadJob;
  } catch (error) {
    console.warn("API fallback to local job service:", error);
    return startImportJob(fileName, fileSize, rowCount);
  }
}

export async function fetchUploadJobs(role: UserRole): Promise<DatasetUploadJob[]> {
  const query = new URLSearchParams({ role });
  try {
    const response = await fetch(`/api/datasets/jobs?${query.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to fetch upload jobs list");
    return (await response.json()) as DatasetUploadJob[];
  } catch (error) {
    console.warn("API fallback to local jobs data:", error);
    return getUploadJobs();
  }
}
