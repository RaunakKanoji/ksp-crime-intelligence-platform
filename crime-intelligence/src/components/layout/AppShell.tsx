"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentCatalystUser, isDemoUser, signOutCatalystUser } from "@/lib/catalyst/client";
import {
  hasPermission,
  mapCatalystRole,
  getStoredDemoRole,
  type Permission,
  type UserRole,
} from "@/lib/permissions";
import { NAV_GROUPS } from "./navigation";

interface CatalystUser {
  email_id?: string;
  first_name?: string;
  last_name?: string;
  user_id?: string;
  status?: string;
  role_details?: { role_name?: string };
}

export interface AppSession {
  user: CatalystUser;
  /** Role derived from the authenticated Catalyst account. */
  actualRole: UserRole;
  /** Role currently in effect (may be a demo/simulated override). */
  activeRole: UserRole;
  isSimulated: boolean;
}

const AppSessionContext = createContext<AppSession | null>(null);

/** Access the authenticated session from any component inside an AppShell. */
export function useAppSession(): AppSession {
  const session = useContext(AppSessionContext);
  if (!session) {
    throw new Error("useAppSession must be used within an <AppShell>.");
  }
  return session;
}

type ShellState = "loading" | "ready";

export interface AppShellProps {
  /** Page title shown in the header and breadcrumb. */
  title: string;
  description?: string;
  /** When set, the page renders a restricted-access state for roles that lack it. */
  requiredPermission?: Permission;
  /** Optional header actions rendered on the right of the page title row. */
  actions?: ReactNode;
  children: ReactNode;
}

/** Redirect an unauthenticated visitor to the login page, preserving the target route. */
function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname + window.location.search;
  const target =
    path && path !== "/" ? `/login?service_url=${encodeURIComponent(path)}` : "/login";
  window.location.replace(target);
}

function displayName(user: CatalystUser): string {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.email_id || "Signed-in user";
}

function initials(user: CatalystUser): string {
  const name = displayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function AppShell({
  title,
  description,
  requiredPermission,
  actions,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [state, setState] = useState<ShellState>("loading");
  const [user, setUser] = useState<CatalystUser | null>(null);
  const [actualRole, setActualRole] = useState<UserRole>("Viewer");
  const [activeRole, setActiveRole] = useState<UserRole>("Viewer");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Resolve the authenticated user and role once on mount.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const userData: CatalystUser | null = await getCurrentCatalystUser();
        if (cancelled) return;

        if (!userData) {
          redirectToLogin();
          return;
        }

        const realRole = mapCatalystRole(userData.role_details?.role_name);
        const storedDemoRole = getStoredDemoRole();
        setUser(userData);
        setActualRole(realRole);
        setActiveRole(storedDemoRole ?? realRole);
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        // Not authenticated (or the session could not be verified): send the
        // user to the login page, matching the rest of the app's auth flow.
        redirectToLogin();
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the active role in sync with the demo/role simulation override.
  useEffect(() => {
    if (state !== "ready") return;
    const sync = () => {
      const storedDemoRole = getStoredDemoRole();
      setActiveRole(storedDemoRole ?? actualRole);
    };
    const interval = window.setInterval(sync, 1000);
    return () => window.clearInterval(interval);
  }, [state, actualRole]);

  // Close the mobile sidebar and user menu on route change.
  useEffect(() => {
    setSidebarOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Dismiss the user menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const visibleGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || hasPermission(activeRole, item.permission)
      ),
    })).filter((group) => group.items.length > 0);
  }, [activeRole]);

  // ---- Loading / redirecting state -------------------------------------
  // While the session resolves — and briefly while an unauthenticated user is
  // being redirected to /login — show a calm loader without shifting layout.
  if (state === "loading" || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-950">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Verifying your session...</p>
        </div>
      </main>
    );
  }

  const session: AppSession = {
    user,
    actualRole,
    activeRole,
    isSimulated: activeRole !== actualRole,
  };

  const permissionDenied =
    !!requiredPermission && !hasPermission(activeRole, requiredPermission);

  const sidebar = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-6" aria-label="Primary">
      {visibleGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  (item.href !== "/analytics" &&
                    item.href !== "/ai-query" &&
                    pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-teal-50 text-teal-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className={active ? "text-teal-700" : "text-slate-400"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <AppSessionContext.Provider value={session}>
      <div className="min-h-screen bg-slate-50 text-slate-950">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((open) => !open)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Toggle navigation"
                aria-expanded={sidebarOpen}
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
                  <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
                  KS
                </span>
                <span className="hidden text-base font-bold tracking-tight sm:inline">
                  KSP Crime Intelligence
                </span>
              </div>
              {isDemoUser(user) ? (
                <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 md:inline">
                  Demo session
                </span>
              ) : (
                <span className="hidden rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 md:inline">
                  Portal Active
                </span>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-100"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {initials(user)}
                </span>
                <span className="hidden text-sm leading-tight sm:block">
                  <span className="block font-semibold text-slate-900">{displayName(user)}</span>
                  <span className="block text-xs text-slate-500">
                    {activeRole}
                    {session.isSimulated ? " (Simulated)" : ""}
                  </span>
                </span>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4 text-slate-400" aria-hidden="true">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{displayName(user)}</p>
                    <p className="truncate text-xs text-slate-500">{user.email_id}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs">
                      <span className="rounded bg-teal-50 px-1.5 py-0.5 font-semibold text-teal-700">
                        {activeRole}
                      </span>
                      {session.isSimulated && (
                        <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-800">
                          Simulated
                        </span>
                      )}
                    </p>
                  </div>
                  <Link
                    href="/admin/role-based-access"
                    role="menuitem"
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Role & access settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => signOutCatalystUser()}
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Desktop sidebar */}
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
            {sidebar}
          </aside>

          {/* Mobile sidebar drawer */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-slate-900/40"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
              <aside className="absolute left-0 top-0 h-full w-72 border-r border-slate-200 bg-white shadow-xl">
                {sidebar}
              </aside>
            </div>
          )}

          {/* Page container */}
          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
                <span>KSP</span>
                <span aria-hidden="true">/</span>
                <span className="font-medium text-slate-900">{title}</span>
              </nav>

              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                  {description && <p className="mt-2 max-w-2xl text-slate-600">{description}</p>}
                </div>
                {actions && !permissionDenied && (
                  <div className="flex shrink-0 items-center gap-2">{actions}</div>
                )}
              </div>

              {permissionDenied ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6" aria-hidden="true">
                      <rect x="4.5" y="9" width="11" height="7.5" rx="1.5" />
                      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold tracking-tight">Restricted access</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                    Your current role (<span className="font-semibold">{activeRole}</span>) does not
                    have permission to view this page. Contact an administrator if you believe this
                    is an error.
                  </p>
                  <Link
                    href="/"
                    className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Return to dashboard
                  </Link>
                </div>
              ) : (
                children
              )}
            </div>
          </main>
        </div>
      </div>
    </AppSessionContext.Provider>
  );
}
