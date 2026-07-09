import { MOCK_CRIME_INCIDENTS } from "@/lib/crime-map/mock-crime-data";
import { SAMPLE_FIR_RECORDS } from "@/lib/fir/search";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { DISTRICTS } from "@/lib/dashboard/types";
import {
  type CategoryBreakdownFilters,
  type CategoryBreakdownData,
  type CategoryBreakdownItem,
  type CategoryFirDetail,
  type CategoryBreakdownRange,
  DEFAULT_CATEGORY_BREAKDOWN_FILTERS,
} from "./types";

const CATEGORY_LIST = [
  "Vehicle Theft",
  "Burglary",
  "Chain Snatching",
  "Cyber Fraud",
  "Assault",
  "Robbery",
  "Missing Person",
  "Narcotics",
] as const;

const REFERENCE_DATE = "2026-07-08";

const RANGE_DAYS: Record<CategoryBreakdownRange, number> = {
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "1y": 365,
};

function getRangeDates(range: CategoryBreakdownRange) {
  const days = RANGE_DAYS[range] || 30;

  const currentStart = new Date(`${REFERENCE_DATE}T00:00:00+05:30`);
  currentStart.setDate(currentStart.getDate() - days);
  const currentStartStr = currentStart.toISOString().slice(0, 10);

  const prevStart = new Date(`${REFERENCE_DATE}T00:00:00+05:30`);
  prevStart.setDate(prevStart.getDate() - days * 2);
  const prevStartStr = prevStart.toISOString().slice(0, 10);

  return {
    currentStart: currentStartStr,
    currentEnd: REFERENCE_DATE,
    prevStart: prevStartStr,
    prevEnd: currentStartStr,
  };
}

function normalizeFilters(input: Partial<CategoryBreakdownFilters>): CategoryBreakdownFilters {
  const range = input.range && input.range in RANGE_DAYS ? input.range : DEFAULT_CATEGORY_BREAKDOWN_FILTERS.range;
  const district =
    input.district && (input.district === "all" || (DISTRICTS as readonly string[]).includes(input.district))
      ? input.district
      : "all";

  return { range, district };
}

function isSolved(status: string): boolean {
  return status === "Closed" || status === "Charge Sheet Filed";
}

// Generate deterministic names if not present in SAMPLE_FIR_RECORDS
function getAccusedName(id: string): string {
  const accusedNames = [
    "Rajesh Kumar",
    "Mohammed Ali",
    "Suresh Gowda",
    "Vikram Singh",
    "Anil Kumar",
    "Ramesh Prasad",
    "Karthik S.",
    "Unknown Suspect",
  ];
  const charSum = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return accusedNames[charSum % accusedNames.length];
}

function getVictimName(id: string): string {
  const victimNames = [
    "Priya M.",
    "Sunitha R.",
    "Narasimha Murthy",
    "Deepa K.",
    "Vijay Bhaskar",
    "Latha S.",
    "State of Karnataka",
    "Protected Victim",
  ];
  const charSum = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return victimNames[charSum % victimNames.length];
}

