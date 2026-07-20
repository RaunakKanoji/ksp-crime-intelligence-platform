import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { getPredictiveCrimeRisk, PredictiveCrimeRiskValidationError } from "@/lib/predictive-crime-risk/service";
import type { PredictiveRiskTimeWindow } from "@/lib/predictive-crime-risk/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

function numberParam(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedRole = params.get("role");
  const role: UserRole = requestedRole && ROLES.includes(requestedRole as UserRole) ? requestedRole as UserRole : "Viewer";
  if (!hasPermission(role, "page:predictive-crime-risk")) return NextResponse.json({ error: "Restricted predictive-crime-risk access." }, { status: 403 });
  try {
    return NextResponse.json(await getPredictiveCrimeRisk({
      search: params.get("search") ?? undefined,
      district: params.get("district") ?? undefined,
      station: params.get("station") ?? undefined,
      category: params.get("category") ?? undefined,
      timeWindow: (params.get("timeWindow") ?? undefined) as PredictiveRiskTimeWindow | undefined,
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      horizonDays: numberParam(params.get("horizonDays")),
      minimumConfidence: numberParam(params.get("minimumConfidence")),
    }, role));
  } catch (error) {
    if (error instanceof PredictiveCrimeRiskValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Predictive crime risk failed:", error);
    return NextResponse.json({ error: "Unable to load predictive crime risk." }, { status: 500 });
  }
}
