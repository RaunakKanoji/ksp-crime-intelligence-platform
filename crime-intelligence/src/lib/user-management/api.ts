import { type ManagedUser, type UserAuditLog } from "./types";
import { type UserRole } from "@/lib/permissions";
import { getManagedUsers, getAuditLogs } from "./service";

export async function fetchUsers(role: UserRole): Promise<ManagedUser[]> {
  try {
    const response = await fetch(`/api/admin/users?role=${role}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    const payload = await response.json();
    const records = Array.isArray(payload) ? payload : payload.data;
    if (!Array.isArray(records)) throw new Error("Unexpected users response shape");
    return records.map(toManagedUser);
  } catch (error) {
    console.warn("API fallback to local service:", error);
    return getManagedUsers();
  }
}

export async function createUserApi(
  userForm: Omit<ManagedUser, "id" | "lastActive">,
  role: UserRole
): Promise<ManagedUser> {
  const response = await fetch(`/api/admin/users?role=${role}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userForm),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create user");
  }

  return (await response.json()) as ManagedUser;
}

export async function updateUserApi(
  id: string,
  userForm: Omit<ManagedUser, "id" | "lastActive">,
  role: UserRole
): Promise<ManagedUser> {
  const userKey = encodeURIComponent(userForm.email || id);
  const response = await fetch(`/api/admin/users/${userKey}?role=${role}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      display_name: userForm.name,
      status: userForm.status,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(apiErrorMessage(errorData, "Failed to update user"));
  }

  const updatedPayload = await response.json();

  const roleResponse = await fetch(`/api/admin/users/${userKey}/role?role=${role}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roleName: userForm.role }),
  });

  if (!roleResponse.ok && roleResponse.status !== 409) {
    const errorData = await roleResponse.json().catch(() => ({}));
    throw new Error(apiErrorMessage(errorData, "Failed to update user role"));
  }

  return {
    ...toManagedUser(updatedPayload.data ?? updatedPayload),
    role: userForm.role,
    status: userForm.status,
  };
}

export async function fetchAuditLogs(role: UserRole): Promise<UserAuditLog[]> {
  try {
    const response = await fetch(`/api/admin/audit-logs?role=${role}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to fetch audit logs");
    return (await response.json()) as UserAuditLog[];
  } catch (error) {
    console.warn("API fallback to local service:", error);
    return getAuditLogs();
  }
}

function toManagedUser(record: any): ManagedUser {
  return {
    id: String(record.id ?? record.email ?? record.ROWID ?? ""),
    name: String(record.name ?? record.display_name ?? record.email ?? "Unknown user"),
    email: String(record.email ?? ""),
    role: (record.role ?? record.role_id ?? "Viewer") as UserRole,
    status: normalizeStatus(record.status),
    lastActive: String(record.lastActive ?? record.last_login_at ?? "Never Active"),
  };
}

function normalizeStatus(status: unknown): ManagedUser["status"] {
  return String(status ?? "active").toLowerCase() === "active" ? "Active" : "Disabled";
}

function apiErrorMessage(errorData: any, fallback: string): string {
  return errorData?.error?.message ?? errorData?.error ?? fallback;
}
