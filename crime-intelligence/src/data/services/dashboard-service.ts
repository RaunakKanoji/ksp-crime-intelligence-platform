import "server-only";

import type { DashboardData, DashboardFilters, MapHotspot } from "@/lib/dashboard/types";
import { getMockConfig } from "@/data/mock/config";
import { getRepositoryProvider } from "@/data/provider";

const RANGE_DAYS: Record<DashboardFilters["range"], number> = { "7d": 7, "30d": 30, "90d": 90 };
const ACTIVE_CASE_STATUSES = new Set(["open", "under_investigation", "evidence_review", "suspect_identified", "charge_sheet", "court_support"]);

function normalizeFilters(input: Partial<DashboardFilters>): DashboardFilters {
  const range = input.range && input.range in RANGE_DAYS ? input.range : "30d";
  return { range, district: input.district?.trim() || "all", category: input.category?.trim() || "all" };
}

function categoryMatches(name: string, filter: string): boolean {
  if (filter === "all") return true;
  const normalized = name.toLowerCase();
  const requested = filter.toLowerCase();
  if (normalized === requested) return true;
  const aliases: Record<string, string[]> = {
    theft: ["vehicle theft"],
    property: ["property dispute", "burglary", "robbery"],
    cybercrime: ["cybercrime"],
    traffic: ["traffic offence"],
    "women safety": ["crimes against women"],
    narcotics: ["narcotics"],
  };
  return aliases[requested]?.includes(normalized) ?? false;
}

function districtMatches(name: string, filter: string): boolean {
  if (filter === "all") return true;
  return name === filter || (filter === "Bengaluru City" && name.startsWith("Bengaluru"));
}

function displayCategory(name: string): string {
  if (name === "Property dispute" || name === "Burglary" || name === "Robbery") return "Property";
  if (name === "Vehicle theft") return "Theft";
  if (name === "Traffic offence") return "Traffic";
  if (name === "Crimes against women") return "Women Safety";
  return name;
}

async function allRows<T>(load: (page: number) => Promise<{ data: T[]; pagination: { hasNextPage: boolean } }>): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const result = await load(page);
    rows.push(...result.data);
    if (!result.pagination.hasNextPage) break;
  }
  return rows;
}

