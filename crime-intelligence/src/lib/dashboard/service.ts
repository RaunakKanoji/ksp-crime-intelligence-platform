// Dashboard Overview data service (feature 004).
//
// There is no connected Catalyst Data Store layer yet, so this returns clearly
// labeled SAMPLE data. All aggregates are derived from a single district ×
// category matrix so summary cards, categories, districts, and trend stay
// internally consistent. Role-based redaction is applied here so the UI only
// ever receives data the active role is allowed to see.

import {
  hasPermission,
  type UserRole,
} from "@/lib/permissions";
import {
  CATEGORIES,
  DATE_RANGES,
  DISTRICTS,
  type CategoryStat,
  type CrimeAlert,
  type DashboardData,
  type DashboardFilters,
  type DateRangeKey,
  type DistrictStat,
  type MapHotspot,
  type SummaryMetric,
  type TrendDirection,
  type TrendPoint,
} from "./types";

type District = (typeof DISTRICTS)[number];
type Category = (typeof CATEGORIES)[number];

// Baseline incident counts for a 30-day window. Zeros are intentional so that
// some district/category combinations produce a legitimate empty state.
export const MATRIX: Record<District, Record<Category, number>> = {
  "Bengaluru City": { Theft: 120, Property: 78, Cybercrime: 90, Assault: 40, Traffic: 55, "Women Safety": 22, Narcotics: 15 },
  Mysuru: { Theft: 52, Property: 34, Cybercrime: 20, Assault: 24, Traffic: 26, "Women Safety": 14, Narcotics: 10 },
  Belagavi: { Theft: 44, Property: 30, Cybercrime: 12, Assault: 22, Traffic: 24, "Women Safety": 12, Narcotics: 6 },
  Kalaburagi: { Theft: 34, Property: 24, Cybercrime: 0, Assault: 20, Traffic: 18, "Women Safety": 10, Narcotics: 4 },
  Mangaluru: { Theft: 28, Property: 20, Cybercrime: 14, Assault: 12, Traffic: 12, "Women Safety": 9, Narcotics: 0 },
  "Hubballi-Dharwad": { Theft: 40, Property: 26, Cybercrime: 16, Assault: 18, Traffic: 16, "Women Safety": 8, Narcotics: 6 },
};

const TREND_BASELINE: TrendPoint[] = [
  { label: "Jan", value: 980 },
  { label: "Feb", value: 1040 },
  { label: "Mar", value: 1120 },
  { label: "Apr", value: 1015 },
  { label: "May", value: 1190 },
  { label: "Jun", value: 1085 },
];

const HOTSPOT_COORDS: Record<District, { x: number; y: number }> = {
  "Bengaluru City": { x: 62, y: 72 },
  Mysuru: { x: 48, y: 84 },
  Belagavi: { x: 22, y: 34 },
  Kalaburagi: { x: 58, y: 16 },
  Mangaluru: { x: 20, y: 68 },
  "Hubballi-Dharwad": { x: 34, y: 46 },
};

interface RawAlert {
  id: string;
  title: string;
  district: District;
  category: Category;
  severity: CrimeAlert["severity"];
  raisedAt: string;
  suspect: string;
  note: string;
}

const ALERTS: RawAlert[] = [
  {
    id: "AL-2041",
    title: "Repeat burglary cluster flagged",
    district: "Bengaluru City",
    category: "Property",
    severity: "critical",
    raisedAt: "2026-07-08T06:40:00Z",
    suspect: "Kiran M.",
    note: "Three linked break-ins near Kengeri; recommend surveillance escalation.",
  },
  {
    id: "AL-2038",
    title: "Cybercrime spike — UPI fraud",
    district: "Bengaluru City",
    category: "Cybercrime",
    severity: "high",
    raisedAt: "2026-07-08T04:15:00Z",
    suspect: "Unknown network",
    note: "Pattern matches earlier fraud ring; awaiting bank data confirmation.",
  },
  {
    id: "AL-2035",
    title: "Assault reports rising in ward 12",
    district: "Mysuru",
    category: "Assault",
    severity: "moderate",
    raisedAt: "2026-07-07T18:05:00Z",
    suspect: "Srinivas G.",
    note: "Second incident this week; cross-check with FIR MY-2211.",
  },
  {
    id: "AL-2030",
    title: "Narcotics tip-off pending review",
    district: "Belagavi",
    category: "Narcotics",
    severity: "high",
    raisedAt: "2026-07-07T11:30:00Z",
    suspect: "Confidential source",
    note: "Human review required before any operational action.",
  },
];

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

/** Clamp incoming filters to known-allowed values (defensive validation). */
export function normalizeFilters(input: Partial<DashboardFilters>): DashboardFilters {
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
  return { range, district, category };
}

function districtsInScope(filters: DashboardFilters): District[] {
  if (filters.district === "all") return [...DISTRICTS];
  return DISTRICTS.filter((d) => d === filters.district);
}

function categoriesInScope(filters: DashboardFilters): Category[] {
  if (filters.category === "all") return [...CATEGORIES];
  return CATEGORIES.filter((c) => c === filters.category);
}

