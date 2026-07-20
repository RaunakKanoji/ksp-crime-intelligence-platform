import { AppError, assertFound } from "@/server/catalyst/errors";
import type { AuthenticatedUser } from "@/server/catalyst/auth";
import { requireRowId } from "@/server/catalyst/server";
import { requirePermission } from "@/server/permissions";
import { roleRepository, type RoleRecord } from "@/server/repositories/role-repository";
import { userRepository } from "@/server/repositories/user-repository";
import { userRoleRepository, type UserRoleAssignmentRecord } from "@/server/repositories/user-role-repository";
import { recordAuditEvent } from "@/server/services/audit-service";

export async function listRoles(): Promise<RoleRecord[]> {
  const result = await roleRepository.list({ filters: { is_archived: false }, page: 1, pageSize: 100 });
  return result.data;
}

export async function getRoleByName(name: string): Promise<RoleRecord> {
  return assertFound(await roleRepository.findByName(name), "Role not found.");
}

export async function assignUserRole(
  actor: AuthenticatedUser,
  userId: string,
  roleName: string,
): Promise<UserRoleAssignmentRecord> {
  requirePermission(actor, "page:admin-settings");
  const user = assertFound(await userRepository.findByEmail(userId), "User not found.");
  const role = await getRoleByName(roleName);
  const active = await userRoleRepository.findActiveByUserId(user.email);
  if (active?.role_id === role.name) {
    throw new AppError("RECORD_CONFLICT", "The user already has this active role.");
  }

  const now = new Date().toISOString();
  if (active) {
    await userRoleRepository.update(requireRowId(active as Record<string, unknown>), {
      ...active,
      status: "removed",
      removed_at: now,
      removed_by: actor.id,
      updated_at: now,
      updated_by: actor.id,
      version: active.version + 1,
    });
  }

  const assignment = await userRoleRepository.insert({
    assignment_key: `${user.email}:${role.name}:${Date.now()}`,
    user_id: user.email,
    role_id: role.name,
    status: "active",
    assigned_at: now,
    assigned_by: actor.id,
    created_at: now,
    created_by: actor.id,
    updated_at: now,
    updated_by: actor.id,
    version: 1,
    is_archived: false,
  });

  await userRepository.update(requireRowId(user as Record<string, unknown>), {
    ...user,
    role_id: role.name,
    updated_at: now,
    updated_by: actor.id,
    version: user.version + 1,
  });

  await recordAuditEvent({
    actor,
    action: "assign_user_role",
    entityType: "users",
    entityId: user.email,
    previousState: active ? { role_id: active.role_id } : undefined,
    newState: { role_id: role.name },
  });

  return assignment;
}

export async function removeUserRole(actor: AuthenticatedUser, userId: string): Promise<UserRoleAssignmentRecord> {
  requirePermission(actor, "page:admin-settings");
  const user = assertFound(await userRepository.findByEmail(userId), "User not found.");
  const active = assertFound(await userRoleRepository.findActiveByUserId(user.email), "No active role assignment found.");
  const now = new Date().toISOString();

  const removed = await userRoleRepository.update(requireRowId(active as Record<string, unknown>), {
    ...active,
    status: "removed",
    removed_at: now,
    removed_by: actor.id,
    updated_at: now,
    updated_by: actor.id,
    version: active.version + 1,
  });

  await recordAuditEvent({
    actor,
    action: "remove_user_role",
    entityType: "users",
    entityId: user.email,
    previousState: { role_id: active.role_id },
    newState: { role_id: null },
  });

  return removed;
}
