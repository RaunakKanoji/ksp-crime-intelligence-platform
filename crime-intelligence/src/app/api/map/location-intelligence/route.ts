import { NextResponse } from "next/server";
import { getLocationDetailIntelligence, LocationIntelligenceValidationError } from "@/lib/location-detail-intelligence/service";
import { hasPermission, type UserRole } from "@/lib/permissions";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const roleValue = params.get("role");
  const role: UserRole = roleValue && ROLES.includes(roleValue as UserRole) ? roleValue as UserRole : "Viewer";
  if (!hasPermission(role, "page:location-detail-intelligence")) return NextResponse.json({ error: "Restricted location-intelligence access." }, { status: 403 });
  try {
    const data = await getLocationDetailIntelligence({
      locationId: params.get("locationId") ?? "", category: params.get("category") ?? undefined,
      from: params.get("from") ?? undefined, to: params.get("to") ?? undefined,
    }, role);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof LocationIntelligenceValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Location detail intelligence failed:", error);
    return NextResponse.json({ error: "Unable to load location intelligence." }, { status: 500 });
  }
}
