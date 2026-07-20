import { mapGet } from "../_handler";
import { getDatabaseBoundaries } from "@/data/services/map-service";

export async function GET(request: Request) {
  return mapGet(request, async () => ({
    source: "mock",
    data: await getDatabaseBoundaries(),
  }));
}
