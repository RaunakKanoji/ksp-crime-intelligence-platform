import { NextResponse } from "next/server";
import { detectRepeatOffenders, RepeatOffenderValidationError } from "@/lib/repeat-offender-detection/service";
import { hasPermission, type UserRole } from "@/lib/permissions";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const roleValue = params.get("role");
  const role: UserRole = roleValue && ROLES.includes(roleValue as UserRole) ? roleValue as UserRole : "Viewer";
  if (!hasPermission(role, "page:repeat-offender-detection")) {
    return NextResponse.json({ error: "Restricted repeat-offender detection access." }, { status: 403 });
  }
  try {
    const minimum = params.get("minimumFirCount");
    const result = await detectRepeatOffenders({
      search: params.get("search") ?? undefined, category: params.get("category") ?? undefined,
      district: params.get("district") ?? undefined, from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      minimumFirCount: minimum === null || minimum === "" ? 2 : Number(minimum),
    }, role);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RepeatOffenderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Repeat-offender detection failed:", error);
    return NextResponse.json({ error: "Unable to run repeat-offender detection." }, { status: 500 });
  }
}
