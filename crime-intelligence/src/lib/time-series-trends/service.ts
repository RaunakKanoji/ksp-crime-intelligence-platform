import { DISTRICTS } from "@/lib/dashboard/types";
import { STATIONS } from "@/lib/dashboard/summary";
import { MOCK_CRIME_INCIDENTS } from "@/lib/crime-map/mock-crime-data";
import type { CrimeIncidentFeature } from "@/lib/crime-map/map-types";
import {
  DEFAULT_TREND_FILTERS,
  type SeasonalityNote,
  type TimeSeriesTrendsData,
  type TrendFilters,
  type TrendInterval,
  type TrendRange,
  type TrendDataPoint,
} from "./types";

const RANGE_DAYS: Record<TrendRange, number> = {
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "1y": 365,
};

const REFERENCE_DATE = "2026-07-08";

// Helper to calculate date relative to REFERENCE_DATE
function getDateOffset(days: number): Date {
  const date = new Date(`${REFERENCE_DATE}T00:00:00+05:30`);
  date.setDate(date.getDate() - days);
  return date;
}

function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Get start date of current range
function getRangeStart(range: TrendRange): string {
  const offset = RANGE_DAYS[range];
  return formatDateISO(getDateOffset(offset));
}

// Normalize and validate filters
function normalizeFilters(input: Partial<TrendFilters>): TrendFilters {
  const range = input.range && input.range in RANGE_DAYS ? input.range : DEFAULT_TREND_FILTERS.range;
  const interval = input.interval && ["daily", "weekly", "monthly", "yearly"].includes(input.interval)
    ? input.interval
    : DEFAULT_TREND_FILTERS.interval;

  const district = input.district && (input.district === "all" || (DISTRICTS as readonly string[]).includes(input.district))
    ? input.district
    : "all";

  const stationOptions = district === "all"
    ? DISTRICTS.flatMap((d) => STATIONS[d as keyof typeof STATIONS] ?? [])
    : STATIONS[district as keyof typeof STATIONS] ?? [];

  const policeStation = input.policeStation && (input.policeStation === "all" || stationOptions.includes(input.policeStation))
    ? input.policeStation
    : "all";

  const category = input.category?.trim() || "all";

  return {
    range,
    interval,
    district,
    policeStation,
    category,
  };
}

// Check if incident matches filters and falls within the current date range
function isIncidentInScope(
  incident: CrimeIncidentFeature,
  filters: TrendFilters,
  startDateStr: string,
  endDateStr: string
): boolean {
  const props = incident.properties;
  const incidentDateStr = props.incidentDateTime.slice(0, 10);

  const withinDates = incidentDateStr >= startDateStr && incidentDateStr <= endDateStr;
  if (!withinDates) return false;

  if (filters.district !== "all" && props.district !== filters.district) return false;
  if (filters.policeStation !== "all" && props.policeStation !== filters.policeStation) return false;

  if (filters.category !== "all") {
    const cat = filters.category.toLowerCase();
    const typeMatch = props.crimeType?.toLowerCase() === cat;
    const catMatch = props.crimeCategory?.toLowerCase() === cat;
    if (!typeMatch && !catMatch) return false;
  }

  return true;
}

function isSolved(status: string): boolean {
  return status === "Closed" || status === "Charge Sheet Filed";
}

// Get the Monday of a given date (for weekly alignment)
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
}

