import { NextResponse } from "next/server";
import { detectLinkedCases, LinkedCaseValidationError } from "@/lib/linked-case-detection/service";
import { hasPermission, type UserRole } from "@/lib/permissions";
import type { LinkConfidence } from "@/lib/linked-case-detection/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedRole = params.get("role");
  const role: UserRole = requestedRole && ROLES.includes(requestedRole as UserRole) ? requestedRole as UserRole : "Viewer";
  if (!hasPermission(role, "page:linked-case-detection")) {
    return NextResponse.json({ error: "Restricted linked-case detection access." }, { status: 403 });
  }
  try {
    return NextResponse.json(await detectLinkedCases({
      sourceFirId: params.get("sourceFirId") ?? "",
      district: params.get("district") || undefined, from: params.get("from") || undefined,
      to: params.get("to") || undefined,
      minimumConfidence: (params.get("minimumConfidence") || undefined) as LinkConfidence | undefined,
    }, role));
  } catch (error) {
    if (error instanceof LinkedCaseValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Linked-case detection failed:", error);
    return NextResponse.json({ error: "Unable to detect linked cases." }, { status: 500 });
  }
}
