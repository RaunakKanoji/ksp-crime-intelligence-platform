import { NextResponse } from "next/server";
import { discoverCrimePatterns, CrimePatternValidationError } from "@/lib/crime-pattern-discovery/service";
import { hasPermission, type UserRole } from "@/lib/permissions";
import type { CrimePatternType } from "@/lib/crime-pattern-discovery/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const roleValue = params.get("role");
  const role: UserRole = roleValue && ROLES.includes(roleValue as UserRole) ? roleValue as UserRole : "Viewer";
  if (!hasPermission(role, "page:crime-pattern-discovery")) return NextResponse.json({ error: "Restricted pattern-discovery access." }, { status: 403 });
  try {
    return NextResponse.json(await discoverCrimePatterns({
      search: params.get("search") ?? undefined, district: params.get("district") ?? undefined,
      category: params.get("category") ?? undefined, type: (params.get("type") ?? undefined) as CrimePatternType | undefined,
      from: params.get("from") ?? undefined, to: params.get("to") ?? undefined,
      minimumOccurrences: Number(params.get("minimumOccurrences") ?? 2),
      minimumConfidence: Number(params.get("minimumConfidence") ?? 50),
    }, role));
  } catch (error) {
    if (error instanceof CrimePatternValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Crime pattern discovery failed:", error);
    return NextResponse.json({ error: "Unable to discover crime patterns." }, { status: 500 });
  }
}
