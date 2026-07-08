import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { getTimeSeriesCrimeTrends } from "@/lib/time-series-trends/service";
import type { TrendInterval, TrendRange } from "@/lib/time-series-trends/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];
const RANGES: TrendRange[] = ["30d", "90d", "180d", "1y"];
const INTERVALS: TrendInterval[] = ["daily", "weekly", "monthly", "yearly"];

function safeRole(value: string | null): UserRole {
  return value && ROLES.includes(value as UserRole) ? (value as UserRole) : "Viewer";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const role = safeRole(params.get("role"));

  if (!hasPermission(role, "page:time-series-trends")) {
    return NextResponse.json({ error: "Restricted analytics access." }, { status: 403 });
  }

  const range = params.get("range") as TrendRange | null;
  const interval = params.get("interval") as TrendInterval | null;
  const district = params.get("district") ?? "all";
  const policeStation = params.get("policeStation") ?? "all";
  const category = params.get("category") ?? "all";

  const filters = {
    range: range && RANGES.includes(range) ? range : undefined,
    interval: interval && INTERVALS.includes(interval) ? interval : undefined,
    district,
    policeStation,
    category,
  };

  try {
    const data = await getTimeSeriesCrimeTrends(filters);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unable to load time-series crime trends." }, { status: 500 });
  }
}
