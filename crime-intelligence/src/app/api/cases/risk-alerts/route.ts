import { NextResponse } from "next/server";
import { getRiskAlerts, RiskAlertValidationError } from "@/lib/risk-alerts/service";
import { hasPermission, type UserRole } from "@/lib/permissions";
import type { RiskAlertReviewStatus, RiskAlertSeverity, RiskAlertType } from "@/lib/risk-alerts/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedRole = params.get("role");
  const role: UserRole = requestedRole && ROLES.includes(requestedRole as UserRole) ? requestedRole as UserRole : "Viewer";
  if (!hasPermission(role, "page:risk-alerts")) return NextResponse.json({ error: "Restricted risk-alert access." }, { status: 403 });
  try {
    return NextResponse.json(await getRiskAlerts({
      search: params.get("search") ?? undefined, type: (params.get("type") ?? undefined) as RiskAlertType | undefined,
      severity: (params.get("severity") ?? undefined) as RiskAlertSeverity | undefined,
      reviewStatus: (params.get("reviewStatus") ?? undefined) as RiskAlertReviewStatus | undefined,
      district: params.get("district") ?? undefined, from: params.get("from") ?? undefined, to: params.get("to") ?? undefined,
    }, role));
  } catch (error) {
    if (error instanceof RiskAlertValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Risk alerts failed:", error);
    return NextResponse.json({ error: "Unable to load risk alerts." }, { status: 500 });
  }
}
