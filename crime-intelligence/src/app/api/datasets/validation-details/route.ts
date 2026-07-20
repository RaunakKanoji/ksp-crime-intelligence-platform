import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { getDetailedValidationReport } from "@/lib/dataset-upload/service";

const VALID_ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  
  const roleStr = params.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  if (!hasPermission(activeRole, "page:dataset-upload")) {
    return NextResponse.json({ error: "Forbidden: Restricted access to dataset validation." }, { status: 403 });
  }

  const fileName = params.get("fileName");
  if (!fileName) {
    return NextResponse.json({ error: "Bad Request: fileName parameter is required." }, { status: 400 });
  }

  const report = getDetailedValidationReport(fileName);
  return NextResponse.json(report);
}
