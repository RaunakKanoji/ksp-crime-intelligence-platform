import { mapGet } from "../_handler";
import { getMockBoundaries } from "@/lib/crime-map/map-api";

export async function GET(request: Request) {
  return mapGet(request, () => ({
    source: "mock",
    data: getMockBoundaries(),
  }));
}
