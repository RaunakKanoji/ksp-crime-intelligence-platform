import { mapGet } from "../_handler";
import { getDatabasePatternAlerts } from "@/data/services/map-service";

export async function GET(request: Request) {
  return mapGet(request, async ({ filters }) => ({
    source: "mock",
    data: await getDatabasePatternAlerts(filters),
  }));
}
