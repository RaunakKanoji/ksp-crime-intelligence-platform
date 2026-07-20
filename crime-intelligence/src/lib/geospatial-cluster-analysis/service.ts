import { MOCK_CRIME_INCIDENTS, MOCK_POLICE_BOUNDARIES } from "@/lib/crime-map/mock-crime-data";
import { hasPermission, type UserRole } from "@/lib/permissions";
import type { CrimeIncidentFeature } from "@/lib/crime-map/map-types";
import type { GeospatialCluster, GeospatialClusterFilters, GeospatialClusterResponse } from "./types";

export class GeospatialClusterValidationError extends Error {
  constructor(message: string) { super(message); this.name = "GeospatialClusterValidationError"; }
}

const severityRank = { low: 1, medium: 2, high: 3, critical: 4 } as const;

function distanceKm(a: CrimeIncidentFeature, b: CrimeIncidentFeature) {
  const [lon1, lat1] = a.geometry.coordinates; const [lon2, lat2] = b.geometry.coordinates;
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function validDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw new GeospatialClusterValidationError(`${label} must be a valid date.`);
}

export function validateGeospatialClusterFilters(input: GeospatialClusterFilters): Required<Pick<GeospatialClusterFilters, "radiusKm" | "minimumPoints">> & GeospatialClusterFilters {
  const radiusKm = input.radiusKm ?? 5; const minimumPoints = input.minimumPoints ?? 2;
  if (!Number.isFinite(radiusKm) || radiusKm < .5 || radiusKm > 25) throw new GeospatialClusterValidationError("Cluster radius must be between 0.5 and 25 kilometres.");
  if (!Number.isInteger(minimumPoints) || minimumPoints < 2 || minimumPoints > 10) throw new GeospatialClusterValidationError("Minimum points must be between 2 and 10.");
  if (input.from) validDate(input.from, "From date");
  if (input.to) validDate(input.to, "To date");
  if (input.from && input.to && input.from > input.to) throw new GeospatialClusterValidationError("From date cannot be after to date.");
  const categories = Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.crimeType)));
  const districts = Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.district)));
  if (input.category && !categories.includes(input.category)) throw new GeospatialClusterValidationError("Category filter is invalid.");
  if (input.district && !districts.includes(input.district)) throw new GeospatialClusterValidationError("District filter is invalid.");
  const boundaries = MOCK_POLICE_BOUNDARIES.features;
  if (input.boundaryId && !boundaries.some((item) => item.properties.id === input.boundaryId)) throw new GeospatialClusterValidationError("Boundary identifier is invalid.");
  if (input.boundaryId && input.district) {
    const boundary = boundaries.find((item) => item.properties.id === input.boundaryId);
    if (boundary?.properties.district !== input.district) throw new GeospatialClusterValidationError("Boundary does not belong to the selected district.");
  }
  return { ...input, radiusKm, minimumPoints };
}

function connectedGroups(incidents: CrimeIncidentFeature[], radiusKm: number) {
  const visited = new Set<number>(); const groups: CrimeIncidentFeature[][] = [];
  incidents.forEach((_, start) => {
    if (visited.has(start)) return;
    const queue = [start]; const group: CrimeIncidentFeature[] = []; visited.add(start);
    while (queue.length) {
      const current = queue.shift()!; group.push(incidents[current]);
      incidents.forEach((candidate, index) => {
        if (!visited.has(index) && distanceKm(incidents[current], candidate) <= radiusKm) {
          visited.add(index); queue.push(index);
        }
      });
    }
    groups.push(group);
  });
  return groups;
}

