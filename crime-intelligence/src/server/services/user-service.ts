import { AppError, assertFound } from "@/server/catalyst/errors";
import { getAuthenticatedUser, type AuthenticatedUser } from "@/server/catalyst/auth";
import { configureCatalystForRequest, requireRowId } from "@/server/catalyst/server";
import { requirePermission } from "@/server/permissions";
import { userRepository, type UserRecord } from "@/server/repositories/user-repository";
import { userProfileRepository, type UserProfileRecord } from "@/server/repositories/user-profile-repository";
import { userRoleRepository, type UserRoleAssignmentRecord } from "@/server/repositories/user-role-repository";
import { jurisdictionAccessRepository, type JurisdictionAccessRecord } from "@/server/repositories/jurisdiction-access-repository";
import { recordAuditEvent } from "@/server/services/audit-service";
import { requireEnum, requireString } from "@/server/validation";
import type { ListOptions, ListResult } from "@/server/catalyst/datastore";

export type CurrentApplicationUser = {
  user: UserRecord;
  profile: UserProfileRecord | null;
  roleAssignment: UserRoleAssignmentRecord | null;
  jurisdictionAccess: JurisdictionAccessRecord[];
};

export async function ensureCurrentApplicationUser(request: Request): Promise<UserRecord> {
  configureCatalystForRequest(request);

  const identity = await getAuthenticatedUser(request);
  const email = identity.email ?? identity.id;
  const existing = await userRepository.findByEmail(email);
  if (existing) return existing;

  const now = formatCatalystDateTime(new Date());
  const displayName = identity.email?.split("@")[0] || identity.id;

  return userRepository.insert({
    email,
    display_name: displayName,
    status: "pending",
    role_id: "Viewer",
    district_id: identity.districtId,
    station_id: identity.stationId,
    phone: "",
    last_login_at: now,
    created_at: now,
    created_by: "system",
    updated_at: now,
    updated_by: "system",
    version: 1,
    is_archived: false,
    development_only: false,
  });
}

export async function getCurrentApplicationUser(identity: AuthenticatedUser): Promise<CurrentApplicationUser> {
  const lookup = identity.email ?? identity.id;
  const user = assertFound(await userRepository.findByEmail(lookup), "Application user profile not found.");
  return {
    user,
    profile: await userProfileRepository.findByUserId(user.email),
    roleAssignment: await userRoleRepository.findActiveByUserId(user.email),
    jurisdictionAccess: await jurisdictionAccessRepository.listActiveByUserId(user.email),
  };
}

export async function listUsers(
  actor: AuthenticatedUser,
  options: ListOptions = { page: 1, pageSize: 50, sortBy: "display_name", sortDirection: "asc" },
): Promise<ListResult<UserRecord>> {
  requirePermission(actor, "page:admin-settings");
  return userRepository.list(options);
}

export async function updateAllowedProfileFields(
  actor: AuthenticatedUser,
  targetUserId: string,
  values: unknown,
): Promise<UserRecord> {
  const target = assertFound(await userRepository.findByEmail(targetUserId), "User not found.");
  const isSelf = actor.email === target.email || actor.id === target.email;
  if (!isSelf) requirePermission(actor, "page:admin-settings");
  if (!values || typeof values !== "object") {
    throw new AppError("VALIDATION_FAILED", "Check the highlighted fields and try again.", {
      fieldErrors: { body: ["Expected a JSON object."] },
    });
  }

  const body = values as Record<string, unknown>;
  const next: Partial<UserRecord> = {};
  if ("display_name" in body) next.display_name = requireString(body.display_name, "display_name", { min: 2, max: 160 });
  if ("status" in body) {
    const status = requireEnum(body.status, "status", ["active", "disabled", "Active", "Disabled"] as const);
    next.status = status.toLowerCase();
  }
  if ("phone" in body && body.phone !== undefined && body.phone !== null && body.phone !== "") {
    next.phone = requireString(body.phone, "phone", { min: 7, max: 30 });
  }

  const now = formatCatalystDateTime(new Date());
  const updated = await userRepository.update(requireRowId(target as Record<string, unknown>), {
    ...target,
    ...next,
    updated_at: now,
    updated_by: actor.id,
    version: target.version + 1,
  });

  await recordAuditEvent({
    actor,
    action: isSelf ? "update_own_profile" : "update_user_profile",
    entityType: "users",
    entityId: target.email,
    previousState: { display_name: target.display_name, phone: target.phone, status: target.status },
    newState: { display_name: updated.display_name, phone: updated.phone, status: updated.status },
  });

  return updated;
}

function formatCatalystDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
