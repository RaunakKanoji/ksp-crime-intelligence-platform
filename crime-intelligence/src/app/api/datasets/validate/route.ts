import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { validateDatasetFile } from "@/lib/dataset-upload/service";

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
    const { content, fileName } = await request.json();
    if (!content || !fileName) {
      return NextResponse.json({ error: "Bad Request: content and fileName are required." }, { status: 400 });
    }
    const report = validateDatasetFile(fileName, content);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Dataset validation route error:", error);
    return NextResponse.json({ error: error.message || "Failed to validate dataset." }, { status: 500 });
  }
}
