import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { startImportJob } from "@/lib/dataset-upload/service";
import { logAuditEvent } from "@/lib/audit-logs/service";

const VALID_ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function POST(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const roleStr = params.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  if (!hasPermission(activeRole, "page:dataset-upload")) {
    return NextResponse.json({ error: "Forbidden: Restricted access to dataset upload." }, { status: 403 });
  }

  try {
    const { fileName, fileSize, rowCount } = await request.json();
    if (!fileName || !fileSize || typeof rowCount !== "number") {
      return NextResponse.json({ error: "Bad Request: Missing parameters." }, { status: 400 });
    }

    const job = startImportJob(fileName, fileSize, rowCount);

    // Dynamic Security Audit Logging
    const actorEmail = activeRole === "Admin" ? "admin@ksp.gov.in" : `${activeRole.toLowerCase()}@ksp.gov.in`;
    logAuditEvent(
      actorEmail,
      "Upload Dataset",
      "Mutation",
      "Success",
      `Initiated data import job ${job.id} for file "${fileName}" containing ${rowCount} records.`
    );

    return NextResponse.json(job);
  } catch (error: any) {
    console.error("Dataset import route error:", error);
    return NextResponse.json({ error: error.message || "Failed to initiate import job." }, { status: 500 });
  }
}
