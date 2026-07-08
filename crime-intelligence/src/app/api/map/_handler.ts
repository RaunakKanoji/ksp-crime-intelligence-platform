import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import type { CrimeMapFilters } from "@/lib/crime-map/map-types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export function parseCrimeMapRequest(request: Request): { role: UserRole; filters: CrimeMapFilters } {
  const params = new URL(request.url).searchParams;
  const roleParam = params.get("role");
  const role = roleParam && ROLES.includes(roleParam as UserRole) ? (roleParam as UserRole) : "Viewer";
  return {
    role,
    filters: {
      district: params.get("district") ?? "all",
      policeStation: params.get("policeStation") ?? "all",
      crimeType: params.get("crimeType") ?? "all",
      dateFrom: params.get("dateFrom") ?? undefined,
      dateTo: params.get("dateTo") ?? undefined,
      severity: (params.get("severity") as CrimeMapFilters["severity"]) ?? "all",
      caseStatus: params.get("caseStatus") ?? "all",
      timeOfDay: (params.get("timeOfDay") as CrimeMapFilters["timeOfDay"]) ?? "all",
      search: params.get("search") ?? "",
    },
  };
}

export async function mapGet<T>(
  request: Request,
  handler: (parsed: ReturnType<typeof parseCrimeMapRequest>) => Promise<T> | T
) {
  const parsed = parseCrimeMapRequest(request);
  if (!hasPermission(parsed.role, "page:map")) {
    return NextResponse.json({ error: "Restricted crime map access." }, { status: 403 });
  }
  try {
    return NextResponse.json(await handler(parsed));
  } catch {
    return NextResponse.json({ error: "Unable to load map data." }, { status: 500 });
  }
}
