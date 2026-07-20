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

  if (!hasPermission(activeRole, "feature:export-pdf")) {
    return NextResponse.json({ error: "Forbidden: Restricted reports access." }, { status: 403 });
  }

  try {
    const config = await request.json();
    
    // Server-side validation rules
    if (!config.title || config.title.trim() === "") {
      return NextResponse.json({ error: "Validation Error: Report title is required." }, { status: 400 });
    }
    if (config.range === "custom") {
      if (!config.startDate || !config.endDate) {
        return NextResponse.json({ error: "Validation Error: Start and end dates are required for custom ranges." }, { status: 400 });
      }
      if (new Date(config.startDate) > new Date(config.endDate)) {
        return NextResponse.json({ error: "Validation Error: Start date must be prior to end date." }, { status: 400 });
      }
    }

    const data = generateReportPreview(config, activeRole);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Report Preview API Error:", error);
    return NextResponse.json({ error: "Unable to generate report preview." }, { status: 500 });
  }
}
