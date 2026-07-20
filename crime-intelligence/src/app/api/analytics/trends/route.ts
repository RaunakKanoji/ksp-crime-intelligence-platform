import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { getTimeSeriesCrimeTrends } from "@/lib/time-series-trends/service";
import type { TrendInterval, TrendRange } from "@/lib/time-series-trends/types";
import { getDataProvider } from "@/data/mock/config";
import { getMockConfig } from "@/data/mock/config";
import { getRepositoryProvider } from "@/data/provider";

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
    if (getDataProvider() === "mock") {
      const rows = await getRepositoryProvider().dashboard.trends();
      const firCount = rows.reduce((sum, row) => sum + row.firs, 0);
      const solvedCount = rows.reduce((sum, row) => sum + row.closedCases, 0);
      return NextResponse.json({ source: "mock", generatedAt: getMockConfig().referenceDate, filters: { range: "30d", interval: "daily", district, policeStation, category }, dataPoints: rows.map((row) => ({ label: row.date, firCount: row.firs, solvedCount: row.closedCases, categoryBreakdown: {}, districtBreakdown: {} })), totals: { firCount, prevFirCount: 0, changePercentage: 0, solvedRate: firCount ? Math.round((solvedCount / firCount) * 100) : 0, peakInterval: rows.reduce((peak, row) => row.firs > peak.firs ? row : peak, rows[0] ?? { date: "N/A", firs: 0 }).date, peakCount: Math.max(0, ...rows.map((row) => row.firs)) }, seasonalityNotes: [{ id: "MOCK-SEA-001", title: "Synthetic trend window", description: "Trend values are generated from the centralized mock repository.", period: "Reference window", significance: "low" }] });
    }
    const data = await getTimeSeriesCrimeTrends(filters);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unable to load time-series crime trends." }, { status: 500 });
  }
}
