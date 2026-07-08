import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { getPoliceStationAnalytics } from "@/lib/police-station-analytics/service";
import type { StationAnalyticsFilters } from "@/lib/police-station-analytics/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];
const RANGES: StationAnalyticsFilters["range"][] = ["30d", "90d", "180d", "1y"];

function safeRole(value: string | null): UserRole {
  return value && ROLES.includes(value as UserRole) ? (value as UserRole) : "Viewer";
}

function parseFilters(request: Request): Partial<StationAnalyticsFilters> {
  const params = new URL(request.url).searchParams;
  const range = params.get("range");
  return {
    range: range && RANGES.includes(range as StationAnalyticsFilters["range"])
      ? (range as StationAnalyticsFilters["range"])
      : undefined,
    district: params.get("district") ?? undefined,
    policeStation: params.get("policeStation") ?? undefined,
    category: params.get("category") ?? undefined,
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const role = safeRole(params.get("role"));

  if (!hasPermission(role, "page:dashboard")) {
    return NextResponse.json({ error: "Restricted analytics access." }, { status: 403 });
  }

  try {
    return NextResponse.json(await getPoliceStationAnalytics(parseFilters(request)));
  } catch {
    return NextResponse.json({ error: "Unable to load police station analytics." }, { status: 500 });
  }
}
