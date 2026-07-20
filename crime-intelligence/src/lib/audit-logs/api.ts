import { type AuditLogEntry } from "./types";
import { type UserRole } from "@/lib/permissions";
import { getFullAuditLogs } from "./service";

export interface AuditLogFilters {
  search?: string;
  category?: string; // "all" or specific
  status?: string; // "all" or specific
  startDate?: string;
  endDate?: string;
}

export async function fetchAuditLogsFull(
  filters: AuditLogFilters,
  role: UserRole
): Promise<AuditLogEntry[]> {
  const query = new URLSearchParams({ role });
  if (filters.search) query.append("search", filters.search);
  if (filters.category && filters.category !== "all") query.append("category", filters.category);
  if (filters.status && filters.status !== "all") query.append("status", filters.status);
  if (filters.startDate) query.append("startDate", filters.startDate);
  if (filters.endDate) query.append("endDate", filters.endDate);

  try {
    const response = await fetch(`/api/admin/audit-logs/full?${query.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to fetch full audit logs");
    return (await response.json()) as AuditLogEntry[];
  } catch (error) {
    console.warn("API fallback to local audit service:", error);
    
    // Client-side fallback filter logic
    let logs = getFullAuditLogs();
    
    if (filters.search) {
      const q = filters.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.actor.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
      );
    }
    if (filters.category && filters.category !== "all") {
      logs = logs.filter((l) => l.category === filters.category);
    }
    if (filters.status && filters.status !== "all") {
      logs = logs.filter((l) => l.status === filters.status);
    }
    if (filters.startDate) {
      logs = logs.filter((l) => l.timestamp.slice(0, 10) >= filters.startDate!);
    }
    if (filters.endDate) {
      logs = logs.filter((l) => l.timestamp.slice(0, 10) <= filters.endDate!);
    }
    
    return logs;
  }
}
