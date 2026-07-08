import { mapGet } from "../_handler";
import { getMockIncidents } from "@/lib/crime-map/map-api";

export async function GET(request: Request) {
  return mapGet(request, ({ filters }) => ({
    source: "mock",
    data: getMockIncidents(filters),
  }));
}
