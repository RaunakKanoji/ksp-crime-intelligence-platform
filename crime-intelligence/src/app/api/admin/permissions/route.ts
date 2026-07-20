import { NextResponse } from "next/server";
import { hasPermission, getPermissionsMatrix, type UserRole, type Permission } from "@/lib/permissions";
import { getAuditLogs } from "@/lib/user-management/service";

const VALID_ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const roleStr = params.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  if (!hasPermission(activeRole, "page:admin-settings")) {
    return NextResponse.json({ error: "Forbidden: Restricted admin access." }, { status: 403 });
  }

  const matrix = getPermissionsMatrix();
  return NextResponse.json(matrix);
}

export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  const roleStr = params.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  if (!hasPermission(activeRole, "page:admin-settings")) {
    return NextResponse.json({ error: "Forbidden: Restricted admin access." }, { status: 403 });
  }

  try {
    const newMatrix = (await request.json()) as Record<UserRole, Permission[]>;
    
    // Server-side validation
    for (const role in newMatrix) {
      if (!VALID_ROLES.includes(role as UserRole)) {
        return NextResponse.json({ error: `Validation Error: Invalid role key "${role}".` }, { status: 400 });
      }
    }

    // Set server-side memory matrix
    global._dynamicRoleMatrix = newMatrix;

    // Log Administrative Audit Entry
    const audits = getAuditLogs();
    const nextId = `AUD-${String(audits.length + 1).padStart(3, "0")}`;
    const logDetails = "Modified global roles and permission policies.";
    audits.unshift({
      id: nextId,
      timestamp: new Date().toISOString(),
      actor: "admin@ksp.gov.in",
      action: "Update Permissions",
      targetUser: "Permissions Matrix",
      details: logDetails,
    });

    const { logAuditEvent } = require("@/lib/audit-logs/service");
    logAuditEvent("admin@ksp.gov.in", "Update Permissions", "System", "Success", logDetails);

    return NextResponse.json({ success: true, matrix: newMatrix });
  } catch (error: any) {
    console.error("Save Permissions API error:", error);
    return NextResponse.json({ error: error.message || "Failed to update permissions." }, { status: 500 });
  }
}
