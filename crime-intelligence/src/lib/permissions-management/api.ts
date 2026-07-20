import { type UserRole, type Permission, getPermissionsMatrix, saveClientPermissionsMatrix } from "@/lib/permissions";

export async function fetchPermissionsMatrix(role: UserRole): Promise<Record<UserRole, Permission[]>> {
  try {
    const response = await fetch(`/api/admin/permissions?role=${role}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to fetch permissions matrix");
    const result = await response.json();
    return result as Record<UserRole, Permission[]>;
  } catch (error) {
    console.warn("API fallback to local state:", error);
    return getPermissionsMatrix();
  }
}

export async function savePermissionsMatrix(
  matrix: Record<UserRole, Permission[]>,
  role: UserRole
): Promise<void> {
  const response = await fetch(`/api/admin/permissions?role=${role}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(matrix),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update permissions matrix");
  }

  // Update client-side local cache as well
  saveClientPermissionsMatrix(matrix);
}
