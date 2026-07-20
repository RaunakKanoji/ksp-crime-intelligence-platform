import { MOCK_CRIME_INCIDENTS } from "@/lib/crime-map/mock-crime-data";
import { getTimeOfDay } from "@/lib/crime-map/map-utils";
import { hasPermission, type UserRole } from "@/lib/permissions";
import type { CrimeIncidentFeature } from "@/lib/crime-map/map-types";
import type { LocationDetailIntelligenceResponse, LocationIntelligenceFilters, LocationTimePattern } from "./types";

interface LocationDefinition {
  id: string;
  label: string;
  district: string;
  station: string;
}

export class LocationIntelligenceValidationError extends Error {
  constructor(message: string) { super(message); this.name = "LocationIntelligenceValidationError"; }
}

const LOCATIONS: LocationDefinition[] = Array.from(
  new Map(MOCK_CRIME_INCIDENTS.features.map((item) => {
    const station = item.properties.policeStation;
    const id = `LOC-${item.properties.district.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X")}-${station.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
    return [id, { id, label: `${station} area`, district: item.properties.district, station }];
  })).values()
).sort((a, b) => a.label.localeCompare(b.label));

const REPEAT_LINKS: Record<string, Array<{ reference: string; label: string; linkedFirCount: number; confidence: "High" | "Medium" | "Low" }>> = {
  "LOC-BEN-CENTRAL-DIVISION": [{ reference: "MATCH-ACC-001-A", label: "Permission-filtered accused grouping", linkedFirCount: 3, confidence: "High" }],
  "LOC-MYS-VIJAYANAGAR": [{ reference: "MATCH-ACC-006-A", label: "Permission-filtered accused grouping", linkedFirCount: 2, confidence: "Medium" }],
};

function validDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw new LocationIntelligenceValidationError(`${label} must be a valid date.`);
}

export function validateLocationFilters(input: LocationIntelligenceFilters): LocationIntelligenceFilters {
  const locationId = input.locationId.trim().toUpperCase();
  if (!locationId || locationId.length > 80 || !/^[A-Z0-9-]+$/.test(locationId)) throw new LocationIntelligenceValidationError("A valid location identifier is required.");
  if (!LOCATIONS.some((item) => item.id === locationId)) throw new LocationIntelligenceValidationError("Location identifier is unavailable.");
  if (input.from) validDate(input.from, "From date");
  if (input.to) validDate(input.to, "To date");
  if (input.from && input.to && input.from > input.to) throw new LocationIntelligenceValidationError("From date cannot be after to date.");
  const categories = Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.crimeType)));
  if (input.category && !categories.includes(input.category)) throw new LocationIntelligenceValidationError("Category filter is invalid.");
  return { ...input, locationId };
}

function maskedCenter(incidents: CrimeIncidentFeature[]): [number, number] {
  const longitude = incidents.reduce((sum, item) => sum + item.geometry.coordinates[0], 0) / incidents.length;
  const latitude = incidents.reduce((sum, item) => sum + item.geometry.coordinates[1], 0) / incidents.length;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new LocationIntelligenceValidationError("Location coordinates are unavailable or invalid.");
  }
  return [Number(longitude.toFixed(2)), Number(latitude.toFixed(2))];
}

export async function getLocationDetailIntelligence(input: LocationIntelligenceFilters, role: UserRole): Promise<LocationDetailIntelligenceResponse | null> {
  if (!hasPermission(role, "page:location-detail-intelligence")) throw new Error("Permission denied.");
  const filters = validateLocationFilters(input);
  const location = LOCATIONS.find((item) => item.id === filters.locationId)!;
  const incidents = MOCK_CRIME_INCIDENTS.features.filter((item) =>
    item.properties.policeStation === location.station &&
    (!filters.category || item.properties.crimeType === filters.category) &&
    (!filters.from || item.properties.incidentDateTime.slice(0, 10) >= filters.from) &&
    (!filters.to || item.properties.incidentDateTime.slice(0, 10) <= filters.to)
  );
  if (!incidents.length) return null;
  const categoryCounts = new Map<string, number>();
  incidents.forEach((item) => categoryCounts.set(item.properties.crimeType, (categoryCounts.get(item.properties.crimeType) ?? 0) + 1));
  const topCategories = Array.from(categoryCounts.entries()).map(([category, count]) => ({ category, count, sharePercent: Math.round(count / incidents.length * 100) })).sort((a, b) => b.count - a.count);
  const windows: Record<LocationTimePattern["window"], number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  incidents.forEach((item) => {
    const value = getTimeOfDay(item.properties.incidentDateTime);
    const label: LocationTimePattern["window"] = value === "morning" ? "Morning" : value === "afternoon" ? "Afternoon" : value === "evening" ? "Evening" : "Night";
    windows[label] += 1;
  });
  const timePatterns = (Object.entries(windows) as Array<[LocationTimePattern["window"], number]>).map(([window, incidentCount]) => ({ window, incidentCount, sharePercent: Math.round(incidentCount / incidents.length * 100) }));
  const peak = timePatterns.sort((a, b) => b.incidentCount - a.incidentCount)[0];
  const averageRisk = Math.round(incidents.reduce((sum, item) => sum + item.properties.riskScore, 0) / incidents.length);
  const score = Math.min(100, Math.round(averageRisk * .55 + Math.min(100, incidents.length * 20) * .3 + (peak?.sharePercent ?? 0) * .15));
  const level = score >= 81 ? "Critical" : score >= 61 ? "High" : score >= 41 ? "Medium" : "Low";
  const canViewSensitive = hasPermission(role, "data:view-investigation-notes");
  const canOpenFir = hasPermission(role, "page:fir-detail");
  const repeatOffenders = (REPEAT_LINKS[location.id] ?? []).map((item) => ({
    matchReference: canViewSensitive ? item.reference : null,
    displayLabel: canViewSensitive ? item.label : "Restricted identity grouping",
    linkedFirCount: item.linkedFirCount, confidence: item.confidence,
  }));
  const recentFirs = [...incidents].sort((a, b) => b.properties.incidentDateTime.localeCompare(a.properties.incidentDateTime)).slice(0, 5).map((item) => ({
    id: item.properties.id, firNumber: item.properties.firNumber, category: item.properties.crimeType,
    incidentAt: item.properties.incidentDateTime, status: item.properties.caseStatus, detailLinkAllowed: canOpenFir,
  }));
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    location: { id: location.id, label: location.label, district: location.district, nearbyPoliceStation: location.station, maskedCenter: maskedCenter(incidents), precision: "district-scale masked" },
    incidentCount: incidents.length, topCategories, timePatterns, repeatOffenders, recentFirs,
    hotspot: {
      score, level, confidence: incidents.length >= 5 ? "High" : incidents.length >= 3 ? "Medium" : "Low",
      explanation: "Area score combines average incident risk (55%), sample frequency (30%), and peak-time concentration (15%).",
      signals: [`Average incident risk: ${averageRisk}/100`, `Filtered incident count: ${incidents.length}`, `Peak time: ${peak?.window ?? "Unavailable"} (${peak?.sharePercent ?? 0}%)`],
    },
    patrolInsight: {
      text: `Consider an authorized local review of ${topCategories[0]?.category ?? "incident"} reports during the ${peak?.window.toLowerCase() ?? "identified"} time window.`,
      caution: "This is an aggregate planning prompt, not a deployment instruction. Confirm current incidents, legal duties, staffing, local context, and community impact before any operational decision.",
      sourceFields: ["crimeType", "incidentDateTime", "policeStation", "hotspotScore"],
    },
    isSampleData: true, generatedAt: new Date().toISOString(), sensitiveReferencesRedacted: !canViewSensitive,
    explanation: "Location intelligence aggregates permission-filtered sample incidents by police-station area. Exact incident coordinates, addresses, victim identities, and accused identities are not returned.",
    limitations: [
      "The station area is a generalized analytical location and may not match an operational beat or legal boundary.",
      "Missing or imprecise geocoding, under-reporting, and changing classifications can affect counts and patterns.",
      "Hotspot and repeat-offender indicators are decision support and are not evidence or predictions.",
    ],
    auditNote: "Audit persistence is pending feature 035. Location intelligence and sensitive relationship views must be logged to Catalyst Data Store when audit logs are active.",
    availableFilters: { locations: LOCATIONS.map(({ id, label, district }) => ({ id, label, district })), categories: Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.crimeType))).sort() },
  };
}

export function getDefaultLocationId() {
  return LOCATIONS.find((item) => item.station === "Central Division")?.id ?? LOCATIONS[0].id;
}
