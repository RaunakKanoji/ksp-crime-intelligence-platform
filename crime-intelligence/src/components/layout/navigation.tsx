import type { ReactNode } from "react";
import type { Permission } from "@/lib/permissions";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  permission?: Permission;
  icon: ReactNode;
  pageTitle?: string;
  description?: string;
  matches?: string[];
  children?: NavItem[];
  secondary?: boolean;
  primary?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  description: string;
  icon?: ReactNode;
  items: NavItem[];
}

function svg(children: ReactNode) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  overview: svg(
    <>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </>
  ),
  alert: svg(
    <>
      <path d="M10 3.5 3.5 16h13L10 3.5Z" />
      <path d="M10 8v3M10 14h.01" />
    </>
  ),
  records: svg(
    <>
      <path d="M5 2.5h6l4 4V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V3a.5.5 0 0 1 .5-.5Z" />
      <path d="M11 2.5V6.5h4" />
      <path d="M8 10h4M8 13h4" />
    </>
  ),
  chart: svg(
    <>
      <path d="M3 3v14h14" />
      <path d="M6.5 13V9M10 13V6.5M13.5 13v-2.5" />
    </>
  ),
  intelligence: svg(
    <>
      <circle cx="10" cy="10" r="3" />
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.1 5.1l1.4 1.4M13.5 13.5l1.4 1.4M14.9 5.1l-1.4 1.4M6.5 13.5l-1.4 1.4" />
    </>
  ),
  map: svg(
    <>
      <path d="M7.5 3.5 3 5.5v11l4.5-2 5 2 4.5-2v-11l-4.5 2-5-2Z" />
      <path d="M7.5 3.5v11M12.5 5.5v11" />
    </>
  ),
  assistant: svg(
    <>
      <path d="M10 3v2.5M10 14.5V17M4 7l1.8 1M14.2 12 16 13M4 13l1.8-1M14.2 8 16 7" />
      <circle cx="10" cy="10" r="3" />
    </>
  ),
  report: svg(
    <>
      <path d="M5 2.5h6l4 4V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V3a.5.5 0 0 1 .5-.5Z" />
      <path d="M8 10h4M8 13h4M8 7h1.5" />
    </>
  ),
  admin: svg(
    <>
      <path d="M10 2.5 4.5 5v4.5c0 3.5 2.3 6 5.5 8 3.2-2 5.5-4.5 5.5-8V5L10 2.5Z" />
      <path d="M7.8 10l1.6 1.6L13 8.4" />
    </>
  ),
  help: svg(
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M8.1 8a2 2 0 1 1 3.3 1.5c-.8.6-1.4 1.1-1.4 2M10 14h.01" />
    </>
  ),
};

export function isRouteMatch(pathname: string, href?: string, matches: string[] = []): boolean {
  if (!href) return false;
  if (href === "/") return pathname === "/" || pathname === "/dashboard" || pathname === "/home";
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    matches.some((match) => {
      if (match.endsWith("/*")) return pathname.startsWith(match.slice(0, -1));
      return pathname === match || pathname.startsWith(`${match}/`);
    })
  );
}

export function flattenNavItems(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...flattenNavItems(item.children ?? [])]);
}

