import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { getManualReviews, resolveManualReviewItem } from "@/lib/dataset-cleaning/service";

const VALID_ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const roleStr = params.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  if (!hasPermission(activeRole, "page:dataset-upload")) {
    return NextResponse.json({ error: "Forbidden: Restricted access to manual review operations." }, { status: 403 });
  }

  const reviews = getManualReviews();
  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const roleStr = params.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  if (!hasPermission(activeRole, "page:dataset-upload")) {
    return NextResponse.json({ error: "Forbidden: Restricted access to manual review operations." }, { status: 403 });
  }

  try {
    const { id, correctedValue } = await request.json();
    if (!id || typeof correctedValue !== "string") {
      return NextResponse.json({ error: "Bad Request: Missing parameters." }, { status: 400 });
    }

    const actorEmail = activeRole === "Admin" ? "admin@ksp.gov.in" : `${activeRole.toLowerCase()}@ksp.gov.in`;
    const resolved = resolveManualReviewItem(id, correctedValue, actorEmail);
    return NextResponse.json(resolved);
  } catch (error: any) {
    console.error("Manual review route error:", error);
    return NextResponse.json({ error: error.message || "Failed to resolve manual review item." }, { status: 500 });
  }
}
