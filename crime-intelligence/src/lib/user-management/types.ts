import type { UserRole } from "@/lib/permissions";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "Active" | "Disabled";
  lastActive: string; // YYYY-MM-DD HH:MM:SS
}

export interface UserAuditLog {
  id: string;
  timestamp: string; // YYYY-MM-DDTHH:MM:SSZ
  actor: string; // Username / email of actor admin
  action: string; // "Create User" | "Edit User" | "Disable User" | "Enable User" | "Change Role"
  targetUser: string; // Name/email of target user
  details: string;
}
