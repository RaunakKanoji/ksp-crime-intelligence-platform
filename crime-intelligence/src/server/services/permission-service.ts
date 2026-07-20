import type { AuthenticatedUser } from "@/server/catalyst/auth";
import { AppError } from "@/server/catalyst/errors";
import { hasPermission, ROLE_MATRIX, type Permission, type UserRole } from "@/lib/permissions";
import { getCurrentApplicationUser } from "@/server/services/user-service";

export async function getEffectivePermissions(user: AuthenticatedUser): Promise<Permission[]> {
  const profile = await getCurrentApplicationUser(user);
  const roleName = (profile.roleAssignment?.role_id ?? profile.user.role_id ?? user.role) as UserRole;
  return ROLE_MATRIX[roleName]?.permissions ?? [];
}

export function requireServerPermission(user: AuthenticatedUser, permission: Permission): void {
  if (!hasPermission(user.role, permission)) {
    throw new AppError("PERMISSION_DENIED", "You do not have permission to perform this action.");
  }
}
