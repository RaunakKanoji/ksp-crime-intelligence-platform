import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { getCrimeCategoryBreakdown } from "@/lib/crime-category-breakdown/service";
import type { CategoryBreakdownRange } from "@/lib/crime-category-breakdown/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];
const RANGES: CategoryBreakdownRange[] = ["30d", "90d", "180d", "1y"];

function safeRole(value: string | null): UserRole {
  return value && ROLES.includes(value as UserRole) ? (value as UserRole) : "Viewer";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const role = safeRole(params.get("role"));

  if (!hasPermission(role, "page:crime-category-breakdown")) {
    return NextResponse.json({ error: "Restricted analytics access." }, { status: 403 });
  }

  const range = params.get("range") as CategoryBreakdownRange | null;
  const district = params.get("district") ?? "all";

  const filters = {
    range: range && RANGES.includes(range) ? range : undefined,
    district,
  };

  try {
    const data = getCrimeCategoryBreakdown(filters, role);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Category Breakdown Error:", error);
    return NextResponse.json({ error: "Unable to load crime category breakdown." }, { status: 500 });
  }
}
