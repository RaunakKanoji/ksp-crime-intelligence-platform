import { MOCK_CRIME_INCIDENTS } from "@/lib/crime-map/mock-crime-data";
import {
  type DistrictComparisonFilters,
  type DistrictComparisonData,
  type DistrictComparisonRow,
  type CategoryBreakdownItem,
  type ComparisonRange,
  DISTRICT_POPULATIONS,
  DEFAULT_DISTRICT_ANALYTICS_FILTERS,
} from "./types";
import { DISTRICTS } from "@/lib/dashboard/types";

const REFERENCE_DATE = "2026-07-08";

const RANGE_DAYS: Record<ComparisonRange, number> = {
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "1y": 365,
};

function getRangeDates(range: ComparisonRange) {
  const days = RANGE_DAYS[range] || 30;

  const currentStart = new Date(`${REFERENCE_DATE}T00:00:00+05:30`);
  currentStart.setDate(currentStart.getDate() - days);
  const currentStartStr = currentStart.toISOString().slice(0, 10);

  const prevStart = new Date(`${REFERENCE_DATE}T00:00:00+05:30`);
  prevStart.setDate(prevStart.getDate() - (days * 2));
  const prevStartStr = prevStart.toISOString().slice(0, 10);

  return {
    currentStart: currentStartStr,
    currentEnd: REFERENCE_DATE,
    prevStart: prevStartStr,
    prevEnd: currentStartStr,
  };
}

function isSolved(status: string): boolean {
  return status === "Closed" || status === "Charge Sheet Filed";
}

