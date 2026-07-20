export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO String YYYY-MM-DDTHH:MM:SSZ
  actor: string; // Email / role username of acting user
  action: string; // Action name (e.g. "User Login", "Export PDF")
  category: "Authentication" | "Data Access" | "Export" | "Mutation" | "System";
  status: "Success" | "Failed";
  details: string; // Narrative details
  ipAddress: string;
}
