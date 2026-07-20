"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { type AuditLogEntry } from "@/lib/audit-logs/types";
import { fetchAuditLogsFull, type AuditLogFilters } from "@/lib/audit-logs/api";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";
const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 transition-colors w-full";
const labelClass = "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 w-full";

const CATEGORIES = ["Authentication", "Data Access", "Export", "Mutation", "System"];

export function AuditLogsDashboard() {
  return (
    <AppShell
      title="Audit Logs"
      description="Track platform user access, query analytics, and database export activities."
      requiredPermission="page:admin-settings"
    >
      <AuditLogsDashboardContent />
    </AppShell>
  );
}

function AuditLogsDashboardContent() {
  const { activeRole } = useAppSession();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<AuditLogFilters>({
    search: "",
    category: "all",
    status: "all",
    startDate: "",
    endDate: "",
  });

  // Modal inspection state
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAuditLogsFull(filters, activeRole);
      setLogs(res);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch administrative audit logs.");
    } finally {
      setLoading(false);
    }
  }, [filters, activeRole]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Aggregate Stats
  const stats = useMemo(() => {
    return {
      total: logs.length,
      failed: logs.filter((l) => l.status === "Failed").length,
      exports: logs.filter((l) => l.category === "Export").length,
      mutations: logs.filter((l) => l.category === "Mutation").length,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* 4 Summary Stats Grid Cards */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className={cardClass}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Audited Events</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className={cardClass}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security Violations</p>
          <p className={`text-2xl font-extrabold mt-1 ${stats.failed > 0 ? "text-red-600 animate-pulse" : "text-slate-900"}`}>
            {stats.failed}
          </p>
        </div>
        <div className={cardClass}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Exports</p>
          <p className="text-2xl font-extrabold text-teal-700 mt-1">{stats.exports}</p>
        </div>
        <div className={cardClass}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settings Mutations</p>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1">{stats.mutations}</p>
        </div>
      </section>

      {/* Query Filters */}
      <section className={`${cardClass} space-y-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <label className={labelClass}>
            Fuzzy Search
            <input
              type="text"
              placeholder="Search Actor, IP, ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Event Category
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className={inputClass}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Access Status
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className={inputClass}
            >
              <option value="all">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </label>

          <label className={labelClass}>
            Start Date
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            End Date
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {/* Main listing grid */}
      <main className={cardClass}>
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-xs font-semibold text-red-800 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3 py-10" aria-label="Loading audits list">
            <div className="h-8 bg-slate-100 rounded w-full animate-pulse" />
            <div className="h-10 bg-slate-50 rounded w-full animate-pulse" />
            <div className="h-10 bg-slate-50 rounded w-full animate-pulse" />
            <div className="h-10 bg-slate-50 rounded w-full animate-pulse" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-lg">
            <h3 className="text-xs font-bold text-slate-700">No Audited Log Entries Found</h3>
            <p className="text-[11px] text-slate-400 mt-1">Refine your query search filters.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Event Category</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(log.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-500">{log.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{log.actor}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-600">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{log.action}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">{log.details}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          log.status === "Success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}
                      >
                        {log.status === "Success" ? "Success" : "Violation"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Row detail inspect modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Security Audit Log Metadata</h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </header>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs border-b border-slate-100 pb-4">
                <div>
                  <p className="text-slate-400 font-medium">Log Record ID</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Event Category</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedLog.category}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Actor Session</p>
                  <p className="font-semibold text-teal-800 mt-0.5">{selectedLog.actor}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">IP Address</p>
                  <p className="font-mono font-semibold text-slate-900 mt-0.5">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Timestamp</p>
                  <p className="font-medium text-slate-900 mt-0.5">{new Date(selectedLog.timestamp).toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Transaction Status</p>
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border mt-0.5 ${
                      selectedLog.status === "Success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}
                  >
                    {selectedLog.status === "Success" ? "Verified Success" : "Security Violation"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-medium">Action Performed</p>
                <p className="text-sm font-bold text-slate-900">{selectedLog.action}</p>
              </div>

              <div className="space-y-1 bg-slate-50 border border-slate-100 p-3 rounded-lg">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Log Details</p>
                <p className="text-xs text-slate-700 leading-relaxed mt-1 font-medium">{selectedLog.details}</p>
              </div>
            </div>
            <footer className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="h-9 px-4 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 text-xs transition-colors"
              >
                Close Metadata
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
