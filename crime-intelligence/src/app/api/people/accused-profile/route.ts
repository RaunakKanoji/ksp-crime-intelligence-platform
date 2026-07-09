import { NextResponse } from "next/server";
import {
  AccusedProfileValidationError,
  getAccusedProfile,
} from "@/lib/accused-person-profile/service";
import { hasPermission, type UserRole } from "@/lib/permissions";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

function safeRole(value: string | null): UserRole {
  return value && ROLES.includes(value as UserRole) ? (value as UserRole) : "Viewer";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const role = safeRole(params.get("role"));

  if (!hasPermission(role, "page:accused-profile")) {
    return NextResponse.json({ error: "Restricted profile access." }, { status: 403 });
  }

  try {
    const profile = await getAccusedProfile(params.get("id") ?? "", role);
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof AccusedProfileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Accused profile API failed:", error);
    return NextResponse.json(
      { error: "Unable to load accused person profile." },
      { status: 500 }
    );
  }
}
