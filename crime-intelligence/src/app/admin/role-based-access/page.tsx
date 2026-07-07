"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentCatalystUser } from "@/lib/catalyst/client";
import {
  UserRole,
  Permission,
  ROLE_MATRIX,
  mapCatalystRole,
  hasPermission,
  getStoredDemoRole,
  setStoredDemoRole,
} from "@/lib/permissions";

export default function RoleBasedAccessPage() {
  const [loading, setLoading] = useState(true);
  const [actualUser, setActualUser] = useState<any>(null);
  const [actualRole, setActualRole] = useState<UserRole>("Viewer");
  const [activeRole, setActiveRole] = useState<UserRole>("Viewer");
  const [status, setStatus] = useState("Initializing Zoho Catalyst...");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const user = await getCurrentCatalystUser();
        setActualUser(user);
        const userRole = mapCatalystRole(user.role_details?.role_name);
        setActualRole(userRole);

        const storedMock = getStoredDemoRole();
        setActiveRole(storedMock || userRole);
        setLoading(false);
      } catch (err) {
        console.error(err);
        window.location.replace("/login?service_url=/admin/role-based-access");
      }
    }

    init();
  }, []);

  const handleRoleOverride = (role: UserRole) => {
    setActiveRole(role);
    setStoredDemoRole(role);
    setSuccessMessage(`Simulated role updated to ${role} successfully.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleClearOverride = () => {
    setStoredDemoRole(null);
    setActiveRole(actualRole);
    setSuccessMessage(`Cleared simulation. Reset to actual role: ${actualRole}.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const permissionsList: { key: Permission; label: string; category: string }[] = [
    { key: "page:dashboard", label: "View Analytics Dashboard", category: "Page-level" },
    { key: "page:fir-search", label: "Access FIR Search Engine", category: "Page-level" },
    { key: "page:fir-detail", label: "Access Detailed FIR Documents", category: "Page-level" },
    { key: "page:map", label: "Access Hotspot Map Views", category: "Page-level" },
    { key: "page:people", label: "Access Accused/Victim Profiles", category: "Page-level" },
    { key: "page:ai-query", label: "Access AI Assistant (NLQ)", category: "Page-level" },
    { key: "page:dataset-upload", label: "Access Dataset Upload & Import", category: "Page-level" },
    { key: "page:admin-settings", label: "Access System Settings", category: "Page-level" },
    { key: "feature:export-pdf", label: "Export PDF Reports", category: "Feature-level" },
    { key: "feature:export-csv", label: "Export Raw Data to CSV", category: "Feature-level" },
    { key: "data:view-pii", label: "View Unredacted PII (Names, Locations)", category: "Data-level" },
    { key: "data:view-investigation-notes", label: "View Internal Case Case Notes", category: "Data-level" },
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">{status}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold tracking-tight text-slate-950">
              KSP Crime Intelligence
            </span>
            <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">
              Demo Environment
            </span>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-950 transition"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Role-Based Access
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Configure and test Karnataka State Police portal roles, page-level authorization, feature capabilities, and simulated data access policies.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 animate-fade-in">
            {successMessage}
          </div>
        )}

        {/* Top Section - Roles Control Card */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* User Details & Active Role */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Current Session
            </h2>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Authenticated Account</dt>
                <dd className="mt-1 font-medium">{actualUser?.email_id || "Unresolved"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Actual Platform Role</dt>
                <dd className="mt-1 font-semibold text-teal-700">{actualRole}</dd>
              </div>
              <div className="sm:col-span-2 border-t border-slate-100 pt-4">
                <dt className="text-sm text-slate-500">Effective Active Role</dt>
                <dd className="mt-1 flex items-center gap-3">
                  <span className="text-2xl font-bold text-slate-950">{activeRole}</span>
                  {activeRole !== actualRole && (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                      Simulated
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            {activeRole !== actualRole && (
              <button
                type="button"
                onClick={handleClearOverride}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Clear Role Simulation
              </button>
            )}
          </div>

          {/* Role simulation trigger */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Simulate Portal Roles
              </h2>
              <p className="text-sm text-slate-500">
                Switch roles locally to verify how layouts, dashboard widgets, search results, and action buttons adapt.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(["Admin", "Investigator", "Analyst", "Officer", "Viewer"] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleOverride(role)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition text-center ${
                    activeRole === role
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Roles details matrix */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Role Permissions Matrix
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Karnataka State Police default capabilities and restrictions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-medium text-slate-900">
                  <th className="px-6 py-4">Capability / Policy</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Viewer</th>
                  <th className="px-6 py-4 text-center">Officer</th>
                  <th className="px-6 py-4 text-center">Analyst</th>
                  <th className="px-6 py-4 text-center">Investigator</th>
                  <th className="px-6 py-4 text-center">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissionsList.map((perm) => (
                  <tr
                    key={perm.key}
                    className={`hover:bg-slate-50 transition ${
                      hasPermission(activeRole, perm.key) ? "" : "text-slate-400"
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{perm.label}</td>
                    <td className="px-6 py-4 text-xs">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                        {perm.category}
                      </span>
                    </td>
                    {(["Viewer", "Officer", "Analyst", "Investigator", "Admin"] as UserRole[]).map((role) => {
                      const allowed = hasPermission(role, perm.key);
                      const isCurrent = activeRole === role;
                      return (
                        <td
                          key={role}
                          className={`px-6 py-4 text-center ${isCurrent ? "bg-teal-50/40" : ""}`}
                        >
                          {allowed ? (
                            <span className="text-emerald-600 font-bold text-base" aria-label="Allowed">
                              ✓
                            </span>
                          ) : (
                            <span className="text-red-300 text-base" aria-label="Denied">
                              ✕
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Informative alerts */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-slate-100 border border-slate-200 p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">Platform Access Details</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Platform roles are governed by Zoho Catalyst Authentication roles. During local serve, the roles are queried from Catalyst serverless configuration. Fine-grained rules (like redacting phone numbers or limiting export quantities) are enforced at the application logic boundary.
            </p>
          </div>

          <div className="rounded-xl bg-teal-50 border border-teal-200 p-6 space-y-3">
            <h3 className="font-semibold text-teal-900">Active Role Policy Summary</h3>
            <div className="text-sm text-teal-800 leading-relaxed">
              <strong>{activeRole} Role:</strong> {ROLE_MATRIX[activeRole].description}
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>
                  PII access:{" "}
                  {hasPermission(activeRole, "data:view-pii") ? "Allowed (unredacted)" : "Restricted (masked)"}
                </li>
                <li>
                  Investigation notes:{" "}
                  {hasPermission(activeRole, "data:view-investigation-notes") ? "Allowed" : "Hidden / Restricted"}
                </li>
                <li>
                  AI Assistance:{" "}
                  {hasPermission(activeRole, "page:ai-query") ? "Active" : "Disabled for role"}
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
