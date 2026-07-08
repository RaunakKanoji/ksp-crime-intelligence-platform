// Typed domain models for the Dashboard Overview (feature 004).
// No unstructured `any`; IDs are stable, human-safe strings.

export type DateRangeKey = "7d" | "30d" | "90d";

export type TrendDirection = "up" | "down" | "flat";

export type AlertSeverity = "critical" | "high" | "moderate";

export interface DashboardFilters {
  range: DateRangeKey;
  /** District name, or "all". */
  district: string;
  /** Crime category, or "all". */
  category: string;
}

export interface SummaryMetric {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  comparisonLabel: string;
  direction: TrendDirection;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  /** Fraction of the filtered total, 0..1. */
  share: number;
}

export interface DistrictStat {
  district: string;
  total: number;
  pending: number;
  hotspot: boolean;
}

export interface CrimeAlert {
  id: string;
  title: string;
  district: string;
  category: string;
  severity: AlertSeverity;
  raisedAt: string;
  /** Suspect name — PII. `null` when the active role may not view PII. */
  suspect: string | null;
  /** Investigation note. `null` when the active role may not view notes. */
  note: string | null;
}

export interface MapHotspot {
  id: string;
  district: string;
  /** Relative intensity, 0..1. */
  intensity: number;
  /** Schematic coordinates on the preview panel, 0..100. */
  x: number;
  y: number;
}

export interface DashboardData {
  /** Always true for now — there is no connected data layer yet. */
  isSampleData: boolean;
  generatedAt: string;
  filters: DashboardFilters;
  summary: SummaryMetric[];
  trend: TrendPoint[];
  categories: CategoryStat[];
  districts: DistrictStat[];
  alerts: CrimeAlert[];
  hotspots: MapHotspot[];
  /** Which sensitive fields were made visible for the active role. */
  redaction: { pii: boolean; notes: boolean };
}

export const DATE_RANGES: { key: DateRangeKey; label: string; days: number }[] = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
];

export const DISTRICTS = [
  "Bengaluru City",
  "Mysuru",
  "Belagavi",
  "Kalaburagi",
  "Mangaluru",
  "Hubballi-Dharwad",
] as const;

export const CATEGORIES = [
  "Theft",
  "Property",
  "Cybercrime",
  "Assault",
  "Traffic",
  "Women Safety",
  "Narcotics",
] as const;
