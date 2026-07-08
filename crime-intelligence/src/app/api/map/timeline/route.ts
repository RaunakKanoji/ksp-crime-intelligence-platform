import { mapGet } from "../_handler";
import { getMockIncidents } from "@/lib/crime-map/map-api";

export async function GET(request: Request) {
  return mapGet(request, ({ filters }) => {
    const counts = new Map<string, number>();
    getMockIncidents(filters).features.forEach((feature) => {
      const day = feature.properties.incidentDateTime.slice(0, 10);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    });
    return {
      source: "mock",
      data: Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, incidentCount]) => ({ label, incidentCount })),
    };
  });
}
