// Crime Summary Cards data service (feature 005).
//
// Reuses the shared sample MATRIX from the Dashboard Overview service so the
// two Dashboard-group features stay consistent. Computes high-level metrics
// with a time-period comparison (current window vs the immediately preceding
// window of equal length) and applies role-based redaction to sensitive intel
// cards before returning anything to the UI.

import { hasPermission, type UserRole } from "@/lib/permissions";
import { CATEGORIES, DATE_RANGES, DISTRICTS, type DateRangeKey } from "./types";
import { MATRIX } from "./service";

type District = (typeof DISTRICTS)[number];
type Category = (typeof CATEGORIES)[number];

export type MetricPolarity = "positive" | "negative" | "neutral";
export type TrendDirection = "up" | "down" | "flat";

export interface SummaryFilters {
  range: DateRangeKey;
  district: string; // "all" or a district name
  station: string; // "all" or a station name (only meaningful with a district)
  category: string; // "all" or a category name
}

export interface CrimeSummaryCard {
  id: string;
  label: string;
  /** Human-safe metric value; `null` when redacted for the active role. */
  value: number | null;
  displayValue: string;
  previousValue: number | null;
  previousDisplayValue: string;
  /** Signed change vs the previous period, in percent. */
  deltaPct: number;
  direction: TrendDirection;
  /** Whether an increase should read as good, bad, or neutral. */
  polarity: MetricPolarity;
  helper: string;
  /** True when the card is hidden from the active role. */
  restricted: boolean;
  format: "number" | "percent";
}

export interface CrimeSummary {
  isSampleData: boolean;
  filters: SummaryFilters;
  periodLabel: string;
  previousPeriodLabel: string;
  totalFirs: number;
  cards: CrimeSummaryCard[];
}

// Three stations per district; each carries an equal share of district volume.
export const STATIONS: Record<District, string[]> = {
  "Bengaluru City": ["Central Division", "Whitefield", "Kengeri"],
  Mysuru: ["Devaraja", "Nazarbad", "Vijayanagar"],
  Belagavi: ["Camp", "Market", "Tilakwadi"],
  Kalaburagi: ["Station Bazar", "Brahmapur", "Farhatabad"],
  Mangaluru: ["Barke", "Pandeshwar", "Kadri"],
  "Hubballi-Dharwad": ["Vidyanagar", "Gokul Road", "Ghantikeri"],
};

// Case-status split applied to total FIRs (sums to 1).
const STATUS_SPLIT = { active: 0.32, solved: 0.45, pending: 0.23 } as const;

// Fixed sample growth rates (current vs previous period), in fractions.
const GROWTH = {
  totalFirs: 0.062,
  active: 0.041,
  solved: 0.094,
  pending: -0.028,
  repeatOffenders: 0.035,
  highRiskLocations: 0.08,
} as const;

function scaleFor(range: DateRangeKey): number {
  switch (range) {
    case "7d":
      return 7 / 30;
    case "90d":
      return 90 / 30;
    case "30d":
    default:
      return 1;
  }
}

function rangeLabels(range: DateRangeKey): { current: string; previous: string } {
  const days = DATE_RANGES.find((r) => r.key === range)?.days ?? 30;
  return { current: `Last ${days} days`, previous: `Previous ${days} days` };
}

/** Clamp incoming filters to known-allowed values (defensive validation). */
export function normalizeSummaryFilters(input: Partial<SummaryFilters>): SummaryFilters {
  const range: DateRangeKey = DATE_RANGES.some((r) => r.key === input.range)
    ? (input.range as DateRangeKey)
    : "30d";
  const district =
    input.district && (input.district === "all" || (DISTRICTS as readonly string[]).includes(input.district))
      ? input.district
      : "all";
  const category =
    input.category && (input.category === "all" || (CATEGORIES as readonly string[]).includes(input.category))
      ? input.category
      : "all";
  // Station is only valid when a specific district is selected.
  let station = "all";
  if (district !== "all") {
    const allowed = STATIONS[district as District] ?? [];
    if (input.station && allowed.includes(input.station)) station = input.station;
  }
  return { range, district, station, category };
}

function scopeBaseTotal(filters: SummaryFilters): number {
  const districts: District[] =
    filters.district === "all" ? [...DISTRICTS] : DISTRICTS.filter((d) => d === filters.district);
  const categories: Category[] =
    filters.category === "all" ? [...CATEGORIES] : CATEGORIES.filter((c) => c === filters.category);

  let total = districts.reduce(
    (sum, d) => sum + categories.reduce((s, c) => s + MATRIX[d][c], 0),
    0
  );

  // A selected station carries an equal share of its district's volume.
  if (filters.district !== "all" && filters.station !== "all") {
    const stationCount = STATIONS[filters.district as District]?.length ?? 1;
    total = total / stationCount;
  }
  return total;
}

