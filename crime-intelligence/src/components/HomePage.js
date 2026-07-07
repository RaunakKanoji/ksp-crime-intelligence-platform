"use client";

import { useEffect, useState } from "react";
import { getCurrentCatalystUser } from "@/lib/catalyst/client";
import { mapCatalystRole, getStoredDemoRole } from "@/lib/permissions";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState("Viewer");
  const [status, setStatus] = useState("Checking session...");

  useEffect(() => {
    async function init() {
      try {
        const userData = await getCurrentCatalystUser();
        setUser(userData);

        const realRole = mapCatalystRole(userData.role_details?.role_name);
        const storedMock = getStoredDemoRole();
        setActiveRole(storedMock || realRole);
        setStatus("");
      } catch (err) {
        console.error(err);
        window.location.replace("/login");
      }
    }

    init();
  }, []);

  function logout() {
    window.location.replace("/api/logout");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl items-center justify-center">
        <div className="w-full rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0f766e]">
                Authenticated
              </p>
              <h1 className="text-3xl font-semibold tracking-normal">Welcome</h1>
              <p className="text-slate-600">
                {user?.email_id ? `Signed in as ${user.email_id}` : status}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="h-11 rounded-md bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>

          {user ? (
            <dl className="mt-8 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Name</dt>
                <dd className="mt-1 font-medium">
                  {[user.first_name, user.last_name].filter(Boolean).join(" ") || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Role</dt>
                <dd className="mt-1 font-medium flex items-center gap-2">
                  <span>{activeRole}</span>
                  {user.role_details?.role_name && mapCatalystRole(user.role_details.role_name) !== activeRole && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                      Simulated
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">User ID</dt>
                <dd className="mt-1 font-medium">{user.user_id || "Not available"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Status</dt>
                <dd className="mt-1 font-medium">{user.status || "Unknown"}</dd>
              </div>
            </dl>
          ) : null}

          {user ? (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h2 className="text-lg font-semibold text-slate-950">System Configuration</h2>
              <p className="mt-1 text-sm text-slate-600">
                Configure security permissions, view role access matrix, or toggle demo environment simulator.
              </p>
              <div className="mt-4">
                <a
                  href="/admin/role-based-access"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 hover:bg-teal-800 text-sm font-semibold text-white px-4 transition"
                >
                  Manage Role-Based Access
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </section>

    </main>
  );
}