function toCluster(group: CrimeIncidentFeature[], index: number, radiusKm: number): GeospatialCluster {
  const categories = new Map<string, number>();
  group.forEach((item) => categories.set(item.properties.crimeType, (categories.get(item.properties.crimeType) ?? 0) + 1));
  const categoryDistribution = Array.from(categories.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
  const dates = group.map((item) => item.properties.incidentDateTime).sort();
  const averageRiskScore = Math.round(group.reduce((sum, item) => sum + item.properties.riskScore, 0) / group.length);
  const highestSeverity = group.map((item) => item.properties.severity).sort((a, b) => severityRank[b] - severityRank[a])[0];
  const rawLon = group.reduce((sum, item) => sum + item.geometry.coordinates[0], 0) / group.length;
  const rawLat = group.reduce((sum, item) => sum + item.geometry.coordinates[1], 0) / group.length;
  const confidence = group.length >= 5 ? "High" : group.length >= 3 ? "Medium" : "Low";
  return {
    id: `GEO-CLU-${String(index + 1).padStart(3, "0")}`, center: [Number(rawLon.toFixed(2)), Number(rawLat.toFixed(2))],
    precision: "district-scale masked", radiusKm, incidentCount: group.length,
    dominantCategory: categoryDistribution[0]?.category ?? "Mixed", categoryDistribution,
    district: group[0].properties.district,
    stations: Array.from(new Set(group.map((item) => item.properties.policeStation))).sort(),
    firstIncidentAt: dates[0], lastIncidentAt: dates[dates.length - 1], highestSeverity,
    averageRiskScore, confidence,
    explanation: `${group.length} permission-filtered incidents form one transitive neighborhood where each connected pair is within ${radiusKm} km. The displayed center is rounded to district-scale precision.`,
  };
}

export async function analyzeGeospatialClusters(input: GeospatialClusterFilters, role: UserRole): Promise<GeospatialClusterResponse> {
  if (!hasPermission(role, "page:geospatial-cluster-analysis")) throw new Error("Permission denied.");
  const filters = validateGeospatialClusterFilters(input);
  const boundary = filters.boundaryId ? MOCK_POLICE_BOUNDARIES.features.find((item) => item.properties.id === filters.boundaryId) : null;
  const incidents = MOCK_CRIME_INCIDENTS.features.filter((item) =>
    (!filters.category || item.properties.crimeType === filters.category) &&
    (!filters.district || item.properties.district === filters.district) &&
    (!boundary || item.properties.district === boundary.properties.district) &&
    (!filters.from || item.properties.incidentDateTime.slice(0, 10) >= filters.from) &&
    (!filters.to || item.properties.incidentDateTime.slice(0, 10) <= filters.to)
  );
  const qualifying = connectedGroups(incidents, filters.radiusKm).filter((group) => group.length >= filters.minimumPoints);
  const clusters = qualifying.map((group, index) => toCluster(group, index, filters.radiusKm)).sort((a, b) => b.incidentCount - a.incidentCount);
  const clusteredCount = qualifying.reduce((sum, group) => sum + group.length, 0);
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    clusters, total: clusters.length, filteredIncidentCount: incidents.length,
    unclusteredIncidentCount: incidents.length - clusteredCount, isSampleData: true,
    generatedAt: new Date().toISOString(), coordinatesMasked: true,
    algorithm: {
      name: "Radius-neighborhood connected components", radiusKm: filters.radiusKm, minimumPoints: filters.minimumPoints,
      notes: [
        "Build an undirected connection between incidents whose great-circle distance is within the configured radius.",
        "Merge transitively connected incidents into a candidate cluster.",
        "Retain only groups meeting the configured minimum-point threshold.",
        "Round aggregate centers to two decimal places before returning them to the browser.",
      ],
    },
    limitations: [
      "Clusters describe spatial concentration in the available records; they do not predict crime or identify an offender.",
      "Transitive connections can produce a cluster wider than the configured pairwise radius.",
      "Missing, imprecise, or incorrectly geocoded records can change results.",
      "Sample records and rounded centers are not operational coordinates.",
    ],
    auditNote: "Audit persistence is pending feature 035. Geospatial analysis views and any sensitive map access must be logged to Catalyst Data Store when audit logs are active.",
    availableFilters: {
      categories: Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.crimeType))).sort(),
      districts: Array.from(new Set(MOCK_CRIME_INCIDENTS.features.map((item) => item.properties.district))).sort(),
      boundaries: MOCK_POLICE_BOUNDARIES.features.map((item) => ({ id: item.properties.id, label: item.properties.policeStation, district: item.properties.district })),
    },
  };
}