// Generate all interval labels in order
function generateIntervalLabels(
  startStr: string,
  endStr: string,
  interval: TrendInterval
): { label: string; start: string; end: string }[] {
  const start = new Date(`${startStr}T00:00:00+05:30`);
  const end = new Date(`${endStr}T23:59:59+05:30`);
  const intervals: { label: string; start: string; end: string }[] = [];

  if (interval === "daily") {
    const current = new Date(start);
    while (current <= end) {
      const dateStr = formatDateISO(current);
      intervals.push({ label: dateStr, start: dateStr, end: dateStr });
      current.setDate(current.getDate() + 1);
    }
  } else if (interval === "weekly") {
    // Start at the Monday of the starting week
    const current = getMonday(start);
    while (current <= end) {
      const nextMon = new Date(current);
      nextMon.setDate(nextMon.getDate() + 7);

      const monStr = formatDateISO(current);
      const sunDate = new Date(nextMon);
      sunDate.setDate(sunDate.getDate() - 1);
      const sunStr = formatDateISO(sunDate);

      // Label as "WC MM/DD" (Week Commencing)
      const month = current.toLocaleString("en-IN", { month: "short" });
      const day = String(current.getDate()).padStart(2, "0");
      const label = `WC ${month} ${day}`;

      intervals.push({ label, start: monStr, end: sunStr });
      current.setDate(current.getDate() + 7);
    }
  } else if (interval === "monthly") {
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const stop = new Date(end.getFullYear(), end.getMonth() + 1, 0);

    while (current <= stop) {
      const year = current.getFullYear();
      const monthIndex = current.getMonth();
      const monthStr = current.toLocaleString("en-IN", { month: "short" });
      const label = `${monthStr} ${year}`;

      const rangeStartStr = formatDateISO(new Date(year, monthIndex, 1));
      const rangeEndStr = formatDateISO(new Date(year, monthIndex + 1, 0));

      intervals.push({ label, start: rangeStartStr, end: rangeEndStr });
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    // Yearly
    let year = start.getFullYear();
    const endYear = end.getFullYear();
    while (year <= endYear) {
      const label = `${year}`;
      const rangeStartStr = `${year}-01-01`;
      const rangeEndStr = `${year}-12-31`;
      intervals.push({ label, start: rangeStartStr, end: rangeEndStr });
      year++;
    }
  }

  return intervals;
}

// Generate mock seasonality insights based on filters
function generateSeasonalityNotes(filters: TrendFilters, hasData: boolean): SeasonalityNote[] {
  if (!hasData) return [];

  const notes: SeasonalityNote[] = [];

  if (filters.category === "all" || filters.category.toLowerCase() === "vehicle theft") {
    notes.push({
      id: "SEA-001",
      title: "Weekend Vehicle Theft Spikes",
      description: "Analysis indicates a 22% increase in vehicle thefts during weekend hours (Friday 18:00 to Sunday 22:00) near commercial hubs.",
      period: "Weekends",
      significance: "high",
    });
  }

  if (filters.category === "all" || filters.category.toLowerCase() === "cyber fraud") {
    notes.push({
      id: "SEA-002",
      title: "Mid-week Cyber Crime Activity",
      description: "Online phishing and transaction fraud alerts concentrate heavily on business weekdays (Tuesday to Thursday) during corporate operating hours.",
      period: "Business Weekdays",
      significance: "medium",
    });
  }

  if (filters.category === "all" || filters.category.toLowerCase() === "burglary") {
    notes.push({
      id: "SEA-003",
      title: "Holiday Residential Vulnerability",
      description: "Burglary rates exhibit visual spikes corresponding to regional public holiday calendars, particularly during mid-summer school vacation breaks.",
      period: "Holiday Seasons",
      significance: "high",
    });
  }

  if (notes.length === 0) {
    notes.push({
      id: "SEA-004",
      title: "General Seasonal Variation",
      description: "Overall incident volumes align with seasonal patrol deployments. No outlying anomalies observed under active filters.",
      period: "Quarterly",
      significance: "low",
    });
  }

  return notes.slice(0, 3);
}

export async function getTimeSeriesCrimeTrends(
  input: Partial<TrendFilters>
): Promise<TimeSeriesTrendsData> {
  const filters = normalizeFilters(input);

  // Artificial latency for loading skeletons
  await new Promise((resolve) => setTimeout(resolve, 200));

  const currentStartStr = getRangeStart(filters.range);
  const currentEndStr = REFERENCE_DATE;

  // Scoped current incidents
  const currentIncidents = MOCK_CRIME_INCIDENTS.features.filter((item) =>
    isIncidentInScope(item, filters, currentStartStr, currentEndStr)
  );

  // Calculate previous period parameters
  const days = RANGE_DAYS[filters.range];
  const prevStartOffset = days * 2;
  const prevEndOffset = days;
  const prevStartStr = formatDateISO(getDateOffset(prevStartOffset));
  const prevEndStr = formatDateISO(getDateOffset(prevEndOffset + 1));

  // Scoped previous incidents
  const prevIncidents = MOCK_CRIME_INCIDENTS.features.filter((item) =>
    isIncidentInScope(item, filters, prevStartStr, prevEndStr)
  );

  // Create trend data points
  const intervalRanges = generateIntervalLabels(currentStartStr, currentEndStr, filters.interval);
  const dataPoints: TrendDataPoint[] = intervalRanges.map((r) => {
    const pointIncidents = currentIncidents.filter((item) => {
      const day = item.properties.incidentDateTime.slice(0, 10);
      return day >= r.start && day <= r.end;
    });

    const categoryBreakdown: Record<string, number> = {};
    const districtBreakdown: Record<string, number> = {};
    let solvedCount = 0;

    pointIncidents.forEach((item) => {
      const c = item.properties.crimeType || "Other";
      const d = item.properties.district || "Other";

      categoryBreakdown[c] = (categoryBreakdown[c] ?? 0) + 1;
      districtBreakdown[d] = (districtBreakdown[d] ?? 0) + 1;

      if (isSolved(item.properties.caseStatus)) {
        solvedCount++;
      }
    });

    return {
      label: r.label,
      firCount: pointIncidents.length,
      solvedCount,
      categoryBreakdown,
      districtBreakdown,
    };
  });

  // Calculate totals
  const firCount = currentIncidents.length;
  const prevFirCount = prevIncidents.length;

  let changePercentage = 0;
  if (prevFirCount > 0) {
    changePercentage = Math.round(((firCount - prevFirCount) / prevFirCount) * 100);
  } else if (firCount > 0) {
    changePercentage = 100;
  }

  const solvedCount = currentIncidents.filter((item) => isSolved(item.properties.caseStatus)).length;
  const solvedRate = firCount > 0 ? Math.round((solvedCount / firCount) * 100) : 0;

  // Peak period calculation
  let peakInterval = "N/A";
  let peakCount = 0;
  dataPoints.forEach((p) => {
    if (p.firCount > peakCount) {
      peakCount = p.firCount;
      peakInterval = p.label;
    }
  });

  const seasonalityNotes = generateSeasonalityNotes(filters, firCount > 0);

  return {
    source: "mock",
    generatedAt: new Date().toISOString(),
    filters,
    dataPoints,
    totals: {
      firCount,
      prevFirCount,
      changePercentage,
      solvedRate,
      peakInterval,
      peakCount,
    },
    seasonalityNotes,
    emptyReason: firCount === 0 ? "No crime incidents match the selected temporal and administrative filters." : undefined,
  };
}