function direction(delta: number): TrendDirection {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function computeDashboard(filters: DashboardFilters, role: UserRole): DashboardData {
  const factor = scaleFor(filters.range);
  const scopeDistricts = districtsInScope(filters);
  const scopeCategories = categoriesInScope(filters);

  const scale = (n: number) => Math.round(n * factor);

  // District rollups within the current scope. Hotspot status is a stable
  // property derived from the 30-day baseline, not the selected time window.
  const districts: DistrictStat[] = scopeDistricts.map((d) => {
    const baseTotal = scopeCategories.reduce((sum, c) => sum + MATRIX[d][c], 0);
    const scaledTotal = scale(baseTotal);
    const pending = Math.round(scaledTotal * 0.23);
    const baselinePending = Math.round(baseTotal * 0.23);
    return { district: d, total: scaledTotal, pending, hotspot: baselinePending >= 30 };
  });

  const totalFirs = districts.reduce((sum, d) => sum + d.total, 0);
  const totalPending = districts.reduce((sum, d) => sum + d.pending, 0);
  const hotspotCount = districts.filter((d) => d.hotspot).length;

  // Category breakdown within scope.
  const categoryCounts = scopeCategories.map((c) => {
    const count = scale(scopeDistricts.reduce((sum, d) => sum + MATRIX[d][c], 0));
    return { category: c, count };
  });
  const categoryTotal = categoryCounts.reduce((sum, c) => sum + c.count, 0);
  const categories: CategoryStat[] = categoryCounts
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((c) => ({ ...c, share: categoryTotal > 0 ? c.count / categoryTotal : 0 }));

  // Alerts filtered by scope, then redacted for the active role.
  const canSeePii = hasPermission(role, "data:view-pii");
  const canSeeNotes = hasPermission(role, "data:view-investigation-notes");
  const alerts: CrimeAlert[] = ALERTS.filter(
    (a) =>
      (filters.district === "all" || a.district === filters.district) &&
      (filters.category === "all" || a.category === filters.category)
  ).map((a) => ({
    id: a.id,
    title: a.title,
    district: a.district,
    category: a.category,
    severity: a.severity,
    raisedAt: a.raisedAt,
    suspect: canSeePii ? a.suspect : null,
    note: canSeeNotes ? a.note : null,
  }));

  // Map hotspots derived from flagged districts in scope.
  const hotspots: MapHotspot[] = districts
    .filter((d) => d.hotspot)
    .map((d) => ({
      id: `HS-${d.district}`,
      district: d.district,
      intensity: totalFirs > 0 ? Math.min(1, d.total / (totalFirs || 1)) : 0,
      x: HOTSPOT_COORDS[d.district as District].x,
      y: HOTSPOT_COORDS[d.district as District].y,
    }));

  // Trend preview scaled to the selected scope's share of the full baseline.
  const fullBaseline = DISTRICTS.reduce(
    (sum, d) => sum + CATEGORIES.reduce((s, c) => s + MATRIX[d][c], 0),
    0
  );
  const scopeBaseline = scopeDistricts.reduce(
    (sum, d) => sum + scopeCategories.reduce((s, c) => s + MATRIX[d][c], 0),
    0
  );
  const trendShare = fullBaseline > 0 ? (scopeBaseline / fullBaseline) * factor : 0;
  const trend: TrendPoint[] = TREND_BASELINE.map((p) => ({
    label: p.label,
    value: Math.round(p.value * trendShare),
  }));

  const summary: SummaryMetric[] = [
    {
      id: "total-firs",
      label: "Total FIRs",
      value: totalFirs,
      displayValue: totalFirs.toLocaleString("en-IN"),
      comparisonLabel: "+8% vs previous period",
      direction: direction(8),
    },
    {
      id: "pending-investigations",
      label: "Pending Investigations",
      value: totalPending,
      displayValue: totalPending.toLocaleString("en-IN"),
      comparisonLabel: "-3% vs previous period",
      direction: direction(-3),
    },
    {
      id: "active-hotspots",
      label: "Active Hotspots",
      value: hotspotCount,
      displayValue: hotspotCount.toLocaleString("en-IN"),
      comparisonLabel: `${hotspotCount} districts flagged`,
      direction: direction(0),
    },
    {
      id: "open-alerts",
      label: "Open Alerts",
      value: alerts.length,
      displayValue: alerts.length.toLocaleString("en-IN"),
      comparisonLabel: "Requires review",
      direction: direction(alerts.length > 0 ? 1 : 0),
    },
  ];

  return {
    isSampleData: true,
    generatedAt: new Date().toISOString(),
    filters,
    summary,
    trend,
    categories,
    districts,
    alerts,
    hotspots,
    redaction: { pii: canSeePii, notes: canSeeNotes },
  };
}

/**
 * Returns dashboard data for the active role and filters. Async to mirror a
 * real Catalyst-backed service and to exercise the loading state.
 */
export async function getDashboardOverview(
  rawFilters: Partial<DashboardFilters>,
  role: UserRole
): Promise<DashboardData> {
  const filters = normalizeFilters(rawFilters);
  await new Promise((resolve) => setTimeout(resolve, 250));
  return computeDashboard(filters, role);
}
