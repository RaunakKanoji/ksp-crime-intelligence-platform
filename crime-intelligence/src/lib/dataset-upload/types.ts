export interface DatasetUploadJob {
  id: string;
  fileName: string;
  fileSize: string;
  rowCount: number;
  status: "Queued" | "Validating" | "Importing" | "Completed" | "Failed";
  errorsCount: number;
  createdTime: string;
  uploadedBy: string;
  recordsProcessed: number;
  recordsFailed: number;
  validationPassed: boolean;
  hasErrorsFile: boolean;
}

export interface ValidationErrorItem {
  row: number;
  column: string;
  message: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  rowCount: number;
  detectedHeaders: string[];
  errors: ValidationErrorItem[];
}

export interface DetailedValidationReport {
  fileName: string;
  rowCount: number;
  requiredColumnsChecked: { name: string; present: boolean }[];
  dataTypeChecked: { columnName: string; type: string; passedCount: number }[];
  dateParsedCount: number;
  duplicateFirNumbers: string[];
  missingValueCounts: Record<string, number>;
  invalidLocations: { row: number; station: string; district: string; reason: string }[];
  legalSectionSummary: { passed: number; failed: number; invalidSampleCodes: string[] };
  previewRows: any[];
}