export async function getDatabaseDashboardOverview(input: Partial<DashboardFilters>): Promise<DashboardData> {
  const filters = normalizeFilters(input);
  const provider = getRepositoryProvider();
  const reference = new Date(getMockConfig().referenceDate);
  const from = new Date(reference.getTime() - RANGE_DAYS[filters.range] * 86_400_000).toISOString();
  const [districts, categories, incidents, firs, cases, alerts, hotspots] = await Promise.all([
    provider.districts.findMany({ page: 1, pageSize: 100 }),
    provider.categories.findMany(),
    allRows((page) => provider.incidents.findMany({ page, pageSize: 100 })),
    allRows((page) => provider.firs.findMany({ page, pageSize: 100 })),
    allRows((page) => provider.cases.findMany({ page, pageSize: 100 })),
    allRows((page) => provider.alerts.findMany({ page, pageSize: 100 })),
    provider.hotspots.getMapMarkers(),
  ]);
  const districtNames = new Map(districts.data.map((item) => [item.id, item.name]));
  const categoryNames = new Map(categories.map((item) => [item.id, item.name]));
  const currentIncidents = incidents.filter((item) => item.occurredAt >= from && item.occurredAt <= getMockConfig().referenceDate && districtMatches(districtNames.get(item.districtId) ?? item.districtId, filters.district) && categoryMatches(categoryNames.get(item.crimeCategoryId) ?? "Other", filters.category));
  const currentFirs = firs.filter((item) => item.registrationDate >= from && item.registrationDate <= getMockConfig().referenceDate && districtMatches(districtNames.get(item.districtId) ?? item.districtId, filters.district) && categoryMatches(categoryNames.get(item.crimeCategoryId) ?? "Other", filters.category));
  const scopedCases = cases.filter((item) => districtMatches(districtNames.get(item.districtId) ?? item.districtId, filters.district) && categoryMatches(categoryNames.get(item.crimeCategoryId) ?? "Other", filters.category));
  const scopedAlerts = alerts.filter((item) => item.status !== "resolved" && districtMatches(districtNames.get(item.districtId ?? "") ?? "", filters.district));
  const categoriesResult = Array.from(new Set(currentIncidents.map((item) => displayCategory(categoryNames.get(item.crimeCategoryId) ?? "Other")))).map((category) => ({ category, count: currentIncidents.filter((item) => displayCategory(categoryNames.get(item.crimeCategoryId) ?? "Other") === category).length })).sort((a, b) => b.count - a.count);
  const categoryTotal = categoriesResult.reduce((sum, item) => sum + item.count, 0) || 1;
  const districtResult = districts.data.filter((district) => districtMatches(district.name, filters.district)).map((district) => { const districtCases = scopedCases.filter((item) => item.districtId === district.id); const total = currentIncidents.filter((item) => item.districtId === district.id).length; return { district: district.name, total, pending: districtCases.filter((item) => ACTIVE_CASE_STATUSES.has(item.status)).length, hotspot: total >= 5 }; }).filter((item) => item.total > 0 || filters.district !== "all");
  const mapHotspots: MapHotspot[] = hotspots.filter((item) => districtMatches(districtNames.get(item.districtId) ?? item.districtId, filters.district) && categoryMatches(categoryNames.get(item.crimeCategoryId) ?? "Other", filters.category)).slice(0, 20).map((item) => ({ id: item.id, district: districtNames.get(item.districtId) ?? item.districtId, intensity: Math.min(1, item.severityIndex / 100), x: 50, y: 50 }));
  const trend = Array.from({ length: 6 }, (_, index) => { const start = new Date(reference.getTime() - (5 - index) * 5 * 86_400_000); const end = new Date(start.getTime() + 5 * 86_400_000); return { label: start.toISOString().slice(5, 10), value: incidents.filter((item) => item.occurredAt >= start.toISOString() && item.occurredAt < end.toISOString()).length }; });
  const clearanceRate = scopedCases.length ? Math.round((scopedCases.filter((item) => item.status === "closed").length / scopedCases.length) * 100) : 0;
  return { isSampleData: true, generatedAt: getMockConfig().referenceDate, filters, summary: [{ id: "total-firs", label: "Total FIRs", value: currentFirs.length, displayValue: currentFirs.length.toLocaleString("en-IN"), comparisonLabel: "Synthetic reference window", direction: "flat" }, { id: "pending-investigations", label: "Pending Investigations", value: scopedCases.filter((item) => ACTIVE_CASE_STATUSES.has(item.status)).length, displayValue: scopedCases.filter((item) => ACTIVE_CASE_STATUSES.has(item.status)).length.toLocaleString("en-IN"), comparisonLabel: `${clearanceRate}% closure rate`, direction: "flat" }, { id: "active-hotspots", label: "Active Hotspots", value: mapHotspots.length, displayValue: mapHotspots.length.toLocaleString("en-IN"), comparisonLabel: "Synthetic area-level signals", direction: "flat" }, { id: "open-alerts", label: "Open Alerts", value: scopedAlerts.length, displayValue: scopedAlerts.length.toLocaleString("en-IN"), comparisonLabel: "Requires human review", direction: scopedAlerts.length ? "up" : "flat" }], trend, categories: categoriesResult.map((item) => ({ ...item, share: item.count / categoryTotal })), districts: districtResult, alerts: scopedAlerts.slice(0, 10).map((item) => ({ id: item.id, title: item.title, district: districtNames.get(item.districtId ?? "") ?? "Statewide", category: "Other", severity: item.severity === "critical" ? "critical" : item.severity === "high" ? "high" : "moderate", raisedAt: item.generatedAt, suspect: null, note: null })), hotspots: mapHotspots, redaction: { pii: false, notes: false } };
}