export function itemHref(item: NavItem): string {
  return item.href ?? item.children?.find((child) => child.href)?.href ?? "/";
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Operational summary, alerts, recent activity, and common tasks.",
    icon: icons.overview,
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/",
        matches: ["/dashboard"],
        permission: "page:dashboard",
        icon: icons.overview,
        primary: true,
        pageTitle: "Overview",
        description: "Statewide crime activity, alerts, trends, and quick links.",
      },
      {
        id: "alerts",
        label: "Alerts",
        href: "/decision-support/alert-notifications",
        permission: "page:alert-notification-center",
        icon: icons.alert,
        primary: true,
        pageTitle: "Alerts",
        description: "Review generated alerts by severity, category, date, owner, and status.",
      },
      {
        id: "summary",
        label: "Crime summary",
        href: "/crime-summary",
        permission: "page:dashboard",
        icon: icons.overview,
        pageTitle: "Crime summary",
        description: "Priority crime metrics for the selected period.",
      },
      {
        id: "dashboard-settings",
        label: "Dashboard settings",
        href: "/dashboard/customization",
        permission: "page:dashboard-customization",
        icon: icons.overview,
        pageTitle: "Dashboard settings",
        description: "Choose the dashboard sections that matter for your role.",
      },
    ],
  },
  {
    id: "records",
    label: "Records",
    description: "Crime records, case data, search, filtering, and status workflows.",
    icon: icons.records,
    items: [
      {
        id: "fir-search",
        label: "FIR Search",
        href: "/fir-search",
        matches: ["/fir-search/*"],
        permission: "page:fir-search",
        icon: icons.records,
        primary: true,
        pageTitle: "Records",
        description: "Search FIR and case records by location, date, category, people, and status.",
      },
      {
        id: "record-details",
        label: "Record details",
        href: "/fir-search",
        matches: ["/fir-search/*"],
        permission: "page:fir-detail",
        icon: icons.records,
        secondary: false,
        pageTitle: "Record details",
        description: "Review the record identity, status, facts, location, people, analysis, and source details.",
      },
      {
        id: "advanced-filters",
        label: "Advanced Filters",
        href: "/fir-advanced-filters",
        permission: "page:fir-advanced-filters",
        icon: icons.records,
        primary: true,
        pageTitle: "Advanced Filters",
        description: "Apply advanced record filters when the standard search is not enough.",
      },
      {
        id: "case-status",
        label: "Case Status",
        href: "/cases/status-tracking",
        permission: "page:case-status-tracking",
        icon: icons.records,
        primary: true,
        pageTitle: "Case status",
        description: "Track investigation and case lifecycle status.",
      },
      {
        id: "priority-score",
        label: "Priority scores",
        href: "/cases/priority-score",
        permission: "page:investigation-priority-score",
        icon: icons.records,
        pageTitle: "Priority scores",
        description: "Review transparent case priority indicators.",
      },
      {
        id: "risk-alerts",
        label: "Risk alerts",
        href: "/cases/risk-alerts",
        permission: "page:risk-alerts",
        icon: icons.alert,
        pageTitle: "Risk alerts",
        description: "Review threshold alerts from hotspot, offender, status, and priority signals.",
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Station, district, trend, category, specialist, and legal analytics.",
    icon: icons.chart,
    items: [
      {
        id: "station-analytics",
        label: "Station Analytics",
        href: "/analytics",
        permission: "page:dashboard",
        icon: icons.chart,
        primary: true,
        pageTitle: "Analytics",
        description: "Compare stations, categories, periods, and crime patterns.",
      },
      {
        id: "district-comparison",
        label: "District Comparison",
        href: "/analytics/district",
        permission: "page:district-comparison",
        icon: icons.chart,
        primary: true,
        pageTitle: "District comparison",
        description: "Compare crime volume and solved status across districts.",
      },
      {
        id: "crime-trends",
        label: "Crime Trends",
        href: "/analytics/trends",
        permission: "page:time-series-trends",
        icon: icons.chart,
        primary: true,
        pageTitle: "Crime trends",
        description: "Review time-based changes, spikes, and seasonal movement.",
      },
      {
        id: "category-breakdown",
        label: "Category Breakdown",
        href: "/analytics/breakdown",
        permission: "page:crime-category-breakdown",
        icon: icons.chart,
        primary: true,
        pageTitle: "Crime categories",
        description: "See category distribution, shares, and record-level context.",
      },
      { id: "property-offence", label: "Property Offence", href: "/analytics/property-offence", permission: "page:property-offence-analysis", icon: icons.chart, pageTitle: "Property offences", description: "Analyze theft, burglary, robbery, recovery, and value patterns." },
      { id: "violent-crime", label: "Violent Crime", href: "/analytics/violent-crime", permission: "page:violent-crime-analysis", icon: icons.chart, pageTitle: "Violent crime", description: "Review violent crime trends, locations, weapons, and sensitive case context." },
      { id: "cybercrime", label: "Cybercrime", href: "/analytics/cybercrime", permission: "page:cybercrime-analysis", icon: icons.chart, pageTitle: "Cybercrime", description: "Analyze fraud types, channels, losses, and district movement." },
      { id: "women-child-safety", label: "Women and Child Safety", href: "/analytics/women-child-safety", permission: "page:women-child-safety-analysis", icon: icons.chart, pageTitle: "Women and child safety", description: "Review protected aggregate trends with victim privacy controls." },
      { id: "traffic-offence", label: "Traffic Offence", href: "/analytics/traffic-offence", permission: "page:traffic-offence-analysis", icon: icons.chart, pageTitle: "Traffic offences", description: "Analyze accidents, offence types, road segments, and severity." },
      { id: "drug-crime", label: "Drug-Related Crime", href: "/analytics/drug-crime", permission: "page:drug-related-crime-analysis", icon: icons.chart, pageTitle: "Drug-related crime", description: "Review drug category, quantity, locations, and repeat signals." },
      { id: "weapon-involvement", label: "Weapon Involvement", href: "/analytics/weapon-involvement", permission: "page:weapon-involvement-analysis", icon: icons.chart, pageTitle: "Weapon involvement", description: "Analyze weapon type, crime category, and related evidence patterns." },
      { id: "act-section", label: "Act Section", href: "/analytics/act-section", permission: "page:time-series-trends", icon: icons.chart, pageTitle: "Acts and sections", description: "Inspect crime frequency and incidents by legal section." },
      { id: "charge-sheet", label: "Charge Sheet", href: "/analytics/charge-sheet", permission: "page:time-series-trends", icon: icons.chart, pageTitle: "Charge sheets", description: "Compare filing velocity, pending cases, and station clearance." },
      { id: "court-disposal", label: "Court Disposal", href: "/analytics/court-disposal", permission: "page:time-series-trends", icon: icons.chart, pageTitle: "Court disposal", description: "Review trial outcomes, pending counts, and disposal ratios." },
      { id: "bail-arrest", label: "Bail and Arrest", href: "/analytics/bail-arrest", permission: "page:time-series-trends", icon: icons.chart, pageTitle: "Bail and arrest", description: "Monitor custody timelines, arrests, and bail outcomes." },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    description: "People, case, network, pattern, and predictive-risk intelligence.",
    icon: icons.intelligence,
    items: [
      {
        id: "people-intelligence",
        label: "People Intelligence",
        href: "/people",
        matches: ["/people/*", "/victims", "/decision-support/suspect-watchlist"],
        permission: "page:accused-profile",
        icon: icons.intelligence,
        primary: true,
        pageTitle: "People Intelligence",
        description: "Review accused, victim, repeat-offender, and watchlist intelligence.",
        children: [
          { id: "accused-profile", label: "Accused Profile", href: "/people", permission: "page:accused-profile", icon: icons.intelligence, pageTitle: "Accused profiles", description: "Review identity, case links, aliases, locations, and repeat-offender indicators." },
          { id: "repeat-offenders", label: "Repeat Offenders", href: "/people/repeat-offenders", permission: "page:repeat-offender-detection", icon: icons.intelligence, pageTitle: "Repeat offenders", description: "Find people linked to multiple records using explainable identity signals." },
          { id: "victim-profiles", label: "Victim Profiles", href: "/victims", permission: "page:victim-profile", icon: icons.intelligence, pageTitle: "Victim profiles", description: "Review protected victim summaries and linked case context." },
          { id: "suspect-watchlist", label: "Suspect Watchlist", href: "/decision-support/suspect-watchlist", permission: "page:suspect-watchlist", icon: icons.intelligence, pageTitle: "Suspect watchlist", description: "Maintain reviewed suspect entries with reasons, dates, and audit context." },
        ],
      },
      {
        id: "case-intelligence",
        label: "Case Intelligence",
        href: "/intelligence/linked-cases",
        matches: ["/intelligence/linked-cases", "/intelligence/network-graph", "/intelligence/modus-operandi", "/intelligence/pattern-discovery"],
        permission: "page:linked-case-detection",
        icon: icons.intelligence,
        primary: true,
        pageTitle: "Case Intelligence",
        description: "Find linked cases, networks, modus operandi, and repeat patterns.",
        children: [
          { id: "linked-cases", label: "Linked Cases", href: "/intelligence/linked-cases", permission: "page:linked-case-detection", icon: icons.intelligence, pageTitle: "Linked cases", description: "Detect possible links between records using explainable signals." },
          { id: "network-graph", label: "Network Graph", href: "/intelligence/network-graph", permission: "page:criminal-network-graph", icon: icons.intelligence, pageTitle: "Network graph", description: "Visualize relationships between people, records, places, and categories." },
          { id: "modus-operandi", label: "Modus Operandi", href: "/intelligence/modus-operandi", permission: "page:modus-operandi-analysis", icon: icons.intelligence, pageTitle: "Modus operandi", description: "Group and compare repeated crime methods across records." },
          { id: "pattern-discovery", label: "Pattern Discovery", href: "/intelligence/pattern-discovery", permission: "page:crime-pattern-discovery", icon: icons.intelligence, pageTitle: "Pattern discovery", description: "Find time, location, category, method, and accused-linked patterns." },
        ],
      },
      {
        id: "predictive-risk",
        label: "Predictive Risk",
        href: "/decision-support/predictive-risk",
        matches: ["/cases/priority-score", "/cases/risk-alerts", "/decision-support/alert-notifications"],
        permission: "page:predictive-crime-risk",
        icon: icons.alert,
        primary: true,
        pageTitle: "Predictive Risk",
        description: "Review predictive risk, priority scores, and operational alerts.",
        children: [
          { id: "predictive-crime-risk", label: "Predictive Crime Risk", href: "/decision-support/predictive-risk", permission: "page:predictive-crime-risk", icon: icons.alert, pageTitle: "Predictive risk", description: "Estimate review risk using explainable historical signals." },
          { id: "investigation-priority", label: "Priority Score", href: "/cases/priority-score", permission: "page:investigation-priority-score", icon: icons.alert, pageTitle: "Priority scores", description: "Review transparent case priority indicators." },
          { id: "predictive-risk-alerts", label: "Risk Alerts", href: "/cases/risk-alerts", permission: "page:risk-alerts", icon: icons.alert, pageTitle: "Risk alerts", description: "Review threshold alerts from hotspot, offender, status, and priority signals." },
          { id: "alert-center", label: "Alerts", href: "/decision-support/alert-notifications", permission: "page:alert-notification-center", icon: icons.alert, pageTitle: "Alerts", description: "Review generated alerts by severity, category, date, owner, and status." },
        ],
      },
    ],
  },
  {
    id: "geospatial",
    label: "Geospatial",
    description: "Crime map, clusters, hotspot context, and location intelligence.",
    icon: icons.map,
    items: [
      {
        id: "crime-map",
        label: "Crime Map",
        href: "/crime-map",
        matches: ["/map"],
        permission: "page:map",
        icon: icons.map,
        primary: true,
        pageTitle: "Crime map",
        description: "Explore hotspots, categories, districts, and stations on the map.",
      },
      {
        id: "cluster-analysis",
        label: "Cluster Analysis",
        href: "/crime-map/clusters",
        permission: "page:geospatial-cluster-analysis",
        icon: icons.map,
        primary: true,
        pageTitle: "Cluster Analysis",
        description: "Find spatial concentrations by area, category, and date range.",
      },
      {
        id: "location-intelligence",
        label: "Location Intelligence",
        href: "/crime-map/location-intelligence",
        permission: "page:location-detail-intelligence",
        icon: icons.map,
        primary: true,
        pageTitle: "Location Intelligence",
        description: "Review incidents, categories, and recent activity for one area.",
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    description: "Report builder, exports, and saved query workflows.",
    icon: icons.report,
    items: [
      {
        id: "report-builder",
        label: "Report Builder",
        href: "/reports",
        permission: "feature:export-pdf",
        icon: icons.report,
        primary: true,
        pageTitle: "Reports",
        description: "Generate PDF summaries and CSV record exports.",
      },
      {
        id: "saved-queries",
        label: "Saved Queries",
        href: "/productivity/saved-queries",
        permission: "page:saved-queries",
        icon: icons.report,
        primary: true,
        pageTitle: "Saved queries",
        description: "Save, rename, share, delete, and re-run useful queries.",
      },
    ],
  },
  {
    id: "ai-assistant",
    label: "AI Assistant",
    description: "Natural-language query, result explanation, and chat history.",
    icon: icons.assistant,
    items: [
      {
        id: "natural-language-query",
        label: "Natural Language Query",
        href: "/ai-query",
        permission: "page:ai-query",
        icon: icons.assistant,
        primary: true,
        pageTitle: "AI Assistant",
        description: "Ask permission-safe questions about crime records and aggregates.",
      },
      {
        id: "result-explanation",
        label: "Result Explanation",
        href: "/ai-query/explanation",
        permission: "page:ai-query",
        icon: icons.assistant,
        primary: true,
        pageTitle: "Result Explanation",
        description: "Review sources, confidence notes, limitations, and review warnings.",
      },
      {
        id: "chat-history",
        label: "Chat History",
        href: "/ai-query/history",
        permission: "page:ai-chat-history",
        icon: icons.assistant,
        primary: true,
        pageTitle: "Chat History",
        description: "Find previous questions, results, explanations, and limitations.",
      },
    ],
  },
  {
    id: "admin-support",
    label: "Admin & Support",
    description: "Demo data, help, user administration, data configuration, and audit controls.",
    icon: icons.admin,
    items: [
      {
        id: "demo-data",
        label: "Demo Data",
        href: "/demo-mode",
        permission: "page:demo-mode-and-sample-data",
        icon: icons.admin,
        primary: true,
        pageTitle: "Demo data",
        description: "Review sample data rules and demo reset controls.",
      },
      {
        id: "help",
        label: "Help & Documentation",
        href: "/help",
        permission: "page:help-and-documentation",
        icon: icons.help,
        primary: true,
        pageTitle: "Help & Documentation",
        description: "Find operational guides, glossary terms, and support workflows.",
      },
      { id: "system-settings", label: "System Settings", href: "/admin-settings", permission: "page:admin-settings", icon: icons.admin, pageTitle: "Administration", description: "Configure system settings, access, data operations, and audit controls." },
      { id: "role-access", label: "Roles and Permissions", href: "/admin/role-based-access", permission: "page:admin-settings", icon: icons.admin, pageTitle: "Role access", description: "Review and simulate roles, permissions, and data access policies." },
      { id: "users", label: "User Management", href: "/admin/user-management", permission: "page:admin-settings", icon: icons.admin, pageTitle: "Users", description: "Manage department users, roles, and access status." },
      { id: "permissions", label: "Permission Rules", href: "/admin/permission-management", permission: "page:admin-settings", icon: icons.admin, pageTitle: "Permissions", description: "Configure role access rules." },
      { id: "audit-logs", label: "Audit Logs", href: "/admin/audit-logs", permission: "page:admin-settings", icon: icons.admin, pageTitle: "Audit logs", description: "Track user access, queries, exports, and administration changes." },
      { id: "dataset-upload", label: "Dataset Upload", href: "/dataset-upload", permission: "page:dataset-upload", icon: icons.admin, pageTitle: "Dataset upload", description: "Import and map crime intelligence CSV lists." },
      { id: "dataset-validation", label: "Dataset Validation", href: "/dataset-validation", permission: "page:dataset-upload", icon: icons.admin, pageTitle: "Dataset validation", description: "Check schema, duplicate identifiers, locations, and legal sections." },
      { id: "data-cleaning", label: "Data Cleaning", href: "/dataset-cleaning", permission: "page:dataset-upload", icon: icons.admin, pageTitle: "Data cleaning", description: "Define aliases and manual corrections for import data." },
      { id: "import-history", label: "Import History", href: "/dataset-import-history", permission: "page:dataset-upload", icon: icons.admin, pageTitle: "Import history", description: "Review uploads, record counts, status, and validation errors." },
      { id: "master-data", label: "Master Data", href: "/dataset-master-data", permission: "page:dataset-upload", icon: icons.admin, pageTitle: "Master data", description: "Manage reference lists used by imports and filters." },
      { id: "connectors", label: "Data Configuration", href: "/data-source-connectors", permission: "page:data-source-connectors", icon: icons.admin, pageTitle: "Connectors", description: "Plan data sources and connection readiness." },
    ],
  },
];
