"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
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
import { ConnectivityBanner, PageHeader, ToastProvider } from "@/components/ui";
import {
  NAV_GROUPS,
  flattenNavItems,
  isRouteMatch,
  itemHref,
  type NavGroup,
  type NavItem,
} from "./navigation";

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

function itemMatchesPath(pathname: string, item: NavItem): boolean {
  return isRouteMatch(pathname, item.href, item.matches) || (item.children ?? []).some((child) => itemMatchesPath(pathname, child));
}

function findActiveGroup(pathname: string, groups: NavGroup[]): NavGroup | undefined {
  return groups.find((group) => group.items.some((item) => itemMatchesPath(pathname, item)));
}

function matchWeight(pathname: string, item: NavItem): number {
  const hrefWeight = isRouteMatch(pathname, item.href) ? item.href?.length ?? 0 : 0;
  const matchWeight = Math.max(
    0,
    ...(item.matches ?? [])
      .filter((match) => {
        if (match.endsWith("/*")) return pathname.startsWith(match.slice(0, -1));
        return pathname === match || pathname.startsWith(`${match}/`);
      })
      .map((match) => match.replace("/*", "").length)
  );
  return Math.max(hrefWeight, matchWeight);
}

function findActiveItem(pathname: string, group?: NavGroup): NavItem | undefined {
  if (!group) return undefined;
  return flattenNavItems(group.items)
    .filter((item) => item.href)
    .sort((a, b) => matchWeight(pathname, b) - matchWeight(pathname, a) || Number(!!a.children?.length) - Number(!!b.children?.length))
    .find((item) => isRouteMatch(pathname, item.href, item.matches));
}

function filterItemsByPermission(items: NavItem[], role: UserRole): NavItem[] {
  return items.reduce<NavItem[]>((visible, item) => {
    const children = filterItemsByPermission(item.children ?? [], role);
    const allowed = !item.permission || hasPermission(role, item.permission);
    if (!allowed && children.length === 0) return visible;
    visible.push({ ...item, children });
    return visible;
  }, []);
}

function sidebarItems(group: NavGroup): NavItem[] {
  return group.items.filter((item) => item.primary);
}

