"use client";

import { useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { Alert, Badge, Button, Card, SectionHeader, Table } from "@/components/ui";
import {
  type Permission,
  ROLE_MATRIX,
  type UserRole,
  hasPermission,
  setStoredDemoRole,
} from "@/lib/permissions";

const roles: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

const permissionsList: { key: Permission; label: string; category: string }[] = [
  { key: "page:dashboard", label: "View analytics dashboard", category: "Page" },
  { key: "page:fir-search", label: "Access FIR search", category: "Page" },
  { key: "page:fir-detail", label: "Access FIR detail", category: "Page" },
  { key: "page:map", label: "Access hotspot map", category: "Page" },
  { key: "page:people", label: "Access people profiles", category: "Page" },
  { key: "page:ai-query", label: "Access AI assistant", category: "Page" },
  { key: "page:ai-chat-history", label: "Access AI chat history", category: "Page" },
  { key: "page:dataset-upload", label: "Access dataset upload", category: "Page" },
  { key: "page:data-source-connectors", label: "Access data source connectors", category: "Page" },
  { key: "page:admin-settings", label: "Access system settings", category: "Page" },
  { key: "page:help-and-documentation", label: "Access help and documentation", category: "Page" },
  { key: "feature:export-pdf", label: "Export PDF reports", category: "Feature" },
  { key: "feature:export-csv", label: "Export raw data to CSV", category: "Feature" },
  { key: "data:view-pii", label: "View unredacted PII", category: "Data" },
  { key: "data:view-investigation-notes", label: "View investigation notes", category: "Data" },
];

function RoleBasedAccessContent() {
  const { user, actualRole, activeRole, isSimulated } = useAppSession();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function showSuccess(message: string) {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), 3000);
  }

  function handleRoleOverride(role: UserRole) {
    setStoredDemoRole(role);
    showSuccess(`Simulated role updated to ${role}.`);
  }

  function handleClearOverride() {
    setStoredDemoRole(null);
    showSuccess(`Cleared simulation. Reset to actual role: ${actualRole}.`);
  }

  return (
    <div className="space-y-6">
      {successMessage && <Alert tone="success">{successMessage}</Alert>}

      <section className="grid gap-5 md:grid-cols-2">
        <Card>
          <SectionHeader title="Current session" />
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="ksp-meta-label">Authenticated account</dt>
              <dd className="mt-1 text-sm font-medium text-ink-primary">{user.email_id || "Unresolved"}</dd>
            </div>
            <div>
              <dt className="ksp-meta-label">Platform role</dt>
              <dd className="mt-1 text-sm font-semibold text-teal-800">{actualRole}</dd>
            </div>
            <div className="border-t border-app-divider pt-4 sm:col-span-2">
              <dt className="ksp-meta-label">Effective role</dt>
              <dd className="mt-2 flex items-center gap-3">
                <span className="text-2xl font-semibold text-ink-primary">{activeRole}</span>
                {isSimulated && <Badge tone="warning">Simulated</Badge>}
              </dd>
            </div>
          </dl>

          {isSimulated && (
            <div className="mt-5">
              <Button type="button" onClick={handleClearOverride}>
                Clear role simulation
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Simulate portal roles"
            description="Switch roles locally to verify layout, result redaction, and available actions."
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {roles.map((role) => (
              <Button
                key={role}
                type="button"
                variant={activeRole === role ? "primary" : "secondary"}
                onClick={() => handleRoleOverride(role)}
              >
                {role}
              </Button>
            ))}
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-app-divider p-5">
          <SectionHeader
            title="Role permissions matrix"
            description="Default Karnataka State Police portal capabilities and data restrictions."
          />
        </div>
        <Table>
          <thead>
            <tr>
              <th>Capability or policy</th>
              <th>Category</th>
              {roles.slice().reverse().map((role) => (
                <th key={role} className="text-center">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionsList.map((permission) => (
              <tr key={permission.key}>
                <td className="font-medium text-ink-primary">{permission.label}</td>
                <td>
                  <Badge>{permission.category}</Badge>
                </td>
                {roles.slice().reverse().map((role) => {
                  const allowed = hasPermission(role, permission.key);
                  const current = activeRole === role;
                  return (
                    <td key={role} className={current ? "bg-teal-50/40 text-center" : "text-center"}>
                      <span
                        className={allowed ? "font-semibold text-emerald-700" : "font-semibold text-red-500"}
                        aria-label={allowed ? "Allowed" : "Denied"}
                      >
                        {allowed ? "Allowed" : "Denied"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <section className="grid gap-5 md:grid-cols-2">
        <Alert>
          <h2 className="text-sm font-semibold text-ink-primary">Platform access details</h2>
          <p className="mt-2">
            Platform roles are governed by Zoho Catalyst Authentication roles. Fine-grained rules such as PII
            redaction and export capability are enforced at the application logic boundary.
          </p>
        </Alert>

        <Alert tone="info">
          <h2 className="text-sm font-semibold">Active role policy summary</h2>
          <div className="mt-2">
            <strong>{activeRole} role:</strong> {ROLE_MATRIX[activeRole].description}
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>PII access: {hasPermission(activeRole, "data:view-pii") ? "Allowed" : "Restricted"}</li>
              <li>
                Investigation notes:{" "}
                {hasPermission(activeRole, "data:view-investigation-notes") ? "Allowed" : "Hidden"}
              </li>
              <li>AI assistance: {hasPermission(activeRole, "page:ai-query") ? "Active" : "Disabled"}</li>
            </ul>
          </div>
        </Alert>
      </section>
    </div>
  );
}

export default function RoleBasedAccessPage() {
  return (
    <AppShell
      title="Role-based access"
      description="Review and simulate portal roles, feature capabilities, and data access policies."
    >
      <RoleBasedAccessContent />
    </AppShell>
  );
}

