import { mapGet } from "../_handler";
import { getMockPatternAlerts } from "@/lib/crime-map/map-api";

export async function GET(request: Request) {
  return mapGet(request, ({ filters }) => ({
    source: "mock",
    data: getMockPatternAlerts(filters),
  }));
}
