import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { generateReportPreview } from "@/lib/report-builder/service";

const VALID_ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  const roleStr = params.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  // Check export permission (reuse feature:export-pdf / CSV permission checks)
  if (!hasPermission(activeRole, "feature:export-pdf")) {
    return new NextResponse("Forbidden: insufficient export permissions.", { status: 403 });
  }

  try {
    const config = await request.json();

    // Server-side validation
    if (!config.title || config.title.trim() === "") {
      return new NextResponse("Bad Request: Report title is required.", { status: 400 });
    }

    // Retrieve filtered preview data (which already has PII redacted according to role)
    const reportData = generateReportPreview(config, activeRole);

    // Build CSV contents
    const headers = [
      "FIR Number",
      "Incident Date/Time",
      "Crime Category",
      "District",
      "Police Station",
      "Case Status",
      "Accused Name",
      "Victim Name",
      "Risk Score",
    ];

    const csvRows = [headers];

    reportData.tableData.forEach((fir) => {
      csvRows.push([
        fir.firNumber,
        fir.incidentDateTime,
        fir.crimeCategory,
        fir.district,
        fir.policeStation,
        fir.caseStatus,
        fir.accusedName,
        fir.victimName,
        fir.riskScore.toString(),
      ]);
    });

    const csvString = csvRows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // AUDIT LOG mutation tracking (logged server-side)
    const { logAuditEvent } = require("@/lib/audit-logs/service");
    logAuditEvent(
      activeRole === "Admin" ? "admin@ksp.gov.in" : `${activeRole.toLowerCase()}@ksp.gov.in`,
      "Export CSV",
      "Export",
      "Success",
      `Exported CSV report: "${config.title}" containing ${reportData.tableData.length} records.`
    );

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${config.title.replace(/[^a-zA-Z0-9]/g, "_")}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV Export API error:", error);
    return new NextResponse("Internal Server Error: failed to export CSV report.", { status: 500 });
  }
}
