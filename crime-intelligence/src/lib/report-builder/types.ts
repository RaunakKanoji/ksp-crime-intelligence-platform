export interface ReportConfig {
  title: string;
  range: string; // "30d" | "90d" | "180d" | "1y" | "custom"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  district: string; // "all" or specific name
  category: string; // "all" or specific name
  includeCharts: boolean;
  includeTables: boolean;
  includeAiSummary: boolean;
}

export interface ReportChartPoint {
  label: string;
  value: number;
}

export interface ReportTableFir {
  id: string;
  firNumber: string;
  incidentDateTime: string;
  crimeCategory: string;
  district: string;
  policeStation: string;
  caseStatus: string;
  accusedName: string; // Redacted if unauthorized
  victimName: string; // Redacted if unauthorized
  severity: string;
  riskScore: number;
}

export interface ReportPreviewData {
  isSampleData: boolean;
  generatedAt: string;
  config: ReportConfig;
  totalCount: number;
  chartData: ReportChartPoint[];
  tableData: ReportTableFir[];
  aiSummary: string;
  auditNote: string;
  redaction: {
    pii: boolean;
  };
}

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  title: "Crime Intelligence Summary Report",
  range: "30d",
  startDate: "2026-06-08",
  endDate: "2026-07-08",
  district: "all",
  category: "all",
  includeCharts: true,
  includeTables: true,
  includeAiSummary: true,
};
