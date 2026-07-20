import { type AuditLogEntry } from "./types";

declare global {
  var _fullAuditLogs: AuditLogEntry[] | undefined;
}

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: "AUD-L-012",
    timestamp: "2026-07-09T14:35:10Z",
    actor: "admin@ksp.gov.in",
    action: "User Login",
    category: "Authentication",
    status: "Success",
    details: "Administrator session initialized successfully.",
    ipAddress: "10.15.42.101",
  },
  {
    id: "AUD-L-011",
    timestamp: "2026-07-09T13:42:15Z",
    actor: "unknown@ksp.gov.in",
    action: "User Login",
    category: "Authentication",
    status: "Failed",
    details: "Failed authentication attempt: invalid credentials.",
    ipAddress: "192.168.10.45",
  },
  {
    id: "AUD-L-010",
    timestamp: "2026-07-09T12:00:20Z",
    actor: "ali.inv@ksp.gov.in",
    action: "User Login",
    category: "Authentication",
    status: "Success",
    details: "Investigator session initialized successfully.",
    ipAddress: "10.15.42.102",
  },
  {
    id: "AUD-L-009",
    timestamp: "2026-07-09T11:15:33Z",
    actor: "ali.inv@ksp.gov.in",
    action: "View FIR Details",
    category: "Data Access",
    status: "Success",
    details: "Accessed full record of FIR KSP-2026-BLR-001 (unredacted details).",
    ipAddress: "10.15.42.102",
  },
  {
    id: "AUD-L-008",
    timestamp: "2026-07-09T10:45:00Z",
    actor: "singh.off@ksp.gov.in",
    action: "View FIR Details",
    category: "Data Access",
    status: "Failed",
    details: "Access denied: User lacks sufficient clearance level for case KSP-2026-MYS-009.",
    ipAddress: "10.15.42.104",
  },
  {
    id: "AUD-L-007",
    timestamp: "2026-07-09T09:22:18Z",
    actor: "ali.inv@ksp.gov.in",
    action: "View Victim Profile",
    category: "Data Access",
    status: "Success",
    details: "Accessed protected victim profile (Priya M.) for case KSP-2026-BLR-001.",
    ipAddress: "10.15.42.102",
  },
  {
    id: "AUD-L-006",
    timestamp: "2026-07-09T08:14:02Z",
    actor: "gowda.ana@ksp.gov.in",
    action: "Export CSV",
    category: "Export",
    status: "Success",
    details: "Exported crime analytics grid data containing 25 records to CSV.",
    ipAddress: "10.15.42.103",
  },
  {
    id: "AUD-L-005",
    timestamp: "2026-07-09T07:45:30Z",
    actor: "ali.inv@ksp.gov.in",
    action: "Export PDF",
    category: "Export",
    status: "Success",
    details: "Generated and downloaded PDF summary report: 'Bengaluru City Vehicle Theft Summary'.",
    ipAddress: "10.15.42.102",
  },
  {
    id: "AUD-L-004",
    timestamp: "2026-07-09T06:50:00Z",
    actor: "admin@ksp.gov.in",
    action: "Upload Dataset",
    category: "Mutation",
    status: "Success",
    details: "Successfully uploaded and parsed 'blr_crimes_2026_q2.csv' (140 rows integrated).",
    ipAddress: "10.15.42.101",
  },
  {
    id: "AUD-L-003",
    timestamp: "2026-07-09T05:15:22Z",
    actor: "admin@ksp.gov.in",
    action: "Change Role",
    category: "Mutation",
    status: "Success",
    details: "Modified access permissions for Suresh Gowda: assigned Analyst profile.",
    ipAddress: "10.15.42.101",
  },
  {
    id: "AUD-L-002",
    timestamp: "2026-07-09T04:22:10Z",
    actor: "gowda.ana@ksp.gov.in",
    action: "AI Natural Language Query",
    category: "System",
    status: "Success",
    details: "Executed assistant query: 'Compare burghlary spikes in Mysuru last 3 months.'",
    ipAddress: "10.15.42.103",
  },
  {
    id: "AUD-L-001",
    timestamp: "2026-07-09T03:10:45Z",
    actor: "gowda.ana@ksp.gov.in",
    action: "Generate Report Preview",
    category: "System",
    status: "Success",
    details: "Generated live UI document preview in Report Builder.",
    ipAddress: "10.15.42.103",
  },
];

export function getFullAuditLogs(): AuditLogEntry[] {
  if (!global._fullAuditLogs) {
    global._fullAuditLogs = [...INITIAL_LOGS];
  }
  return global._fullAuditLogs;
}

export function logAuditEvent(
  actor: string,
  action: string,
  category: AuditLogEntry["category"],
  status: AuditLogEntry["status"],
  details: string,
  ipAddress = "127.0.0.1"
): AuditLogEntry {
  const logs = getFullAuditLogs();
  const nextId = `AUD-L-${String(logs.length + 1).padStart(3, "0")}`;
  const newEntry: AuditLogEntry = {
    id: nextId,
    timestamp: new Date().toISOString(),
    actor,
    action,
    category,
    status,
    details,
    ipAddress,
  };

  logs.unshift(newEntry);
  if (process.env.KSP_DEBUG_AUDIT === "true") {
    console.info(`[AUDIT] ${action} - ${status}`);
  }
  return newEntry;
}
