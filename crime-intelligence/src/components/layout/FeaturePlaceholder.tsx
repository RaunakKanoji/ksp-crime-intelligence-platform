import type { Permission } from "@/lib/permissions";
import { AppShell } from "./AppShell";

interface FeaturePlaceholderProps {
  title: string;
  description?: string;
  requiredPermission?: Permission;
  /** Feature id from the progress tracker, shown for traceability. */
  featureId?: string;
}

/**
 * Plain route page for a feature that has not been implemented yet.
 * Renders inside the App Shell with a calm empty state — no fake data.
 */
export function FeaturePlaceholder({
  title,
  description,
  requiredPermission,
  featureId,
}: FeaturePlaceholderProps) {
  return (
    <AppShell title={title} description={description} requiredPermission={requiredPermission}>
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6" aria-hidden="true">
            <rect x="3" y="3" width="14" height="14" rx="2" />
            <path d="M10 7v6M7 10h6" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">Module coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          This section is part of the planned Crime Intelligence roadmap and will be delivered in a
          later feature. The navigation and access controls for it are already in place.
        </p>
        {featureId && (
          <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-400">
            Planned feature {featureId}
          </p>
        )}
      </div>
    </AppShell>
  );
}
