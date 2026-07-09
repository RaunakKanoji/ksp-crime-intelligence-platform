import type { ReactNode } from "react";
import type { Permission } from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  /** When set, the item is only shown to roles holding this permission. */
  permission?: Permission;
  icon: ReactNode;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Minimal outline icons (currentColor) so we do not add a new icon library.
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
  dashboard: svg(
    <>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </>
  ),
  file: svg(
    <>
      <path d="M5 2.5h6l4 4V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V3a.5.5 0 0 1 .5-.5Z" />
      <path d="M11 2.5V6.5h4" />
    </>
  ),
  people: svg(
    <>
      <circle cx="7" cy="7" r="2.5" />
      <path d="M2.5 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
      <path d="M13 6.2a2.3 2.3 0 0 1 0 4.3M14 16c0-2 .8-3.2 2-3.7" />
    </>
  ),
  chart: svg(
    <>
      <path d="M3 3v14h14" />
      <path d="M6.5 13V9M10 13V6.5M13.5 13v-2.5" />
    </>
  ),
  map: svg(
    <>
      <path d="M7.5 3.5 3 5.5v11l4.5-2 5 2 4.5-2v-11l-4.5 2-5-2Z" />
      <path d="M7.5 3.5v11M12.5 5.5v11" />
    </>
  ),
  ai: svg(
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
  database: svg(
    <>
      <ellipse cx="10" cy="5" rx="6" ry="2.3" />
      <path d="M4 5v10c0 1.3 2.7 2.3 6 2.3s6-1 6-2.3V5" />
      <path d="M4 10c0 1.3 2.7 2.3 6 2.3s6-1 6-2.3" />
    </>
  ),
  shield: svg(
    <>
      <path d="M10 2.5 4.5 5v4.5c0 3.5 2.3 6 5.5 8 3.2-2 5.5-4.5 5.5-8V5L10 2.5Z" />
      <path d="M7.8 10l1.6 1.6L13 8.4" />
    </>
  ),
  settings: svg(
    <>
      <circle cx="10" cy="10" r="2.3" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15 5l-1.4 1.4M6.4 13.6 5 15M15 15l-1.4-1.4M6.4 6.4 5 5" />
    </>
  ),
  help: svg(
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M8 8a2 2 0 1 1 2.7 1.9c-.5.2-.7.6-.7 1.1v.5" />
      <path d="M10 14h.01" />
    </>
  ),
};

/**
 * Navigation grouped by domain, per UI guidelines §4.
 * Items without a `permission` are visible to every authenticated user.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { label: "Dashboard", href: "/", permission: "page:dashboard", icon: icons.dashboard },
    ],
  },
  {
    label: "FIR Records",
    items: [
      { label: "FIR Search", href: "/fir-search", permission: "page:fir-search", icon: icons.file },
      { label: "Advanced Filters", href: "/fir-advanced-filters", permission: "page:fir-advanced-filters", icon: icons.file },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Police Station Analytics", href: "/analytics", permission: "page:dashboard", icon: icons.chart },
      { label: "District Crime Comparison", href: "/analytics/district", permission: "page:district-comparison", icon: icons.chart },
      { label: "Time-Series Crime Trends", href: "/analytics/trends", permission: "page:time-series-trends", icon: icons.chart },
      { label: "Crime Category Breakdown", href: "/analytics/breakdown", permission: "page:crime-category-breakdown", icon: icons.chart },
    ],
  },
  {
    label: "People Intelligence",
    items: [
      { label: "Accused Person Profile", href: "/people", permission: "page:accused-profile", icon: icons.people },
      { label: "Victim Profile Summary", href: "/victims", permission: "page:victim-profile", icon: icons.people },
    ],
  },
  {
    label: "Maps & Hotspots",
    items: [
      { label: "Crime Map", href: "/crime-map", permission: "page:map", icon: icons.map },
    ],
  },
  {
    label: "AI Query",
    items: [
      { label: "Natural Language Query", href: "/ai-query", permission: "page:ai-query", icon: icons.ai },
      { label: "Result Explanation", href: "/ai-query/explanation", permission: "page:ai-query", icon: icons.ai },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Role-Based Access", href: "/admin/role-based-access", permission: "page:admin-settings", icon: icons.shield },
    ],
  },
];
