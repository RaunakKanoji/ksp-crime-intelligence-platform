import { mapGet } from "../_handler";
import { getMockHotspotDetection, getMockHotspots } from "@/lib/crime-map/map-api";

export async function GET(request: Request) {
  return mapGet(request, ({ filters }) => {
    const data = getMockHotspots(filters);
    return {
      source: "mock",
      data,
      summary: {
        totalHotspots: data.features.length,
        criticalHotspots: data.features.filter((feature) => feature.properties.severity === "critical").length,
        risingAreas: data.features.filter((feature) => feature.properties.trend === "rising" || feature.properties.trend === "spike").length,
      },
      detection: getMockHotspotDetection(filters),
    };
  });
}