export function getCrimeCategoryBreakdown(
  inputFilters: Partial<CategoryBreakdownFilters>,
  role: UserRole
): CategoryBreakdownData {
  const filters = normalizeFilters(inputFilters);
  const dateRanges = getRangeDates(filters.range);

  const canViewPii = hasPermission(role, "data:view-pii");

  // Create lookup map of FIR Search's SAMPLE_FIR_RECORDS
  const firSearchLookup = new Map(
    SAMPLE_FIR_RECORDS.map((fir) => [fir.firNumber.trim().toLowerCase(), fir])
  );

  const allIncidents = MOCK_CRIME_INCIDENTS.features;

  // Filter current period incidents
  const currentIncidents = allIncidents.filter((incident) => {
    const props = incident.properties;
    const dateStr = props.incidentDateTime.slice(0, 10);
    const withinDates = dateStr >= dateRanges.currentStart && dateStr <= dateRanges.currentEnd;
    const withinDistrict = filters.district === "all" || props.district === filters.district;
    return withinDates && withinDistrict;
  });

  // Filter previous period incidents
  const prevIncidents = allIncidents.filter((incident) => {
    const props = incident.properties;
    const dateStr = props.incidentDateTime.slice(0, 10);
    // previous period: [prevStart, currentStart) to avoid double counting boundary
    const withinDates = dateStr >= dateRanges.prevStart && dateStr < dateRanges.currentStart;
    const withinDistrict = filters.district === "all" || props.district === filters.district;
    return withinDates && withinDistrict;
  });

  const currentTotal = currentIncidents.length;

  // Compute breakdown stats per category
  const categoriesStats: CategoryBreakdownItem[] = CATEGORY_LIST.map((category) => {
    const categoryLower = category.toLowerCase();

    // Filter incidents matching this category
    const catCurrentIncidents = currentIncidents.filter((inc) => {
      const cat = inc.properties.crimeCategory?.toLowerCase() || inc.properties.crimeType?.toLowerCase() || "";
      return cat === categoryLower;
    });

    const catPrevIncidents = prevIncidents.filter((inc) => {
      const cat = inc.properties.crimeCategory?.toLowerCase() || inc.properties.crimeType?.toLowerCase() || "";
      return cat === categoryLower;
    });

    const count = catCurrentIncidents.length;
    const prevCount = catPrevIncidents.length;
    const share = currentTotal > 0 ? Number(((count / currentTotal) * 100).toFixed(1)) : 0;

    const solvedCount = catCurrentIncidents.filter((inc) => isSolved(inc.properties.caseStatus)).length;
    const solvedRate = count > 0 ? Number(((solvedCount / count) * 100).toFixed(1)) : 0;

    // Trend calculations
    let trend: "up" | "down" | "flat" = "flat";
    let change = 0;

    if (prevCount > 0) {
      change = Number((((count - prevCount) / prevCount) * 100).toFixed(1));
      if (change > 2) trend = "up";
      else if (change < -2) trend = "down";
    } else if (count > 0) {
      change = 100;
      trend = "up";
    }

    return {
      category,
      count,
      share,
      prevCount,
      trend,
      change,
      solvedCount,
      solvedRate,
    };
  });

  // Sort categories by incident count descending
  categoriesStats.sort((a, b) => b.count - a.count);

  // Group FIR details for drill-down
  const firsBreakdown: Record<string, CategoryFirDetail[]> = {};
  CATEGORY_LIST.forEach((category) => {
    const categoryLower = category.toLowerCase();
    const catCurrentIncidents = currentIncidents.filter((inc) => {
      const cat = inc.properties.crimeCategory?.toLowerCase() || inc.properties.crimeType?.toLowerCase() || "";
      return cat === categoryLower;
    });

    firsBreakdown[category] = catCurrentIncidents.map((inc) => {
      const props = inc.properties;
      const key = props.firNumber.trim().toLowerCase();
      const matchedFir = firSearchLookup.get(key);

      // Get accused and victim names (redact if not authorized)
      const rawAccused = matchedFir ? matchedFir.accusedName : getAccusedName(props.id);
      const rawVictim = matchedFir ? matchedFir.victimName : getVictimName(props.id);
      const rawSummary = matchedFir ? matchedFir.incidentSummary : (props.addressText || "Area-level location") + ": " + (props.modusOperandi || "Similar cases found in nearby time and location windows.");

      return {
        id: props.id,
        firNumber: props.firNumber,
        district: props.district,
        policeStation: props.policeStation,
        incidentDateTime: props.incidentDateTime,
        caseStatus: props.caseStatus,
        severity: props.severity,
        riskScore: props.riskScore,
        addressText: props.addressText || "Area-level location",
        accusedName: canViewPii ? rawAccused : "Redacted for security",
        victimName: canViewPii ? rawVictim : "Redacted for security",
        incidentSummary: rawSummary,
      };
    });
  });

  return {
    isSampleData: true,
    generatedAt: new Date().toISOString(),
    filters,
    totalCount: currentTotal,
    categories: categoriesStats,
    firs: firsBreakdown,
    auditNote:
      "Audit integration is pending feature 035. Crime category breakdown analysis filters and drill-down views should be logged in Catalyst Data Store when audit logs are active.",
    redaction: {
      pii: canViewPii,
    },
  };
}