export function getDistrictCrimeComparison(
  inputFilters: Partial<DistrictComparisonFilters>
): DistrictComparisonData {
  const range = inputFilters.range && inputFilters.range in RANGE_DAYS 
    ? inputFilters.range 
    : DEFAULT_DISTRICT_ANALYTICS_FILTERS.range;
  const category = inputFilters.category?.trim() || "all";
  
  const filters: DistrictComparisonFilters = { range, category };
  const dateRanges = getRangeDates(range);

  // Filter features based on date and category
  const allIncidents = MOCK_CRIME_INCIDENTS.features;

  const filterIncident = (dateTimeStr: string, crimeType: string, crimeCategory: string) => {
    if (category !== "all") {
      const match = crimeType.toLowerCase() === category.toLowerCase() ||
                    crimeCategory.toLowerCase() === category.toLowerCase();
      if (!match) return null;
    }
    
    const day = dateTimeStr.slice(0, 10);
    if (day >= dateRanges.currentStart && day <= dateRanges.currentEnd) {
      return "current";
    } else if (day >= dateRanges.prevStart && day < dateRanges.currentStart) {
      return "previous";
    }
    return null;
  };

  // Group incidents by district and time range
  const districtCurrentMap = new Map<string, typeof allIncidents>();
  const districtPrevMap = new Map<string, typeof allIncidents>();
  const stateCurrentList: typeof allIncidents = [];
  const statePrevList: typeof allIncidents = [];

  allIncidents.forEach((incident) => {
    const props = incident.properties;
    const period = filterIncident(props.incidentDateTime, props.crimeType, props.crimeCategory);
    
    if (period === "current") {
      stateCurrentList.push(incident);
      const list = districtCurrentMap.get(props.district) || [];
      list.push(incident);
      districtCurrentMap.set(props.district, list);
    } else if (period === "previous") {
      statePrevList.push(incident);
      const list = districtPrevMap.get(props.district) || [];
      list.push(incident);
      districtPrevMap.set(props.district, list);
    }
  });

  const districtRows: DistrictComparisonRow[] = DISTRICTS.map((district) => {
    const population = DISTRICT_POPULATIONS[district] || 1000000;
    const currentList = districtCurrentMap.get(district) || [];
    const prevList = districtPrevMap.get(district) || [];

    const firCount = currentList.length;
    const prevFirCount = prevList.length;

    const changePercentage = prevFirCount === 0 
      ? (firCount > 0 ? 100 : 0) 
      : Math.round(((firCount - prevFirCount) / prevFirCount) * 100);

    const solvedCount = currentList.filter(item => isSolved(item.properties.caseStatus)).length;
    const solvedRate = firCount === 0 ? 0 : Math.round((solvedCount / firCount) * 100);

    const sumRisk = currentList.reduce((acc, item) => acc + (item.properties.riskScore || 0), 0);
    const averageRiskScore = firCount === 0 ? 0 : Math.round((sumRisk / firCount) * 10);

    const crimeRatePer100k = parseFloat(((firCount / population) * 100000).toFixed(1));
    const prevCrimeRatePer100k = parseFloat(((prevFirCount / population) * 100000).toFixed(1));

    let trend: "up" | "down" | "flat" = "flat";
    if (firCount > prevFirCount) trend = "up";
    else if (firCount < prevFirCount) trend = "down";

    // Category breakdown for this district
    const catMap = new Map<string, number>();
    currentList.forEach(item => {
      const type = item.properties.crimeType;
      catMap.set(type, (catMap.get(type) ?? 0) + 1);
    });

    const categoryBreakdown: CategoryBreakdownItem[] = Array.from(catMap.entries())
      .map(([name, count]) => ({
        category: name,
        count,
        share: firCount === 0 ? 0 : count / firCount,
      }))
      .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

    return {
      district,
      population,
      firCount,
      prevFirCount,
      changePercentage,
      solvedCount,
      solvedRate,
      averageRiskScore: averageRiskScore / 10, // return as decimal, e.g. 7.5
      crimeRatePer100k,
      prevCrimeRatePer100k,
      trend,
      categoryBreakdown,
    };
  });

  // Sort districtRows by crimeRatePer100k desc, then firCount desc by default
  districtRows.sort((a, b) => b.crimeRatePer100k - a.crimeRatePer100k || b.firCount - a.firCount);

  // State totals
  const totalPopulation = DISTRICTS.reduce((acc, name) => acc + (DISTRICT_POPULATIONS[name] || 1000000), 0);
  const totalFirCount = stateCurrentList.length;
  const totalPrevFirCount = statePrevList.length;

  const totalChangePercentage = totalPrevFirCount === 0
    ? (totalFirCount > 0 ? 100 : 0)
    : Math.round(((totalFirCount - totalPrevFirCount) / totalPrevFirCount) * 100);

  const totalSolvedCount = stateCurrentList.filter(item => isSolved(item.properties.caseStatus)).length;
  const totalSolvedRate = totalFirCount === 0 ? 0 : Math.round((totalSolvedCount / totalFirCount) * 100);

  const totalSumRisk = stateCurrentList.reduce((acc, item) => acc + (item.properties.riskScore || 0), 0);
  const totalAverageRiskScore = totalFirCount === 0 ? 0 : Math.round((totalSumRisk / totalFirCount) * 10) / 10;

  const stateCrimeRatePer100k = parseFloat(((totalFirCount / totalPopulation) * 100000).toFixed(2));

  let stateTrend: "up" | "down" | "flat" = "flat";
  if (totalFirCount > totalPrevFirCount) stateTrend = "up";
  else if (totalFirCount < totalPrevFirCount) stateTrend = "down";

  // State Category Totals
  const stateCatMap = new Map<string, number>();
  stateCurrentList.forEach(item => {
    const type = item.properties.crimeType;
    stateCatMap.set(type, (stateCatMap.get(type) ?? 0) + 1);
  });

  const categoryTotals: CategoryBreakdownItem[] = Array.from(stateCatMap.entries())
    .map(([name, count]) => ({
      category: name,
      count,
      share: totalFirCount === 0 ? 0 : count / totalFirCount,
    }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  const emptyReason = totalFirCount === 0
    ? `No crimes recorded for range ${range}${category !== "all" ? ` under category "${category}"` : ""}.`
    : "";

  return {
    isSampleData: true,
    generatedAt: new Date().toISOString(),
    filters,
    districtRows,
    totals: {
      firCount: totalFirCount,
      prevFirCount: totalPrevFirCount,
      changePercentage: totalChangePercentage,
      solvedRate: totalSolvedRate,
      averageRiskScore: totalAverageRiskScore,
      crimeRatePer100k: stateCrimeRatePer100k,
      trend: stateTrend,
    },
    categoryTotals,
    emptyReason,
  };
}
