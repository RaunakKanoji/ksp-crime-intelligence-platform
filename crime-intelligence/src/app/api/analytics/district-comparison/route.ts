import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { getDistrictCrimeComparison } from "@/lib/district-crime-comparison/service";
import type { ComparisonRange } from "@/lib/district-crime-comparison/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];
const RANGES: ComparisonRange[] = ["30d", "90d", "180d", "1y"];

function safeRole(value: string | null): UserRole {
  return value && ROLES.includes(value as UserRole) ? (value as UserRole) : "Viewer";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const role = safeRole(params.get("role"));

  if (!hasPermission(role, "page:district-comparison")) {
    return NextResponse.json({ error: "Restricted analytics access." }, { status: 403 });
  }

  const range = params.get("range") as ComparisonRange | null;
  const category = params.get("category") ?? "all";

  const filters = {
    range: range && RANGES.includes(range) ? range : undefined,
    category: category,
  };

  try {
    const data = getDistrictCrimeComparison(filters);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unable to load district comparison." }, { status: 500 });
  }
}
