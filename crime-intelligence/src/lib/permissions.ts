export type UserRole = "Admin" | "Investigator" | "Analyst" | "Officer" | "Viewer";

export type Permission =
  | "page:dashboard"
  | "page:fir-search"
  | "page:fir-detail"
  | "page:fir-advanced-filters"
  | "page:map"
  | "page:people"
  | "page:ai-query"
  | "page:dataset-upload"
  | "page:admin-settings"
  | "page:district-comparison"
  | "page:time-series-trends"
  | "page:crime-category-breakdown"
  | "page:accused-profile"
  | "page:victim-profile"
  | "feature:export-pdf"
  | "feature:export-csv"
  | "data:view-pii"
  | "data:view-investigation-notes";

export interface RolePermissions {
  role: UserRole;
  description: string;
  permissions: Permission[];
}

export const ROLE_MATRIX: Record<UserRole, RolePermissions> = {
  Admin: {
    role: "Admin",
    description: "Full system administration, user management, dataset uploads, and system configurations.",
    permissions: [
      "page:dashboard",
      "page:fir-search",
      "page:fir-detail",
      "page:fir-advanced-filters",
      "page:map",
      "page:people",
      "page:ai-query",
      "page:dataset-upload",
      "page:admin-settings",
      "page:district-comparison",
      "page:time-series-trends",
      "page:crime-category-breakdown",
      "page:accused-profile",
      "page:victim-profile",
      "feature:export-pdf",
      "feature:export-csv",
      "data:view-pii",
      "data:view-investigation-notes",
    ],
  },
  Investigator: {
    role: "Investigator",
    description: "Detailed crime investigation, suspect/victim profiles, and full case details access.",
    permissions: [
      "page:dashboard",
      "page:fir-search",
      "page:fir-detail",
      "page:fir-advanced-filters",
      "page:map",
      "page:people",
      "page:ai-query",
      "page:district-comparison",
      "page:time-series-trends",
      "page:crime-category-breakdown",
      "page:accused-profile",
      "page:victim-profile",
      "feature:export-pdf",
      "feature:export-csv",
      "data:view-pii",
      "data:view-investigation-notes",
    ],
  },
  Analyst: {
    role: "Analyst",
    description: "Statewide aggregated analytics, trends analysis, geospatial hotspots, and report building.",
    permissions: [
      "page:dashboard",
      "page:fir-search",
      "page:fir-advanced-filters",
      "page:map",
      "page:people",
      "page:ai-query",
      "page:district-comparison",
      "page:time-series-trends",
      "page:crime-category-breakdown",
      "page:accused-profile",
      "feature:export-pdf",
      "feature:export-csv",
    ],
  },
  Officer: {
    role: "Officer",
    description: "Standard officer duties, case searching, case map viewing, and basic case details.",
    permissions: [
      "page:dashboard",
      "page:fir-search",
      "page:fir-detail",
      "page:fir-advanced-filters",
      "page:map",
      "page:victim-profile",
    ],
  },
  Viewer: {
    role: "Viewer",
    description: "Read-only access to standard summaries, aggregated reports, and public information.",
    permissions: [
      "page:dashboard",
      "page:fir-search",
      "page:fir-advanced-filters",
    ],
  },
};

export function mapCatalystRole(roleName?: string): UserRole {
  if (!roleName) return "Viewer";
  const name = roleName.trim().toLowerCase();
  if (name === "admin" || name === "administrator") return "Admin";
  if (name === "investigator") return "Investigator";
  if (name === "analyst") return "Analyst";
  if (name === "officer") return "Officer";
  if (name === "viewer") return "Viewer";
  return "Viewer"; // fallback
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const roleConfig = ROLE_MATRIX[role];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
}

// Local storage key for demo role mock override
const DEMO_ROLE_KEY = "ksp_demo_role_mock";

export function getStoredDemoRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(DEMO_ROLE_KEY);
  if (stored && ["Admin", "Investigator", "Analyst", "Officer", "Viewer"].includes(stored)) {
    return stored as UserRole;
  }
  return null;
}

export function setStoredDemoRole(role: UserRole | null): void {
  if (typeof window === "undefined") return;
  if (role) {
    window.localStorage.setItem(DEMO_ROLE_KEY, role);
  } else {
    window.localStorage.removeItem(DEMO_ROLE_KEY);
  }
}
