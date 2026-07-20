import { NextResponse } from "next/server";
import { getInvestigationPriorityScores, PriorityScoreValidationError } from "@/lib/investigation-priority-score/service";
import { hasPermission, type UserRole } from "@/lib/permissions";
import type { CaseLifecycleStatus } from "@/lib/case-status-tracking/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedRole = params.get("role");
  const role: UserRole = requestedRole && ROLES.includes(requestedRole as UserRole) ? requestedRole as UserRole : "Viewer";
  if (!hasPermission(role, "page:investigation-priority-score")) return NextResponse.json({ error: "Restricted priority-score access." }, { status: 403 });
  try {
    return NextResponse.json(await getInvestigationPriorityScores({
      search: params.get("search") ?? undefined, district: params.get("district") ?? undefined,
      category: params.get("category") ?? undefined,
      status: (params.get("status") ?? undefined) as CaseLifecycleStatus | undefined,
      minimumScore: Number(params.get("minimumScore") ?? 0),
    }, role));
  } catch (error) {
    if (error instanceof PriorityScoreValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Investigation priority score failed:", error);
    return NextResponse.json({ error: "Unable to load investigation priority scores." }, { status: 500 });
  }
}
