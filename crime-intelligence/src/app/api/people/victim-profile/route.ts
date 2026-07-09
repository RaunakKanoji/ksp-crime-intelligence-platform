import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import {
  getVictimProfile,
  VictimProfileValidationError,
} from "@/lib/victim-profile-summary/service";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

function safeRole(value: string | null): UserRole {
  return value && ROLES.includes(value as UserRole) ? (value as UserRole) : "Viewer";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const role = safeRole(params.get("role"));

  if (!hasPermission(role, "page:victim-profile")) {
    return NextResponse.json({ error: "Restricted victim profile access." }, { status: 403 });
  }

  try {
    const profile = await getVictimProfile(params.get("id") ?? "", role);
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof VictimProfileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Victim profile API failed:", error);
    return NextResponse.json(
      { error: "Unable to load victim profile summary." },
      { status: 500 }
    );
  }
}
