import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { getCleaningRules, addCleaningRule } from "@/lib/dataset-cleaning/service";

const VALID_ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const roleStr = params.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  if (!hasPermission(activeRole, "page:dataset-upload")) {
    return NextResponse.json({ error: "Forbidden: Restricted access to data cleaning configurations." }, { status: 403 });
  }

  const rules = getCleaningRules();
  return NextResponse.json(rules);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const roleStr = params.get("role");
  const activeRole = roleStr && VALID_ROLES.includes(roleStr as UserRole)
    ? (roleStr as UserRole)
    : "Viewer";

  if (!hasPermission(activeRole, "page:dataset-upload")) {
    return NextResponse.json({ error: "Forbidden: Restricted access to data cleaning configurations." }, { status: 403 });
  }

  try {
    const { category, alias, canonicalValue } = await request.json();
    if (!category || !alias || !canonicalValue) {
      return NextResponse.json({ error: "Bad Request: Missing required parameters." }, { status: 400 });
    }

    const newRule = addCleaningRule(category, alias, canonicalValue);
    return NextResponse.json(newRule);
  } catch (error: any) {
    console.error("Data cleaning rules route error:", error);
    return NextResponse.json({ error: error.message || "Failed to create cleaning rule." }, { status: 500 });
  }
}
