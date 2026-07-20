import { AppError } from "@/server/catalyst/errors";
import { hasPermission, type Permission, type UserRole } from "@/lib/permissions";
import type { AuthenticatedUser } from "@/server/catalyst/auth";

export type JurisdictionScopedRecord = {
  districtId?: string | null;
  stationId?: string | null;
  createdBy?: string | null;
  assignedUserId?: string | null;
};

export function requirePermission(user: AuthenticatedUser, permission: Permission): void {
  if (!hasPermission(user.role, permission)) {
    throw new AppError("PERMISSION_DENIED", "You do not have permission to perform this action.");
  }
}

export function canAccessJurisdiction(
  user: Pick<AuthenticatedUser, "role" | "districtId" | "stationId">,
  record: JurisdictionScopedRecord,
): boolean {
  if (isStatewideRole(user.role)) return true;
  if (user.stationId && record.stationId) return user.stationId === record.stationId;
  if (user.districtId && record.districtId) return user.districtId === record.districtId;
  return false;
}

export function requireRecordAccess(
  user: AuthenticatedUser,
  record: JurisdictionScopedRecord,
  message = "You do not have access to this record.",
): void {
  if (record.createdBy === user.id || record.assignedUserId === user.id) return;
  if (canAccessJurisdiction(user, record)) return;
  throw new AppError("PERMISSION_DENIED", message);
}

export function canViewSensitiveData(user: Pick<AuthenticatedUser, "role">): boolean {
  return user.role === "Admin" || user.role === "Investigator";
}

function isStatewideRole(role: UserRole): boolean {
  return role === "Admin" || role === "Analyst";
}

