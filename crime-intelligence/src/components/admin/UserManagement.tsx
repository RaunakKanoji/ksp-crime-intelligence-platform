"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { Button, StateNotice, useToast } from "@/components/ui";
import { type UserRole } from "@/lib/permissions";
import { type ManagedUser, type UserAuditLog } from "@/lib/user-management/types";
import {
  fetchUsers,
  createUserApi,
  updateUserApi,
  fetchAuditLogs,
} from "@/lib/user-management/api";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";
const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 transition-colors w-full";
const labelClass = "flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 w-full";

const ROLES: UserRole[] = ["Admin", "Investigator", "Analyst", "Officer", "Viewer"];

export function UserManagement() {
  return (
    <AppShell
      title="User Management"
      description="Manage KSP department credentials, role permissions, and access status overrides."
      requiredPermission="page:admin-settings"
    >
      <UserManagementDashboard />
    </AppShell>
  );
}

function UserManagementDashboard() {
  const { activeRole } = useAppSession();
  const { notify } = useToast();

  // Directory & Audit states
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [audits, setAudits] = useState<UserAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formData, setFormData] = useState<Omit<ManagedUser, "id" | "lastActive">>({
    name: "",
    email: "",
    role: "Viewer",
    status: "Active",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmDisableUser, setConfirmDisableUser] = useState<ManagedUser | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [userList, auditList] = await Promise.all([
        fetchUsers(activeRole),
        fetchAuditLogs(activeRole),
      ]);
      setUsers(userList);
      setAudits(auditList);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load user directory data from the server.");
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter calculations
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  const handleOpenCreate = () => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setFormError(null);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      role: "Viewer",
      status: "Active",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setFormError(null);
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    lastFocusedRef.current?.focus();
  };

  const closeConfirm = () => {
    setConfirmDisableUser(null);
    lastFocusedRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Form inputs validation
    if (!formData.name.trim()) {
      setFormError("Name field is required.");
      return;
    }
    if (!formData.email.trim()) {
      setFormError("Email field is required.");
      return;
    }

    try {
      setSubmitLoading(true);
      if (editingUser) {
        await updateUserApi(editingUser.id, formData, activeRole);
        notify({ tone: "success", title: "User access updated.", description: `${formData.name} was saved.` });
      } else {
        await createUserApi(formData, activeRole);
        notify({ tone: "success", title: "User created.", description: `${formData.name} was added to the directory.` });
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit user form configuration.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleConfirmToggleStatus = async (user: ManagedUser) => {
    const nextStatus = user.status === "Active" ? "Disabled" : "Active";
    
    // If activating, bypass modal confirmation check
    if (nextStatus === "Active") {
      try {
        setLoading(true);
        setStatusMessage(`Activating ${user.name}.`);
        await updateUserApi(
          user.id,
          { name: user.name, email: user.email, role: user.role, status: "Active" },
          activeRole
        );
        notify({ tone: "success", title: "User access updated.", description: `${user.name} can sign in again.` });
        await loadData();
        setStatusMessage(null);
      } catch (err: any) {
        const message = "Could not activate the user account. The directory was preserved. Try again.";
        setStatusMessage(message);
        notify({ tone: "danger", title: "Could not activate user.", description: message, persistent: true });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Set toggle state to trigger confirmation dialog on disabling
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setConfirmDisableUser(user);
  };

  const executeDisable = async () => {
    if (!confirmDisableUser) return;
    try {
      setLoading(true);
      setStatusMessage(`Disabling ${confirmDisableUser.name}.`);
      await updateUserApi(
        confirmDisableUser.id,
        {
          name: confirmDisableUser.name,
          email: confirmDisableUser.email,
          role: confirmDisableUser.role,
          status: "Disabled",
        },
        activeRole
      );
      notify({
        tone: "success",
        title: "User access updated.",
        description: `${confirmDisableUser.name} can no longer sign in.`,
      });
      setConfirmDisableUser(null);
      await loadData();
      setStatusMessage(null);
    } catch (err: any) {
      const message = "Could not disable the user account. The directory was preserved. Try again.";
      setStatusMessage(message);
      notify({ tone: "danger", title: "Could not disable user.", description: message, persistent: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const surface = modalOpen ? modalRef.current : confirmDisableUser ? confirmRef.current : null;
    if (!surface) return;

    const focusable = Array.from(
      surface.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    focusable[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (modalOpen) closeModal();
        if (confirmDisableUser && !loading) closeConfirm();
      }
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    surface.addEventListener("keydown", onKeyDown);
    return () => surface.removeEventListener("keydown", onKeyDown);
  }, [confirmDisableUser, loading, modalOpen]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left section: Directory Grid */}
      <main className="lg:col-span-2 space-y-4">
        <section className={cardClass}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">User Account Directory</h2>
              <p className="text-xs text-slate-500">Search and manage active system privileges.</p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="h-9 px-4 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 text-xs flex items-center justify-center gap-1 transition-colors"
            >
              Add User Account
            </button>
          </div>

          {/* Filtering row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <input
              type="text"
              placeholder="Search ID, name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>

          {/* Table */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-xs font-semibold text-red-800">
              {error} Try again; your filters were preserved.
            </div>
          )}
          {statusMessage && (
            <StateNotice
              tone={statusMessage.startsWith("Could not") ? "error" : "loading"}
              title="User access status"
              description={statusMessage}
            />
          )}

          {loading ? (
            <div className="space-y-3 py-6" aria-label="Loading user list">
              <div className="h-8 bg-slate-100 rounded w-full animate-pulse" />
              <div className="h-10 bg-slate-50 rounded w-full animate-pulse" />
              <div className="h-10 bg-slate-50 rounded w-full animate-pulse" />
              <div className="h-10 bg-slate-50 rounded w-full animate-pulse" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg">
              <h3 className="text-xs font-bold text-slate-700">No User Accounts Found</h3>
              <p className="text-[11px] text-slate-400 mt-1">Refine your search filters.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Access Role</th>
                    <th className="py-3 px-4">Access Status</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                            {user.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-[10px] text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            user.status === "Active"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-red-50 border-red-200 text-red-800"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{user.lastActive}</td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 rounded hover:bg-slate-50 text-slate-600 transition-colors"
                        >
                          Modify
                        </button>
                        <button
                          onClick={() => handleConfirmToggleStatus(user)}
                          className={`px-2.5 py-1 text-[11px] font-semibold border rounded transition-colors ${
                            user.status === "Active"
                              ? "border-red-200 text-red-700 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {user.status === "Active" ? "Disable access" : "Activate access"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Right section: System Audit Logs Feed */}
      <aside className="space-y-4">
        <section className={`${cardClass} space-y-4 flex flex-col min-h-[400px]`}>
          <div>
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">
              Security Audit Timeline
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              Live admin updates. Events are permanently logged in the system records.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[450px] space-y-4 pr-1">
            {loading ? (
              <div className="space-y-3" aria-label="Loading logs">
                <div className="h-12 bg-slate-100 rounded w-full animate-pulse" />
                <div className="h-12 bg-slate-100 rounded w-full animate-pulse" />
              </div>
            ) : audits.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-10">No audit events logged.</p>
            ) : (
              <div className="relative border-l-2 border-slate-100 pl-4 space-y-4 ml-2">
                {audits.map((log) => (
                  <div key={log.id} className="relative space-y-1">
                    {/* Circle mark */}
                    <div className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-500 border border-white" />
                    
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-slate-800 uppercase tracking-wide bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal font-medium">{log.details}</p>
                    <p className="text-[9px] text-slate-400 leading-none">
                      Actor: <span className="font-semibold">{log.actor}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </aside>

      {/* Slide-over Form Dialog overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div
            ref={modalRef}
            className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-form-title"
            aria-describedby="user-form-description"
          >
            <header className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
              <h3 id="user-form-title" className="text-sm font-bold text-slate-900">
                {editingUser ? `Modify Account: ${editingUser.id}` : "Create New User Account"}
              </h3>
              <p id="user-form-description" className="mt-1 text-xs text-slate-500">
                Required fields are full name, email, role, and access status.
              </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 font-bold"
                aria-label="Close user form"
              >
                x
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-xs font-semibold text-red-800">
                  {formError}
                </div>
              )}

              <div className="space-y-3">
                <label className={labelClass}>
                  Full Name
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Inspector Ramesh Gowda"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Email Address
                  <input
                    type="email"
                    required
                    disabled={editingUser !== null}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@ksp.gov.in"
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Access Role Profile
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className={inputClass}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Initial Account Access Status
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as "Active" | "Disabled" })
                    }
                    className={inputClass}
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </label>
              </div>

              <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <Button
                  type="button"
                  onClick={closeModal}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitLoading}
                  loadingLabel="Saving..."
                >
                  Save changes
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Overlay for disabling users */}
      {confirmDisableUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div
            ref={confirmRef}
            className="max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disable-access-title"
            aria-describedby="disable-access-description"
          >
            <h3 id="disable-access-title" className="text-sm font-bold text-red-800">Disable access for {confirmDisableUser.name}?</h3>
            <p id="disable-access-description" className="text-xs text-slate-600 leading-normal">
              This immediately prevents <strong>{confirmDisableUser.email}</strong> from signing in.
            </p>
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-[10px] text-amber-800 leading-relaxed font-semibold">
              Warning: Disabling the account immediately rejects credentials at auth gates.
            </div>
            <footer className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                Keep active
              </button>
              <Button
                type="button"
                onClick={executeDisable}
                variant="danger"
                loading={loading}
                loadingLabel="Disabling..."
                className="h-9 px-4 text-xs"
              >
                Disable access
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
