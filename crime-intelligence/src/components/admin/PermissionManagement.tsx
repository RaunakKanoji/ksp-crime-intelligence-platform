"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { type UserRole, type Permission, ROLE_MATRIX } from "@/lib/permissions";
import { fetchPermissionsMatrix, savePermissionsMatrix } from "@/lib/permissions-management/api";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";

const ROLES: UserRole[] = ["Viewer", "Officer", "Analyst", "Investigator", "Admin"];

interface PermissionItem {
  key: Permission;
  label: string;
  category: "Page Permissions" | "Feature & Export Permissions" | "Sensitive Data Permissions";
  description: string;
}

const ALL_PERMISSIONS: PermissionItem[] = [
  {
    key: "page:dashboard",
    label: "View Analytics Dashboard",
    category: "Page Permissions",
    description: "Access to view the home dashboard overview charts and analytics.",
  },
  {
    key: "page:fir-search",
    label: "Access FIR Search Engine",
    category: "Page Permissions",
    description: "Search, filter, and lookup case records directory lists.",
  },
  {
    key: "page:fir-detail",
    label: "Access Detailed FIR Documents",
    category: "Page Permissions",
    description: "View specific case briefs, details cards, and officer details.",
  },
  {
    key: "page:map",
    label: "Access Hotspot Map Views",
    category: "Page Permissions",
    description: "Access boundaries mapping, incidents markers, and clusters analytics.",
  },
  {
    key: "page:people",
    label: "Access Accused Profiles",
    category: "Page Permissions",
    description: "Browse accused person list directories and inspection details.",
  },
  {
    key: "page:ai-query",
    label: "Access AI Assistant (NLQ)",
    category: "Page Permissions",
    description: "Interact with natural language queries and dynamic results generation.",
  },
  {
    key: "page:ai-chat-history",
    label: "Access AI Chat History",
    category: "Page Permissions",
    description: "Review stored AI conversation metadata, query history, and result summaries.",
  },
  {
    key: "page:dataset-upload",
    label: "Access Dataset Upload & Import",
    category: "Page Permissions",
    description: "Upload crime intelligence CSV files and trigger database parsing.",
  },
  {
    key: "page:data-source-connectors",
    label: "Access Data Source Connectors",
    category: "Page Permissions",
    description: "Plan future source integrations without executing connectors or imports.",
  },
  {
    key: "page:admin-settings",
    label: "Access System Settings",
    category: "Page Permissions",
    description: "Access Role-Based Switcher, User Management, and Permission settings.",
  },
  {
    key: "page:help-and-documentation",
    label: "Access Help and Documentation",
    category: "Page Permissions",
    description: "View workflow guides, safety notes, and support channels.",
  },
  {
    key: "feature:export-pdf",
    label: "Export PDF Reports",
    category: "Feature & Export Permissions",
    description: "Generate and download custom PDF document summaries in Report Builder.",
  },
  {
    key: "feature:export-csv",
    label: "Export Raw Data to CSV",
    category: "Feature & Export Permissions",
    description: "Download detailed case metrics list grids to CSV sheets.",
  },
  {
    key: "data:view-pii",
    label: "View Unredacted PII",
    category: "Sensitive Data Permissions",
    description: "View suspect and victim names, phone numbers, and physical addresses.",
  },
  {
    key: "data:view-investigation-notes",
    label: "View Internal Case Notes",
    category: "Sensitive Data Permissions",
    description: "Access confidential notes written by investigating officers.",
  },
];

export function PermissionManagement() {
  return (
    <AppShell
      title="Permission Management"
      description="Configure role-based access rules and adjust authorization gates in real time."
      requiredPermission="page:admin-settings"
    >
      <PermissionManagementDashboard />
    </AppShell>
  );
}

