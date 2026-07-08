import type {
  CrimeIncidentFeature,
  CrimeIncidentFeatureCollection,
  CrimeSeverity,
  HotspotDetectionSummary,
  HotspotFeatureCollection,
  HotspotRanking,
} from "./map-types";
import { getTimeOfDay, severityScore, topCrimeType } from "./map-utils";

const timeWindows: HotspotDetectionSummary["timeWindows"][number]["window"][] = [
  "morning",
  "afternoon",
  "evening",
  "night",
];

function highestSeverity(items: CrimeIncidentFeature[]): CrimeSeverity {
  const ordered: CrimeSeverity[] = ["critical", "high", "medium", "low"];
  return ordered.find((severity) => items.some((item) => item.properties.severity === severity)) ?? "low";
}

function averageRisk(items: Array<{ riskScore: number }>): number {
  if (items.length === 0) return 0;
  return Math.round(items.reduce((sum, item) => sum + item.riskScore, 0) / items.length);
}

function buildRanking(
  incidents: CrimeIncidentFeatureCollection,
  hotspots: HotspotFeatureCollection,
  key: "district" | "policeStation"
): HotspotRanking[] {
  const names = new Set(incidents.features.map((incident) => incident.properties[key]));
  return Array.from(names)
    .map((name) => {
      const scopedIncidents = incidents.features.filter((incident) => incident.properties[key] === name);
      const scopedHotspots = hotspots.features.filter((hotspot) =>
        scopedIncidents.some((incident) => incident.properties.policeStation === hotspot.properties.areaName)
      );
      return {
        name,
        incidentCount: scopedIncidents.length,
        hotspotCount: scopedHotspots.length,
        dominantCrimeType: topCrimeType(scopedIncidents),
        averageRiskScore: averageRisk(scopedHotspots.map((hotspot) => ({ riskScore: hotspot.properties.riskScore }))),
        highestSeverity: highestSeverity(scopedIncidents),
      };
    })
    .sort((a, b) => b.averageRiskScore - a.averageRiskScore || b.incidentCount - a.incidentCount)
    .slice(0, 6);
}

export function buildHotspotDetectionSummary(
  incidents: CrimeIncidentFeatureCollection,
  hotspots: HotspotFeatureCollection
): HotspotDetectionSummary {
  const categoryNames = new Set(incidents.features.map((incident) => incident.properties.crimeType));

  return {
    scoringFormula:
      "riskScore = frequencyScore * 0.35 + severityScore * 0.25 + recentGrowthScore * 0.20 + timePatternScore * 0.10 + repeatPatternScore * 0.10",
    limitations: [
      "Scores describe area-level incident concentration and require human review.",
      "Mock/demo data is not operational evidence.",
      "The model does not predict individual criminal behavior or determine guilt.",
    ],
    humanReviewRequired: true,
    districtRankings: buildRanking(incidents, hotspots, "district"),
    policeStationRankings: buildRanking(incidents, hotspots, "policeStation"),
    timeWindows: timeWindows.map((window) => {
      const scopedIncidents = incidents.features.filter((incident) => getTimeOfDay(incident.properties.incidentDateTime) === window);
      const relatedStations = new Set(scopedIncidents.map((incident) => incident.properties.policeStation));
      const scopedHotspots = hotspots.features.filter((hotspot) => hotspot.properties.areaName && relatedStations.has(hotspot.properties.areaName));
      return {
        window,
        incidentCount: scopedIncidents.length,
        hotspotCount: scopedHotspots.length,
        averageRiskScore: averageRisk(scopedHotspots.map((hotspot) => ({ riskScore: hotspot.properties.riskScore }))),
      };
    }),
    categoryHotspots: Array.from(categoryNames)
      .map((crimeType) => {
        const scopedIncidents = incidents.features.filter((incident) => incident.properties.crimeType === crimeType);
        const relatedStations = new Set(scopedIncidents.map((incident) => incident.properties.policeStation));
        const scopedHotspots = hotspots.features.filter((hotspot) =>
          hotspot.properties.dominantCrimeType === crimeType
          || (hotspot.properties.areaName ? relatedStations.has(hotspot.properties.areaName) : false)
        );
        return {
          crimeType,
          incidentCount: scopedIncidents.length,
          hotspotCount: scopedHotspots.length,
          averageRiskScore: averageRisk(scopedHotspots.map((hotspot) => ({ riskScore: hotspot.properties.riskScore }))),
        };
      })
      .sort((a, b) => b.averageRiskScore - a.averageRiskScore || b.incidentCount - a.incidentCount)
      .slice(0, 8),
  };
}
