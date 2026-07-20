import { mapGet } from "../_handler";
import { getDatabaseMapIncidents } from "@/data/services/map-service";

export async function GET(request: Request) {
  return mapGet(request, async ({ filters }) => ({
    source: "mock",
    data: await getDatabaseMapIncidents(filters),
  }));
}
