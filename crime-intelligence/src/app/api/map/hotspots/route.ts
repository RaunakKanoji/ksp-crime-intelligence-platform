import { mapGet } from "../_handler";
import { getDatabaseMapHotspots } from "@/data/services/map-service";
import { buildHotspotDetectionSummary } from "@/lib/crime-map/hotspot-detection";
import { getDatabaseMapIncidents } from "@/data/services/map-service";

export async function GET(request: Request) {
  return mapGet(request, async ({ filters }) => {
    const data = await getDatabaseMapHotspots(filters);
    const incidents = await getDatabaseMapIncidents(filters);
    return {
      source: "mock",
      data,
      summary: {
        totalHotspots: data.features.length,
        criticalHotspots: data.features.filter((feature) => feature.properties.severity === "critical").length,
        risingAreas: data.features.filter((feature) => feature.properties.trend === "rising" || feature.properties.trend === "spike").length,
      },
      detection: buildHotspotDetectionSummary(incidents, data),
    };
  });
}
