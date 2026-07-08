import {
  cellToBoundary,
  latLngToCell,
} from "h3-js";
import type {
  CrimeIncidentFeatureCollection,
  HotspotFeatureCollection,
  HotspotProperties,
} from "./map-types";
import { classifyRisk, computeRiskScore, getTimeOfDay, severityScore, topCrimeType } from "./map-utils";

export function incidentToH3Cell(lat: number, lng: number, resolution: number): string {
  return latLngToCell(lat, lng, resolution);
}

export function h3CellToPolygon(cellId: string): GeoJSON.Position[][] {
  const ring = cellToBoundary(cellId, true).map(([lng, lat]) => [lng, lat] as GeoJSON.Position);
  if (ring.length > 0) ring.push(ring[0]);
  return [ring];
}

export function aggregateIncidentsByH3(
  incidents: CrimeIncidentFeatureCollection,
  resolution: number
): HotspotFeatureCollection {
  const groups = new Map<string, CrimeIncidentFeatureCollection["features"]>();

  incidents.features.forEach((incident) => {
    const [lng, lat] = incident.geometry.coordinates;
    const cell = incidentToH3Cell(lat, lng, resolution);
    groups.set(cell, [...(groups.get(cell) ?? []), incident]);
  });

  const features = Array.from(groups.entries())
    .filter(([, grouped]) => grouped.length >= 2)
    .map(([cellId, grouped], index) => {
      const dominantCrimeType = topCrimeType(grouped);
      const maxSeverityScore = Math.max(...grouped.map((item) => severityScore(item.properties.severity)));
      const eveningOrNight = grouped.filter((item) => {
        const bucket = getTimeOfDay(item.properties.incidentDateTime);
        return bucket === "evening" || bucket === "night";
      }).length;
      const repeatPatternScore = grouped.filter((item) => item.properties.crimeType === dominantCrimeType).length * 20;
      const scoringSignals = {
        frequencyScore: Math.min(100, grouped.length * 25),
        severityScore: maxSeverityScore,
        recentGrowthScore: grouped.length >= 3 ? 80 : 50,
        timePatternScore: Math.min(100, eveningOrNight * 30),
        repeatPatternScore: Math.min(100, repeatPatternScore),
      };
      const riskScore = computeRiskScore(scoringSignals);
      const severity = classifyRisk(riskScore);
      const properties: HotspotProperties = {
        id: `HSP-${String(index + 1).padStart(3, "0")}`,
        h3CellId: cellId,
        areaName: grouped[0]?.properties.policeStation,
        incidentCount: grouped.length,
        dominantCrimeType,
        riskScore,
        severity,
        trend: riskScore >= 81 ? "spike" : riskScore >= 61 ? "rising" : "stable",
        peakTimeWindow: eveningOrNight >= grouped.length / 2 ? "18:00-24:00" : "Daytime mixed window",
        confidence: grouped.length >= 4 ? "high" : grouped.length >= 3 ? "medium" : "low",
        explanation: `Hotspot identified from ${grouped.length} area-level incidents. Pattern detected for ${dominantCrimeType.toLowerCase()} using frequency, severity, recent growth, time-window concentration, and repeat-pattern signals.`,
        scoringSignals,
      };
      return {
        type: "Feature" as const,
        geometry: { type: "Polygon" as const, coordinates: h3CellToPolygon(cellId) },
        properties,
      };
    });

  return { type: "FeatureCollection", features };
}
