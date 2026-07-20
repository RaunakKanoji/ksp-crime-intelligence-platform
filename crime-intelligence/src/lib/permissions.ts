export type UserRole = "Admin" | "Investigator" | "Analyst" | "Officer" | "Viewer";

export type Permission =
  | "page:dashboard"
  | "page:dashboard-customization"
  | "page:fir-search"
  | "page:fir-detail"
  | "page:fir-advanced-filters"
  | "page:map"
  | "page:people"
  | "page:ai-query"
  | "page:ai-chat-history"
  | "page:dataset-upload"
  | "page:data-source-connectors"
  | "page:admin-settings"
  | "page:district-comparison"
  | "page:time-series-trends"
  | "page:crime-category-breakdown"
  | "page:accused-profile"
  | "page:repeat-offender-detection"
  | "page:linked-case-detection"
  | "page:criminal-network-graph"
  | "page:modus-operandi-analysis"
  | "page:case-status-tracking"
  | "page:investigation-priority-score"
  | "page:risk-alerts"
  | "page:geospatial-cluster-analysis"
  | "page:location-detail-intelligence"
  | "page:crime-pattern-discovery"
  | "page:predictive-crime-risk"
  | "page:suspect-watchlist"
  | "page:alert-notification-center"
  | "page:saved-queries"
  | "page:victim-profile"
  | "page:property-offence-analysis"
  | "page:violent-crime-analysis"
  | "page:cybercrime-analysis"
  | "page:women-child-safety-analysis"
  | "page:traffic-offence-analysis"
  | "page:drug-related-crime-analysis"
  | "page:weapon-involvement-analysis"
  | "page:demo-mode-and-sample-data"
  | "page:help-and-documentation"
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
      "page:dashboard-customization",
      "page:fir-search",
      "page:fir-detail",
      "page:fir-advanced-filters",
      "page:map",
      "page:people",
      "page:ai-query",
      "page:ai-chat-history",
      "page:dataset-upload",
      "page:data-source-connectors",
      "page:admin-settings",
      "page:district-comparison",
      "page:time-series-trends",
      "page:crime-category-breakdown",
      "page:accused-profile",
      "page:repeat-offender-detection",
      "page:linked-case-detection",
      "page:criminal-network-graph",
      "page:modus-operandi-analysis",
      "page:case-status-tracking",
      "page:investigation-priority-score",
      "page:risk-alerts",
      "page:geospatial-cluster-analysis",
      "page:location-detail-intelligence",
      "page:crime-pattern-discovery",
      "page:predictive-crime-risk",
      "page:suspect-watchlist",
      "page:alert-notification-center",
      "page:saved-queries",
      "page:victim-profile",
      "page:property-offence-analysis",
      "page:violent-crime-analysis",
      "page:cybercrime-analysis",
      "page:women-child-safety-analysis",
      "page:traffic-offence-analysis",
      "page:drug-related-crime-analysis",
      "page:weapon-involvement-analysis",
      "page:demo-mode-and-sample-data",
      "page:help-and-documentation",
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
      "page:dashboard-customization",
      "page:fir-search",
      "page:fir-detail",
      "page:fir-advanced-filters",
      "page:map",
      "page:people",
      "page:ai-query",
      "page:ai-chat-history",
      "page:district-comparison",
      "page:time-series-trends",
      "page:crime-category-breakdown",
      "page:accused-profile",
      "page:repeat-offender-detection",
      "page:linked-case-detection",
      "page:criminal-network-graph",
      "page:modus-operandi-analysis",
      "page:case-status-tracking",
      "page:investigation-priority-score",
      "page:risk-alerts",
      "page:geospatial-cluster-analysis",
      "page:location-detail-intelligence",
      "page:crime-pattern-discovery",
      "page:predictive-crime-risk",
      "page:suspect-watchlist",
      "page:alert-notification-center",
      "page:saved-queries",
      "page:victim-profile",
      "page:property-offence-analysis",
      "page:violent-crime-analysis",
      "page:cybercrime-analysis",
      "page:women-child-safety-analysis",
      "page:traffic-offence-analysis",
      "page:drug-related-crime-analysis",
      "page:weapon-involvement-analysis",
      "page:demo-mode-and-sample-data",
      "page:help-and-documentation",
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
      "page:dashboard-customization",
      "page:fir-search",
      "page:fir-advanced-filters",
      "page:map",
      "page:people",
      "page:ai-query",
      "page:ai-chat-history",
      "page:district-comparison",
      "page:time-series-trends",
      "page:crime-category-breakdown",
      "page:accused-profile",
      "page:repeat-offender-detection",
      "page:linked-case-detection",
      "page:criminal-network-graph",
      "page:modus-operandi-analysis",
      "page:case-status-tracking",
      "page:investigation-priority-score",
      "page:risk-alerts",
      "page:geospatial-cluster-analysis",
      "page:location-detail-intelligence",
      "page:crime-pattern-discovery",
      "page:predictive-crime-risk",
      "page:suspect-watchlist",
      "page:alert-notification-center",
      "page:saved-queries",
      "page:data-source-connectors",
      "page:property-offence-analysis",
      "page:violent-crime-analysis",
      "page:cybercrime-analysis",
      "page:women-child-safety-analysis",
      "page:traffic-offence-analysis",
      "page:drug-related-crime-analysis",
      "page:weapon-involvement-analysis",
      "page:demo-mode-and-sample-data",
      "page:help-and-documentation",
      "feature:export-pdf",
      "feature:export-csv",
    ],
  },
  Officer: {
    role: "Officer",
    description: "Standard officer duties, case searching, case map viewing, and basic case details.",
    permissions: [
      "page:dashboard",
      "page:dashboard-customization",
      "page:fir-search",
      "page:fir-detail",
      "page:fir-advanced-filters",
      "page:map",
      "page:geospatial-cluster-analysis",
      "page:location-detail-intelligence",
      "page:case-status-tracking",
      "page:victim-profile",
      "page:help-and-documentation",
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

// Server-side global permission matrix storage
declare global {
  var _dynamicRoleMatrix: Record<UserRole, Permission[]> | undefined;
}

export function getPermissionsMatrix(): Record<UserRole, Permission[]> {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("ksp_permissions_matrix");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Parse error fallback
      }
    }
  }

  if (typeof global !== "undefined") {
    if (!global._dynamicRoleMatrix) {
      const initialMatrix = {} as Record<UserRole, Permission[]>;
      for (const role in ROLE_MATRIX) {
        initialMatrix[role as UserRole] = [...ROLE_MATRIX[role as UserRole].permissions];
      }
      global._dynamicRoleMatrix = initialMatrix;
    }
    return global._dynamicRoleMatrix;
  }

  // Pure environment fallback
  const matrix = {} as any;
  for (const role in ROLE_MATRIX) {
    matrix[role] = [...ROLE_MATRIX[role as UserRole].permissions];
  }
  return matrix;
}

export function saveClientPermissionsMatrix(matrix: Record<UserRole, Permission[]>): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("ksp_permissions_matrix", JSON.stringify(matrix));
  }
}

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
  const matrix = getPermissionsMatrix();
  const perms = matrix[role];
  if (!perms) return false;
  return perms.includes(permission);
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
