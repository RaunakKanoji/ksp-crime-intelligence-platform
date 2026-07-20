import { NextResponse } from "next/server";
import { hasPermission, type UserRole } from "@/lib/permissions";
import {
  DashboardCustomizationValidationError,
  getDashboardCustomization,
  resetDashboardPreference,
  saveDashboardPreference,
} from "@/lib/dashboard-customization/service";
import type { SaveDashboardPreferenceInput } from "@/lib/dashboard-customization/types";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

function safeRole(value: string | null): UserRole {
  return value && ROLES.includes(value as UserRole) ? (value as UserRole) : "Viewer";
}

export async function GET(request: Request) {
  const role = safeRole(new URL(request.url).searchParams.get("role"));
  if (!hasPermission(role, "page:dashboard-customization")) {
    return NextResponse.json({ error: "Restricted dashboard customization access." }, { status: 403 });
  }
  try {
    return NextResponse.json(await getDashboardCustomization(role));
  } catch (error) {
    if (error instanceof DashboardCustomizationValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Unable to load dashboard customization." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const role = safeRole(new URL(request.url).searchParams.get("role"));
  if (!hasPermission(role, "page:dashboard-customization")) {
    return NextResponse.json({ error: "Restricted dashboard customization access." }, { status: 403 });
  }
  try {
    const body = (await request.json()) as SaveDashboardPreferenceInput;
    return NextResponse.json(await saveDashboardPreference(body, role));
  } catch (error) {
    if (error instanceof DashboardCustomizationValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Unable to save dashboard preferences." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const role = safeRole(new URL(request.url).searchParams.get("role"));
  if (!hasPermission(role, "page:dashboard-customization")) {
    return NextResponse.json({ error: "Restricted dashboard customization access." }, { status: 403 });
  }
  try {
    return NextResponse.json(await resetDashboardPreference(role));
  } catch (error) {
    if (error instanceof DashboardCustomizationValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Unable to reset dashboard preferences." }, { status: 500 });
  }
}
