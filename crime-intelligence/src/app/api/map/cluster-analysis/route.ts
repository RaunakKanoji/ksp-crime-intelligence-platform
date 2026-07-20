import { NextResponse } from "next/server";
import { analyzeGeospatialClusters, GeospatialClusterValidationError } from "@/lib/geospatial-cluster-analysis/service";
import { hasPermission, type UserRole } from "@/lib/permissions";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const roleValue = params.get("role");
  const role: UserRole = roleValue && ROLES.includes(roleValue as UserRole) ? roleValue as UserRole : "Viewer";
  if (!hasPermission(role, "page:geospatial-cluster-analysis")) return NextResponse.json({ error: "Restricted cluster-analysis access." }, { status: 403 });
  try {
    return NextResponse.json(await analyzeGeospatialClusters({
      radiusKm: Number(params.get("radiusKm") ?? 5), minimumPoints: Number(params.get("minimumPoints") ?? 2),
      category: params.get("category") ?? undefined, district: params.get("district") ?? undefined,
      boundaryId: params.get("boundaryId") ?? undefined, from: params.get("from") ?? undefined, to: params.get("to") ?? undefined,
    }, role));
  } catch (error) {
    if (error instanceof GeospatialClusterValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Geospatial cluster analysis failed:", error);
    return NextResponse.json({ error: "Unable to analyze geospatial clusters." }, { status: 500 });
  }
}