function PermissionManagementDashboard() {
  const { activeRole } = useAppSession();

  const [matrix, setMatrix] = useState<Record<UserRole, Permission[]>>({} as any);
  const [draftMatrix, setDraftMatrix] = useState<Record<UserRole, Permission[]>>({} as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const loadMatrix = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPermissionsMatrix(activeRole);
      setMatrix(res);
      // Create deep copy for draft changes
      const draftCopy = {} as any;
      for (const r of ROLES) {
        draftCopy[r] = [...(res[r] || [])];
      }
      setDraftMatrix(draftCopy);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch permissions configuration from server.");
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  // Determine if matrix has pending changes
  const hasChanges = useMemo(() => {
    if (loading || !matrix || !draftMatrix) return false;
    for (const r of ROLES) {
      const orig = matrix[r] || [];
      const draft = draftMatrix[r] || [];
      if (orig.length !== draft.length) return true;
      const sortedOrig = [...orig].sort();
      const sortedDraft = [...draft].sort();
      for (let i = 0; i < sortedOrig.length; i++) {
        if (sortedOrig[i] !== sortedDraft[i]) return true;
      }
    }
    return false;
  }, [matrix, draftMatrix, loading]);

  const handleTogglePermission = (role: UserRole, key: Permission) => {
    // Safety guard: Admin role permissions are read-only to avoid accidental administrator lockout
    if (role === "Admin") return;

    setDraftMatrix((prev) => {
      const prevRolePerms = prev[role] || [];
      const updated = prevRolePerms.includes(key)
        ? prevRolePerms.filter((p) => p !== key)
        : [...prevRolePerms, key];
      return {
        ...prev,
        [role]: updated,
      };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await savePermissionsMatrix(draftMatrix, activeRole);
      setSuccess("Permissions matrix updated successfully. Authorization boundaries refreshed.");
      setMatrix(draftMatrix);
      setTimeout(() => setSuccess(null), 4000);
      
      // Reload window in a small delay to sync client-side state dynamically
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to update permissions matrix configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Deep copy static default matrix permissions
      const defaultMatrix = {} as any;
      for (const r of ROLES) {
        defaultMatrix[r] = [...ROLE_MATRIX[r].permissions];
      }

      await savePermissionsMatrix(defaultMatrix, activeRole);
      setDraftMatrix(defaultMatrix);
      setMatrix(defaultMatrix);
      setConfirmReset(false);
      setSuccess("Permissions matrix reset to Karnataka State Police defaults.");
      setTimeout(() => setSuccess(null), 3000);
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to reset permission configurations.");
    } finally {
      setSaving(false);
    }
  };

  // Group permissions for rendering
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {
      "Page Permissions": [],
      "Feature & Export Permissions": [],
      "Sensitive Data Permissions": [],
    };
    ALL_PERMISSIONS.forEach((p) => {
      if (groups[p.category]) groups[p.category].push(p);
    });
    return groups;
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner Warning alerts */}
      <section className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-red-900">
        <span className="text-xl">⚠️</span>
        <div className="text-xs leading-relaxed">
          <strong className="block font-bold mb-1 uppercase tracking-wide">Security Enforcement Override</strong>
          Changes to role mappings modify API authentication gates and layout filters immediately. Ensure compliance audits are verified before applying changes.
        </div>
      </section>

      {success && (
        <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-xs font-semibold text-emerald-800">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}

      {/* Checkbox Grid Card */}
      <main className={cardClass}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Global Roles and Capabilities Matrix</h2>
            <p className="text-xs text-slate-500">Toggle permissions to adjust system access profiles.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmReset(true)}
              disabled={saving || loading}
              className="h-9 px-3 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 font-semibold text-xs transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || !hasChanges}
              className="h-9 px-4 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {saving && (
                <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
              )}
              Save Changes
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 py-10" aria-label="Loading permissions grid">
            <div className="h-8 bg-slate-100 rounded w-full animate-pulse" />
            <div className="h-10 bg-slate-50 rounded w-full animate-pulse" />
            <div className="h-10 bg-slate-50 rounded w-full animate-pulse" />
            <div className="h-10 bg-slate-50 rounded w-full animate-pulse" />
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-1/3">Security Policy Privilege</th>
                  {ROLES.map((role) => (
                    <th key={role} className="py-3 px-4 text-center">
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {Object.entries(groupedPermissions).map(([category, items]) => (
                  <tr key={category} className="bg-slate-50/50 font-bold border-b border-slate-200">
                    <td colSpan={ROLES.length + 1} className="py-2.5 px-4 text-slate-500 uppercase tracking-wide text-[9px]">
                      {category}
                    </td>
                  </tr>
                ))}
                {ALL_PERMISSIONS.map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900">{perm.label}</p>
                        <p className="text-[10px] text-slate-400 leading-normal mt-0.5 max-w-sm">
                          {perm.description}
                        </p>
                      </div>
                    </td>
                    {ROLES.map((role) => {
                      const isAllowed = draftMatrix[role]?.includes(perm.key) || false;
                      const isLockedAdmin = role === "Admin";
                      return (
                        <td key={role} className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isAllowed || isLockedAdmin}
                            disabled={isLockedAdmin}
                            onChange={() => handleTogglePermission(role, perm.key)}
                            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Confirmation Dialog Overlay for reset mapping */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <h3 className="text-sm font-bold text-red-800">⚠️ Confirm Permissions Reset</h3>
            <p className="text-xs text-slate-600 leading-normal">
              Are you sure you want to restore the platform permission matrix to Karnataka State Police defaults?
            </p>
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-[10px] text-amber-800 leading-relaxed font-semibold">
              Warning: This immediately overwrites all customized access maps and updates active session locks.
            </div>
            <footer className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="h-9 px-4 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 text-xs transition-colors"
              >
                Confirm Reset
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
