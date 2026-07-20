import { AppError } from "@/server/catalyst/errors";
import { mapCatalystRole, type UserRole } from "@/lib/permissions";
import { getCatalystApp } from "@/server/catalyst/server";

export type AuthenticatedUser = {
  id: string;
  email?: string;
  role: UserRole;
  organizationId?: string;
  districtId?: string;
  stationId?: string;
};

export type ServerSessionSource = {
  user_id?: string;
  email_id?: string;
  email?: string;
  role_details?: { role_name?: string };
  role?: string;
  organization_id?: string;
  district_id?: string;
  station_id?: string;
};

export function normalizeAuthenticatedUser(source: ServerSessionSource): AuthenticatedUser {
  if (!source.user_id) {
    throw new AppError("AUTHENTICATION_REQUIRED", "Sign in to continue.");
  }

  return {
    id: source.user_id,
    email: source.email_id ?? source.email,
    role: mapCatalystRole(source.role_details?.role_name ?? source.role),
    organizationId: source.organization_id,
    districtId: source.district_id,
    stationId: source.station_id,
  };
}

export async function getAuthenticatedUser(request?: Request): Promise<AuthenticatedUser> {
  if (!request) {
    throw new AppError(
      "AUTHENTICATION_REQUIRED",
      "Server-side Catalyst session lookup requires the current request.",
    );
  }

  try {
    const catalystUser = await getCatalystApp(request).userManagement().getCurrentUser();
    return normalizeAuthenticatedUser(catalystUser as ServerSessionSource);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const email = request.headers.get("x-ksp-dev-user-email");
      const role = request.headers.get("x-ksp-dev-user-role");
      if (email && role) {
        return normalizeAuthenticatedUser({
          user_id: email,
          email_id: email,
          role,
          district_id: request.headers.get("x-ksp-dev-district-id") ?? undefined,
          station_id: request.headers.get("x-ksp-dev-station-id") ?? undefined,
        });
      }
    }

    throw new AppError("AUTHENTICATION_REQUIRED", "Sign in to continue.");
  }
}