function localNavItems(group: NavGroup): NavItem[] {
  const flattened = flattenNavItems(group.items);
  const hasGateways = group.items.some((item) => (item.children?.length ?? 0) > 0);
  return flattened.filter((item) => item.href && item.secondary !== false && (!hasGateways || !item.children?.length));
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="14" height="12" rx="1.5" />
      <path d="M8 4v12" strokeLinecap="round" />
      {collapsed ? (
        <path d="M11 8l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M13 8l-2 2 2 2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ overview: true });
  const [navPrefsLoaded, setNavPrefsLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const navButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileDrawerRef = useRef<HTMLElement | null>(null);
  const mainRegionRef = useRef<HTMLElement | null>(null);

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
        let effectiveRole = realRole;
        if (!isDemoUser(userData)) {
          try {
            const profileResponse = await fetch("/api/users/me", { cache: "no-store" });
            if (profileResponse.ok) {
              const profilePayload = await profileResponse.json();
              const applicationRole =
                profilePayload?.data?.roleAssignment?.role_id ??
                profilePayload?.data?.user?.role_id;
              effectiveRole = mapCatalystRole(applicationRole) || realRole;
            }
          } catch {
            // Keep the Catalyst role if the application profile is unavailable.
          }
        }
        const storedDemoRole = getStoredDemoRole();
        setUser(userData);
        setActualRole(effectiveRole);
        setActiveRole(storedDemoRole ?? effectiveRole);
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

  useEffect(() => {
    mainRegionRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    try {
      const collapsed = window.localStorage.getItem("ksp_sidebar_collapsed");
      const expanded = window.localStorage.getItem("ksp_sidebar_expanded_groups");
      setSidebarCollapsed(collapsed === "true");
      if (expanded) setExpandedGroups(JSON.parse(expanded));
    } catch {
      // Local storage is optional; navigation still works without it.
    } finally {
      setNavPrefsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!navPrefsLoaded) return;
    window.localStorage.setItem("ksp_sidebar_collapsed", String(sidebarCollapsed));
  }, [navPrefsLoaded, sidebarCollapsed]);

  useEffect(() => {
    if (!navPrefsLoaded) return;
    window.localStorage.setItem("ksp_sidebar_expanded_groups", JSON.stringify(expandedGroups));
  }, [navPrefsLoaded, expandedGroups]);

  // Dismiss the user menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }, 0);
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        userMenuButtonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    mobileDrawerRef.current?.focus();
  }, [sidebarOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (menuOpen) {
        setMenuOpen(false);
        userMenuButtonRef.current?.focus();
      }
      if (sidebarOpen) {
        setSidebarOpen(false);
        navButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, sidebarOpen]);

  const onMenuKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(currentIndex + 1 + items.length) % items.length]?.focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    }
  }, []);

  const onDrawerKeyDown = useCallback((event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") return;
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  const visibleGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: filterItemsByPermission(group.items, activeRole),
    })).filter((group) => group.items.length > 0);
  }, [activeRole]);

  const activeGroup = findActiveGroup(pathname, visibleGroups);
  const activeItem = findActiveItem(pathname, activeGroup);
  const activeGroupId = activeGroup?.id;
  const pageTitle = activeItem?.pageTitle ?? title;
  const pageDescription = activeItem?.description ?? description;

  useEffect(() => {
    if (!activeGroupId) return;
    setExpandedGroups((current) => (current[activeGroupId] ? current : { ...current, [activeGroupId]: true }));
  }, [activeGroupId]);

  // ---- Loading / redirecting state -------------------------------------
  // While the session resolves — and briefly while an unauthenticated user is
  // being redirected to /login — show a calm loader without shifting layout.
  if (state === "loading" || !user) {
    return (
      <main className="min-h-screen bg-app-background text-ink-primary">
        <div className="border-b border-app-border bg-app-surface px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-app bg-slate-100" />
              <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="flex">
          <aside className="hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-app-border bg-app-surface p-4 lg:block">
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-app bg-slate-100" />
              ))}
            </div>
          </aside>
          <section className="ksp-page flex-1" role="status" aria-live="polite">
            <div className="mb-6 h-4 w-52 animate-pulse rounded bg-slate-100" />
            <div className="mb-2 h-8 w-80 max-w-full animate-pulse rounded bg-slate-100" />
            <div className="mb-8 h-4 w-[32rem] max-w-full animate-pulse rounded bg-slate-100" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-app border border-app-border bg-app-surface" />
              ))}
            </div>
            <p className="mt-6 text-sm font-medium text-ink-secondary">Verifying your session...</p>
          </section>
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
  const sidebarLabel = sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
  const desktopSidebarId = "desktop-primary-sidebar";

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  };

  const sidebar = (compact = false) => (
    <nav
      className={`flex h-full flex-col overflow-y-auto ${compact ? "items-center gap-2 px-2 py-4" : "gap-2 px-3 py-4"}`}
      aria-label="Primary navigation"
    >
      {visibleGroups.map((group) => {
        const groupActive = activeGroup?.id === group.id;
        const expanded = !compact && !!expandedGroups[group.id];
        const groupIcon = group.icon ?? group.items[0]?.icon;
        const panelId = `nav-group-${group.id}`;

        if (compact) {
          const compactItems = sidebarItems(group);
          if (compactItems.length === 0) return null;
          return (
            <section
              key={group.id}
              className="flex w-full flex-col items-center gap-1 border-b border-app-divider pb-2 last:border-b-0"
              aria-label={group.label}
            >
              {compactItems.map((item) => {
                const active = itemMatchesPath(pathname, item);
                return (
                  <Link
                    key={item.id}
                    href={itemHref(item)}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={`group/navtip relative flex h-11 w-11 items-center justify-center rounded-app transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
                      active
                        ? "bg-teal-50 text-teal-800 ring-1 ring-teal-100"
                        : groupActive
                          ? "text-teal-700 hover:bg-teal-50"
                          : "text-slate-500 hover:bg-app-muted hover:text-ink-primary"
                    }`}
                  >
                    {item.icon ?? groupIcon}
                    <span
                      className="pointer-events-none absolute left-[3.25rem] top-1/2 z-40 hidden -translate-y-1/2 whitespace-nowrap rounded-app border border-app-border bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white shadow-app-lg group-hover/navtip:block group-focus-visible/navtip:block"
                      role="tooltip"
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </section>
          );
        }

        return (
          <section key={group.id} className="border-b border-app-divider pb-2 last:border-b-0">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className={`flex w-full items-center gap-2 rounded-app px-2.5 py-2 text-left text-xs font-semibold uppercase text-ink-muted transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
                groupActive ? "text-teal-800" : "hover:bg-app-muted hover:text-ink-secondary"
              }`}
              aria-expanded={expanded}
              aria-controls={panelId}
            >
              <span className={groupActive ? "text-teal-700" : "text-slate-400"}>{groupIcon}</span>
              <span className="min-w-0 flex-1 truncate">{group.label}</span>
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
                aria-hidden="true"
              >
                <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {expanded && (
              <div id={panelId} className="mt-1 space-y-1">
                {sidebarItems(group).map((item) => {
                  const active = itemMatchesPath(pathname, item);
                  return (
                    <Link
                      key={item.id}
                      href={itemHref(item)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-10 items-center gap-3 rounded-app px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
                        active
                          ? "bg-teal-50 text-teal-900 ring-1 ring-teal-100"
                          : "text-ink-secondary hover:bg-app-muted hover:text-ink-primary"
                      }`}
                    >
                      <span className={active ? "text-teal-700" : "text-slate-400"}>{item.icon}</span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </nav>
  );

  return (
    <ToastProvider>
      <AppSessionContext.Provider value={session}>
        <div className="min-h-screen bg-app-background text-ink-primary">
        <a href="#main-content" className="ksp-skip-link">
          Skip to content
        </a>
        <ConnectivityBanner />
        {process.env.NODE_ENV !== "production" && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900 sm:px-6">
            Synthetic Demo Data · Mock repository provider · Not operational evidence
          </div>
        )}
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-app-border bg-app-surface">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                ref={navButtonRef}
                type="button"
                onClick={() => setSidebarOpen((open) => !open)}
                className="ksp-icon-button lg:hidden"
                aria-label="Toggle navigation"
                aria-expanded={sidebarOpen}
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
                  <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-app bg-app-primary text-sm font-bold text-ink-inverse">
                  KS
                </span>
                <span className="hidden text-base font-semibold tracking-tight text-ink-primary sm:inline">
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
                ref={userMenuButtonRef}
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-app px-2 py-1.5 text-left transition hover:bg-app-muted"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {initials(user)}
                </span>
                <span className="hidden text-sm leading-tight sm:block">
                  <span className="block font-semibold text-ink-primary">{displayName(user)}</span>
                  <span className="block text-xs text-ink-muted">
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
                  onKeyDown={onMenuKeyDown}
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-app-lg border border-app-border bg-app-surface shadow-app-lg"
                >
                  <div className="border-b border-app-divider px-4 py-3">
                    <p className="text-sm font-semibold text-ink-primary">{displayName(user)}</p>
                    <p className="truncate text-xs text-ink-muted">{user.email_id}</p>
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
                  {hasPermission(activeRole, "page:admin-settings") && (
                    <Link
                      href="/admin/role-based-access"
                      role="menuitem"
                      className="block px-4 py-2.5 text-sm text-ink-secondary hover:bg-app-muted"
                    >
                      Role access
                    </Link>
                  )}
                  {hasPermission(activeRole, "page:help-and-documentation") && (
                    <Link
                      href="/help"
                      role="menuitem"
                      className="block px-4 py-2.5 text-sm text-ink-secondary hover:bg-app-muted"
                    >
                      Help
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => signOutCatalystUser()}
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50"
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
          <aside
            id={desktopSidebarId}
            className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200 ease-out lg:block ${
              sidebarCollapsed ? "w-16" : "w-[17rem]"
            }`}
            aria-label={sidebarCollapsed ? "Collapsed primary navigation" : "Primary navigation"}
          >
            <button
              type="button"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              className="absolute -right-3 top-4 z-20 hidden h-7 w-7 items-center justify-center rounded-full border border-app-border bg-white text-slate-500 shadow-app transition hover:bg-app-muted hover:text-ink-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 lg:inline-flex"
              aria-label={sidebarLabel}
              title={sidebarLabel}
              aria-expanded={!sidebarCollapsed}
              aria-controls={desktopSidebarId}
            >
              <SidebarToggleIcon collapsed={sidebarCollapsed} />
            </button>
            {sidebar(sidebarCollapsed)}
          </aside>

          {/* Mobile sidebar drawer */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-slate-900/40"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
              <aside
                ref={mobileDrawerRef}
                className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-label="Primary navigation"
                tabIndex={-1}
                onKeyDown={onDrawerKeyDown}
              >
                <div className="flex h-16 items-center justify-between border-b border-app-border px-4">
                  <span className="text-sm font-semibold text-ink-primary">Navigation</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      navButtonRef.current?.focus();
                    }}
                    className="ksp-icon-button"
                    aria-label="Close navigation"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
                      <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <div className="min-h-0 flex-1">{sidebar(false)}</div>
              </aside>
            </div>
          )}

          {/* Page container */}
          <main
            id="main-content"
            ref={mainRegionRef}
            className="min-w-0 flex-1"
            tabIndex={-1}
            aria-labelledby="page-title"
          >
            <div className={`ksp-page ${
              ["Geospatial", "Analytics", "Reports", "Records", "Intelligence"].includes(activeGroup?.label ?? "")
                ? "ksp-page-wide"
                : ""
            }`}>
              <nav className="mb-4 flex items-center gap-2 text-sm text-ink-muted" aria-label="Breadcrumb">
                <span>KSP</span>
                {activeGroup && (
                  <>
                    <span aria-hidden="true">/</span>
                    <span>{activeGroup.label}</span>
                  </>
                )}
                <span aria-hidden="true">/</span>
                <span className="font-medium text-ink-primary">{pageTitle}</span>
              </nav>

              <PageHeader headingId="page-title" title={pageTitle} description={pageDescription} actions={!permissionDenied ? actions : undefined} />

              {!permissionDenied && activeGroup && localNavItems(activeGroup).length > 1 && (
                <nav
                  className="mb-6 flex gap-2 overflow-x-auto border-b border-app-border pb-2"
                  aria-label={`${activeGroup.label} pages`}
                >
                  {localNavItems(activeGroup).map((item) => {
                    const active = activeItem?.id === item.id;
                    return (
                      <Link
                        key={item.id}
                        href={itemHref(item)}
                        aria-current={active ? "page" : undefined}
                        className={`whitespace-nowrap rounded-app px-3 py-2 text-sm font-medium transition ${
                          active
                            ? "bg-teal-50 text-teal-800"
                            : "text-ink-secondary hover:bg-app-muted hover:text-ink-primary"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              )}

              {permissionDenied ? (
                <div className="ksp-card mx-auto max-w-xl p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-app-muted text-ink-muted">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6" aria-hidden="true">
                      <rect x="4.5" y="9" width="11" height="7.5" rx="1.5" />
                      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h2 className="mt-4 text-base font-semibold tracking-tight text-ink-primary">Restricted access</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
                    You do not have access to this page. Contact an administrator if you need it.
                  </p>
                  <div className="mt-6">
                    <Link href="/" className="ksp-button-primary">
                      Return to dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                children
              )}
            </div>
          </main>
        </div>
        </div>
      </AppSessionContext.Provider>
    </ToastProvider>
  );
}
