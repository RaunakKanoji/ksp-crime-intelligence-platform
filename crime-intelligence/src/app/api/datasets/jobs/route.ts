import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { getUploadJobs } from "@/lib/dataset-upload/service";

const VALID_ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const roleStr = params.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  if (!hasPermission(activeRole, "page:dataset-upload")) {
    return NextResponse.json({ error: "Forbidden: Restricted access to dataset upload." }, { status: 403 });
  }

  const jobs = getUploadJobs();
  return NextResponse.json(jobs);
}
