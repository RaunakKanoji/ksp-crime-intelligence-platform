import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/permissions";
import { parseCrimeMapRequest } from "../../_handler";
import { getDataProvider } from "@/data/mock/config";
import { getDatabaseMapCase } from "@/data/services/map-service";
import { MOCK_CRIME_INCIDENTS } from "@/lib/crime-map/mock-crime-data";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { role } = parseCrimeMapRequest(request);
  const id = params.id.trim();

  if (!hasPermission(role, "page:map")) {
    return NextResponse.json({ error: "Restricted crime map access." }, { status: 403 });
  }
  if (getDataProvider() === "mock" && id.startsWith("INC-MOCK-")) {
    const data = await getDatabaseMapCase(id);
    return NextResponse.json({ source: "mock", data }, { status: data ? 200 : 404 });
  }
  if (!/^CM-\d{3}$/.test(id)) {
    return NextResponse.json({ error: "Invalid case id." }, { status: 400 });
  }

  const data = MOCK_CRIME_INCIDENTS.features.find((feature) => feature.properties.id === id) ?? null;
  return NextResponse.json({ source: "mock", data }, { status: data ? 200 : 404 });
}
