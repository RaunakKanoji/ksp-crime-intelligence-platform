import { type ManagedUser, type UserAuditLog } from "./types";
import { type UserRole } from "@/lib/permissions";

// Declare global variables to persist mock records across dev hot-reloads
declare global {
  var _managedUsers: ManagedUser[] | undefined;
  var _userAuditLogs: UserAuditLog[] | undefined;
}

const INITIAL_USERS: ManagedUser[] = [
  {
    id: "USR-001",
    name: "Ravi Kumar",
    email: "admin@ksp.gov.in",
    role: "Admin",
    status: "Active",
    lastActive: "2026-07-09 10:15:30",
  },
  {
    id: "USR-002",
    name: "Mohammed Ali",
    email: "ali.inv@ksp.gov.in",
    role: "Investigator",
    status: "Active",
    lastActive: "2026-07-09 09:30:15",
  },
  {
    id: "USR-003",
    name: "Suresh Gowda",
    email: "gowda.ana@ksp.gov.in",
    role: "Analyst",
    status: "Active",
    lastActive: "2026-07-08 17:45:00",
  },
  {
    id: "USR-004",
    name: "Vikram Singh",
    email: "singh.off@ksp.gov.in",
    role: "Officer",
    status: "Active",
    lastActive: "2026-07-09 11:00:22",
  },
  {
    id: "USR-005",
    name: "Deepa K.",
    email: "deepa.vie@ksp.gov.in",
    role: "Viewer",
    status: "Disabled",
    lastActive: "2026-07-01 14:22:10",
  },
];

const INITIAL_AUDITS: UserAuditLog[] = [
  {
    id: "AUD-001",
    timestamp: "2026-07-09T04:45:00Z",
    actor: "admin@ksp.gov.in",
    action: "Change Role",
    targetUser: "Suresh Gowda",
    details: "Assigned role Analyst to Suresh Gowda",
  },
  {
    id: "AUD-002",
    timestamp: "2026-07-09T05:30:00Z",
    actor: "admin@ksp.gov.in",
    action: "Disable User",
    targetUser: "Deepa K.",
    details: "Suspended system access for Deepa K.",
  },
];

export function getManagedUsers(): ManagedUser[] {
  if (!global._managedUsers) {
    global._managedUsers = [...INITIAL_USERS];
  }
  return global._managedUsers;
}

export function getAuditLogs(): UserAuditLog[] {
  if (!global._userAuditLogs) {
    global._userAuditLogs = [...INITIAL_AUDITS];
  }
  return global._userAuditLogs;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function addAuditLog(actor: string, action: string, targetUser: string, details: string) {
  const audits = getAuditLogs();
  const nextIdNum = audits.length + 1;
  const newAudit: UserAuditLog = {
    id: `AUD-${String(nextIdNum).padStart(3, "0")}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    targetUser,
    details,
  };
  audits.unshift(newAudit); // Prepend to show newest first

  // Sync to the central security audit engine
  const { logAuditEvent } = require("@/lib/audit-logs/service");
  logAuditEvent(actor, action, "Mutation", "Success", details);
}

export function createUser(
  userForm: Omit<ManagedUser, "id" | "lastActive">,
  actor: string
): ManagedUser {
  const users = getManagedUsers();

  // Trim and validate fields
  const name = userForm.name.trim();
  const email = userForm.email.trim().toLowerCase();
  const role = userForm.role;
  const status = userForm.status;

  if (!name) throw new Error("Name cannot be empty.");
  if (!email || !EMAIL_REGEX.test(email)) throw new Error("Invalid email format.");

  const duplicate = users.find((u) => u.email === email);
  if (duplicate) throw new Error("A user with this email address already exists.");

  const nextIdNum = users.length + 1;
  const newUser: ManagedUser = {
    id: `USR-${String(nextIdNum).padStart(3, "0")}`,
    name,
    email,
    role,
    status,
    lastActive: "Never Active",
  };

  users.push(newUser);

  addAuditLog(
    actor,
    "Create User",
    name,
    `Created user account "${name}" (${email}) with role [${role}] and status [${status}]`
  );

  return newUser;
}

export function updateUser(
  id: string,
  userForm: Omit<ManagedUser, "id" | "lastActive">,
  actor: string
): ManagedUser {
  const users = getManagedUsers();
  const user = users.find((u) => u.id === id);

  if (!user) throw new Error(`User with ID ${id} not found.`);

  // Trim and validate fields
  const name = userForm.name.trim();
  const email = userForm.email.trim().toLowerCase();
  const role = userForm.role;
  const status = userForm.status;

  if (!name) throw new Error("Name cannot be empty.");
  if (!email || !EMAIL_REGEX.test(email)) throw new Error("Invalid email format.");

  const duplicate = users.find((u) => u.email === email && u.id !== id);
  if (duplicate) throw new Error("Another user is already using this email address.");

  // Detect changed actions for specific audit categorizations
  let auditAction = "Edit User";
  let auditDetails = `Updated user account "${name}" (${email})`;

  if (user.status !== status) {
    auditAction = status === "Active" ? "Enable User" : "Disable User";
    auditDetails = `${status === "Active" ? "Restored" : "Suspended"} system access for user "${name}"`;
  } else if (user.role !== role) {
    auditAction = "Change Role";
    auditDetails = `Modified role of user "${name}" from [${user.role}] to [${role}]`;
  }

  user.name = name;
  user.email = email;
  user.role = role;
  user.status = status;

  addAuditLog(actor, auditAction, name, auditDetails);

  return user;
}
