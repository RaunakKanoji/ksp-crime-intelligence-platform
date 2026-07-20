import { MOCK_CRIME_INCIDENTS } from "@/lib/crime-map/mock-crime-data";
import { SAMPLE_FIR_RECORDS } from "@/lib/fir/search";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { DISTRICTS } from "@/lib/dashboard/types";
import {
  type ReportConfig,
  type ReportPreviewData,
  type ReportChartPoint,
  type ReportTableFir,
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

const RANGE_DAYS: Record<string, number> = {
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "1y": 365,
};

function getDates(config: ReportConfig) {
  if (config.range !== "custom") {
    const days = RANGE_DAYS[config.range] || 30;
    const start = new Date(`${REFERENCE_DATE}T00:00:00+05:30`);
    start.setDate(start.getDate() - days);
    return {
      start: start.toISOString().slice(0, 10),
      end: REFERENCE_DATE,
    };
  }
  return {
    start: config.startDate || "2026-06-08",
    end: config.endDate || "2026-07-08",
  };
}

function getAccusedName(id: string): string {
  const names = [
    "Rajesh Kumar",
    "Mohammed Ali",
    "Suresh Gowda",
    "Vikram Singh",
    "Anil Kumar",
    "Ramesh Prasad",
  ];
  const sum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return names[sum % names.length];
}

function getVictimName(id: string): string {
  const names = [
    "Priya M.",
    "Sunitha R.",
    "Narasimha Murthy",
    "Deepa K.",
    "Vijay Bhaskar",
    "Latha S.",
  ];
  const sum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return names[sum % names.length];
}

export function generateReportPreview(
  config: ReportConfig,
  role: UserRole
): ReportPreviewData {
  const dates = getDates(config);
  const canViewPii = hasPermission(role, "data:view-pii");

  // Create lookup map of FIR Search's SAMPLE_FIR_RECORDS for name consistency
  const firSearchLookup = new Map(
    SAMPLE_FIR_RECORDS.map((fir) => [fir.firNumber.trim().toLowerCase(), fir])
  );

  const allIncidents = MOCK_CRIME_INCIDENTS.features;

  // Filter incidents in scope
  const filteredIncidents = allIncidents.filter((inc) => {
    const props = inc.properties;
    const dateStr = props.incidentDateTime.slice(0, 10);

    const withinDates = dateStr >= dates.start && dateStr <= dates.end;
    const withinDistrict = config.district === "all" || props.district === config.district;
    const withinCategory =
      config.category === "all" ||
      props.crimeCategory?.toLowerCase() === config.category.toLowerCase() ||
      props.crimeType?.toLowerCase() === config.category.toLowerCase();

    return withinDates && withinDistrict && withinCategory;
  });

  const totalCount = filteredIncidents.length;

  // Aggregated Category Chart Data
  const chartData: ReportChartPoint[] = CATEGORY_LIST.map((cat) => {
    const count = filteredIncidents.filter((inc) => {
      const c = inc.properties.crimeCategory?.toLowerCase() || inc.properties.crimeType?.toLowerCase() || "";
      return c === cat.toLowerCase();
    }).length;
    return { label: cat, value: count };
  }).filter((point) => config.category === "all" || point.label.toLowerCase() === config.category.toLowerCase());

  // Preview Table Data
  const tableData: ReportTableFir[] = filteredIncidents.map((inc) => {
    const props = inc.properties;
    const key = props.firNumber.trim().toLowerCase();
    const matchedFir = firSearchLookup.get(key);

    const rawAccused = matchedFir ? matchedFir.accusedName : getAccusedName(props.id);
    const rawVictim = matchedFir ? matchedFir.victimName : getVictimName(props.id);

    return {
      id: props.id,
      firNumber: props.firNumber,
      incidentDateTime: props.incidentDateTime,
      crimeCategory: props.crimeCategory || props.crimeType,
      district: props.district,
      policeStation: props.policeStation,
      caseStatus: props.caseStatus,
      accusedName: canViewPii ? rawAccused : "Redacted for security",
      victimName: canViewPii ? rawVictim : "Redacted for security",
      severity: props.severity,
      riskScore: props.riskScore,
    };
  });

  // AI Summary Generator
  let aiSummary = "";
  if (config.includeAiSummary) {
    if (totalCount === 0) {
      aiSummary = "No incidents were recorded for the specified criteria. No spatial anomalies or crime hotspots were identified.";
    } else {
      // Find top crime category in filtered data
      const sortedCategories = [...chartData].sort((a, b) => b.value - a.value);
      const topCat = sortedCategories[0];
      const solvedCases = filteredIncidents.filter((inc) => {
        const status = inc.properties.caseStatus;
        return status === "Closed" || status === "Charge Sheet Filed";
      }).length;
      const solvedRate = Number(((solvedCases / totalCount) * 100).toFixed(1));

      aiSummary = `Analysis of ${totalCount} recorded incident(s) from ${dates.start} to ${dates.end} within the selected region (${
        config.district === "all" ? "All Districts" : config.district
      }) reveals a baseline crime density. ${
        topCat && topCat.value > 0
          ? `The predominant category observed is ${topCat.label} with ${topCat.value} incident(s).`
          : ""
      } Current law enforcement resolution metrics register a case solved rate of ${solvedRate}%. Operational reviews are advised for high-frequency locations. This summary was synthesized deterministically based on active filters and remains subject to supervisory review.`;
    }
  }

  return {
    isSampleData: true,
    generatedAt: new Date().toISOString(),
    config: {
      ...config,
      startDate: dates.start,
      endDate: dates.end,
    },
    totalCount,
    chartData,
    tableData,
    aiSummary,
    auditNote:
      "Audit integration is pending feature 035. Report specifications, draft saves, and file exports must be logged in Catalyst Data Store when audit logs are active.",
    redaction: {
      pii: canViewPii,
    },
  };
}