function direction(delta: number): TrendDirection {
  if (delta > 0.05) return "up";
  if (delta < -0.05) return "down";
  return "flat";
}

function makeCard(params: {
  id: string;
  label: string;
  value: number;
  growth: number;
  polarity: MetricPolarity;
  helper: string;
  restricted: boolean;
  format?: "number" | "percent";
}): CrimeSummaryCard {
  const { id, label, value, growth, polarity, helper, restricted, format = "number" } = params;
  const previous = growth !== -1 ? Math.round(value / (1 + growth)) : value;
  const deltaPct = previous > 0 ? ((value - previous) / previous) * 100 : 0;
  const fmt = (n: number) =>
    format === "percent" ? `${n.toFixed(1)}%` : n.toLocaleString("en-IN");
  return {
    id,
    label,
    value: restricted ? null : value,
    displayValue: restricted ? "—" : fmt(value),
    previousValue: restricted ? null : previous,
    previousDisplayValue: restricted ? "—" : fmt(previous),
    deltaPct: Math.round(deltaPct * 10) / 10,
    direction: direction(deltaPct / 100),
    polarity,
    helper,
    restricted,
    format,
  };
}

function computeSummary(filters: SummaryFilters, role: UserRole): CrimeSummary {
  const factor = scaleFor(filters.range);
  const base = scopeBaseTotal(filters);
  const totalFirs = Math.round(base * factor);

  const active = Math.round(totalFirs * STATUS_SPLIT.active);
  const solved = Math.round(totalFirs * STATUS_SPLIT.solved);
  const pending = Math.round(totalFirs * STATUS_SPLIT.pending);
  const repeatOffenders = Math.round(totalFirs * 0.11);
  const highRiskLocations = Math.round(totalFirs * 0.02);

  const { current, previous } = rangeLabels(filters.range);
  const comparisonHelper = `vs ${previous.toLowerCase()}`;

  // Repeat offenders and high-risk locations are sensitive intelligence and are
  // only shown to roles that may view investigation notes.
  const canViewIntel = hasPermission(role, "data:view-investigation-notes");

  const cards: CrimeSummaryCard[] = [
    makeCard({ id: "total-firs", label: "Total FIRs", value: totalFirs, growth: GROWTH.totalFirs, polarity: "negative", helper: comparisonHelper, restricted: false }),
    makeCard({ id: "active-cases", label: "Active Cases", value: active, growth: GROWTH.active, polarity: "neutral", helper: comparisonHelper, restricted: false }),
    makeCard({ id: "solved-cases", label: "Solved Cases", value: solved, growth: GROWTH.solved, polarity: "positive", helper: comparisonHelper, restricted: false }),
    makeCard({ id: "pending-cases", label: "Pending Cases", value: pending, growth: GROWTH.pending, polarity: "negative", helper: comparisonHelper, restricted: false }),
    makeCard({ id: "repeat-offenders", label: "Repeat Offenders", value: repeatOffenders, growth: GROWTH.repeatOffenders, polarity: "negative", helper: comparisonHelper, restricted: !canViewIntel }),
    makeCard({ id: "high-risk-locations", label: "High-Risk Locations", value: highRiskLocations, growth: GROWTH.highRiskLocations, polarity: "negative", helper: comparisonHelper, restricted: !canViewIntel }),
    makeCard({ id: "crime-growth", label: "Crime Growth", value: Number((GROWTH.totalFirs * 100).toFixed(1)), growth: -1, polarity: "negative", helper: `${current} vs ${previous.toLowerCase()}`, restricted: false, format: "percent" }),
  ];

  return {
    isSampleData: true,
    filters,
    periodLabel: current,
    previousPeriodLabel: previous,
    totalFirs,
    cards,
  };
}

/**
 * Returns crime summary cards for the active role and filters. Async to mirror
 * a real Catalyst-backed service and to exercise the loading state.
 */
export async function getCrimeSummary(
  rawFilters: Partial<SummaryFilters>,
  role: UserRole
): Promise<CrimeSummary> {
  const filters = normalizeSummaryFilters(rawFilters);
  await new Promise((resolve) => setTimeout(resolve, 250));
  return computeSummary(filters, role);
}
