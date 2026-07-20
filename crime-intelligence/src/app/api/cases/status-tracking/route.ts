import { NextResponse } from "next/server";
import { getCaseStatusTracking, CaseStatusValidationError } from "@/lib/case-status-tracking/service";
import { hasPermission, type UserRole } from "@/lib/permissions";
import type { CaseLifecycleStatus, CaseSortField, SortDirection } from "@/lib/case-status-tracking/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const roleValue = params.get("role");
  const role: UserRole = roleValue && ROLES.includes(roleValue as UserRole) ? roleValue as UserRole : "Viewer";
  if (!hasPermission(role, "page:case-status-tracking")) return NextResponse.json({ error: "Restricted case-status access." }, { status: 403 });
  try {
    return NextResponse.json(await getCaseStatusTracking({
      search: params.get("search") ?? undefined, district: params.get("district") ?? undefined,
      station: params.get("station") ?? undefined, category: params.get("category") ?? undefined,
      status: (params.get("status") ?? undefined) as CaseLifecycleStatus | undefined,
      from: params.get("from") ?? undefined, to: params.get("to") ?? undefined,
      sortBy: (params.get("sortBy") ?? undefined) as CaseSortField | undefined,
      sortDirection: (params.get("sortDirection") ?? undefined) as SortDirection | undefined,
      page: Number(params.get("page") ?? 1), pageSize: Number(params.get("pageSize") ?? 5),
    }, role));
  } catch (error) {
    if (error instanceof CaseStatusValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Case status tracking failed:", error);
    return NextResponse.json({ error: "Unable to load case status tracking." }, { status: 500 });
  }
}
