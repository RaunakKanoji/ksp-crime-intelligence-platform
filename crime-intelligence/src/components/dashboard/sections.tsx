"use client";

import Link from "next/link";
import {
  CATEGORIES,
  DATE_RANGES,
  DISTRICTS,
  type CategoryStat,
  type CrimeAlert,
  type DashboardFilters,
  type DistrictStat,
  type MapHotspot,
  type SummaryMetric,
  type TrendPoint,
} from "@/lib/dashboard/types";

const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

const severityStyles: Record<CrimeAlert["severity"], string> = {
  critical: "border-red-200 bg-red-50 text-red-700",
  high: "border-amber-200 bg-amber-50 text-amber-800",
  moderate: "border-slate-200 bg-slate-50 text-slate-600",
};

function DirectionMark({ direction }: { direction: SummaryMetric["direction"] }) {
  if (direction === "flat") return null;
  const up = direction === "up";
  return (
    <span className={up ? "text-emerald-600" : "text-red-600"} aria-hidden="true">
      {up ? "▲" : "▼"}
    </span>
  );
}

// ---- Filters ----------------------------------------------------------
export function DashboardFiltersBar({
  filters,
  onChange,
}: {
  filters: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
}) {
  const selectClass =
    "h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-sm text-slate-700 outline-none focus:border-teal-600";
  const chevronClass =
    "pointer-events-none absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-r border-slate-500";
  return (
    <div className={`${card} flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4`}>
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-range" className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Date range
        </label>
        <div className="relative">
          <select
            id="filter-range"
            className={selectClass}
            value={filters.range}
            onChange={(e) => onChange({ ...filters, range: e.target.value as DashboardFilters["range"] })}
          >
            {DATE_RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
          <span className={chevronClass} aria-hidden="true" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-district" className="text-xs font-medium uppercase tracking-wide text-slate-500">
          District
        </label>
        <div className="relative">
          <select
            id="filter-district"
            className={selectClass}
            value={filters.district}
            onChange={(e) => onChange({ ...filters, district: e.target.value })}
          >
            <option value="all">All districts</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span className={chevronClass} aria-hidden="true" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-category" className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Category
        </label>
        <div className="relative">
          <select
            id="filter-category"
            className={selectClass}
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className={chevronClass} aria-hidden="true" />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange({ range: "30d", district: "all", category: "all" })}
        className="ml-auto h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        Reset filters
      </button>
    </div>
  );
}

// ---- Summary cards ----------------------------------------------------
export function SummaryCards({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => (
        <div key={m.id} className={card}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{m.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{m.displayValue}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <DirectionMark direction={m.direction} />
            {m.comparisonLabel}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---- Trend preview (inline SVG, no chart library) ---------------------
export function TrendPreview({ points }: { points: TrendPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <section className={`${card} flex h-full flex-col`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">FIR Trend</h2>
          <p className="text-sm text-slate-600">Reported FIRs over recent months</p>
        </div>
        <Link href="/analytics" className="text-sm font-medium text-teal-700 hover:text-teal-800">
          View analytics
        </Link>
      </div>
      <div
        className="mt-6 flex min-h-[10rem] flex-1 items-end gap-3"
        role="img"
        aria-label="Bar chart of FIRs by month"
      >
        {points.map((p) => (
          <div
            key={p.label}
            className="flex-1 rounded-t bg-teal-600/80"
            style={{ height: `${Math.max(2, (p.value / max) * 100)}%` }}
            title={`${p.label}: ${p.value.toLocaleString("en-IN")}`}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {points.map((p) => (
          <span key={p.label} className="flex-1 text-center text-xs text-slate-500">
            {p.label}
          </span>
        ))}
      </div>
    </section>
  );
}

// ---- Top crime categories ---------------------------------------------
export function TopCategories({ categories }: { categories: CategoryStat[] }) {
  return (
    <section className={card}>
      <h2 className="text-lg font-semibold tracking-tight">Top Crime Categories</h2>
      <p className="text-sm text-slate-600">Share of FIRs by category</p>
      <ul className="mt-5 space-y-4">
        {categories.slice(0, 6).map((c) => (
          <li key={c.category}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800">{c.category}</span>
              <span className="text-slate-500">
                {c.count.toLocaleString("en-IN")} · {Math.round(c.share * 100)}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.round(c.share * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---- District overview -------------------------------------------------
export function DistrictOverview({ districts }: { districts: DistrictStat[] }) {
  return (
    <section className={`${card} overflow-hidden p-0`}>
      <div className="px-6 pt-6">
        <h2 className="text-lg font-semibold tracking-tight">District Overview</h2>
        <p className="text-sm text-slate-600">FIR volume and pending investigations by district</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-6 py-2.5 font-medium">District</th>
              <th scope="col" className="px-6 py-2.5 text-right font-medium">Total FIRs</th>
              <th scope="col" className="px-6 py-2.5 text-right font-medium">Pending</th>
              <th scope="col" className="px-6 py-2.5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((d) => (
              <tr key={d.district} className="border-b border-slate-100 last:border-0">
                <td className="px-6 py-3 font-medium text-slate-800">{d.district}</td>
                <td className="px-6 py-3 text-right text-slate-700">{d.total.toLocaleString("en-IN")}</td>
                <td className="px-6 py-3 text-right text-slate-700">{d.pending.toLocaleString("en-IN")}</td>
                <td className="px-6 py-3 text-right">
                  {d.hotspot ? (
                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                      Hotspot
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      Stable
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---- Map preview (schematic, no map library) --------------------------
export function MapPreview({ hotspots }: { hotspots: MapHotspot[] }) {
  return (
    <section className={`${card} flex h-full min-h-[28rem] flex-col`}>
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Hotspot Map</h2>
          <p className="text-sm text-slate-600">Schematic preview of flagged districts</p>
        </div>
        <Link href="/map" className="text-sm font-medium text-teal-700 hover:text-teal-800">
          Open crime map
        </Link>
      </div>
      <div className="relative mt-4 min-h-[22rem] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <svg
          viewBox="0 0 100 62"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          role="img"
          aria-label="Schematic hotspot preview"
        >
          <rect x="0" y="0" width="100" height="62" className="fill-slate-100" />
          <path d="M14 12 L70 8 L86 26 L74 52 L30 56 L10 34 Z" className="fill-slate-200 stroke-slate-300" strokeWidth={0.5} />
          {hotspots.map((h) => (
            <g key={h.id}>
              <circle cx={h.x} cy={h.y * 0.62} r={2 + h.intensity * 4} className="fill-red-500/30" />
              <circle cx={h.x} cy={h.y * 0.62} r={1.4} className="fill-red-600" />
            </g>
          ))}
        </svg>
        {hotspots.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            No hotspots for the current filters
          </p>
        )}
      </div>
    </section>
  );
}

// ---- Recent alerts (with role-based redaction) ------------------------
export function RecentAlerts({
  alerts,
  redaction,
}: {
  alerts: CrimeAlert[];
  redaction: { pii: boolean; notes: boolean };
}) {
  return (
    <section className={card}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Recent Alerts</h2>
          <p className="text-sm text-slate-600">Latest flagged intelligence signals</p>
        </div>
      </div>
      {alerts.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          No alerts for the current filters.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {alerts.map((a) => (
            <li key={a.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{a.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {a.district} · {a.category} · {new Date(a.raisedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${severityStyles[a.severity]}`}
                >
                  {a.severity}
                </span>
              </div>
              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-medium uppercase tracking-wide text-slate-400">Suspect</dt>
                  <dd className="mt-0.5 text-slate-700">
                    {a.suspect ?? <span className="italic text-slate-400">Restricted — PII</span>}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium uppercase tracking-wide text-slate-400">Investigation note</dt>
                  <dd className="mt-0.5 text-slate-700">
                    {a.note ?? <span className="italic text-slate-400">Restricted — notes access</span>}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
      {(!redaction.pii || !redaction.notes) && (
        <p className="mt-4 text-xs text-slate-500">
          Some fields are hidden because your role cannot view{" "}
          {!redaction.pii && "PII"}
          {!redaction.pii && !redaction.notes && " or "}
          {!redaction.notes && "investigation notes"}.
        </p>
      )}
    </section>
  );
}

// ---- Shared states -----------------------------------------------------
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

export function DashboardEmpty({ onReset }: { onReset: () => void }) {
  return (
    <div className={`${card} p-10 text-center`}>
      <h2 className="text-lg font-semibold tracking-tight">No matching records</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        There are no FIRs for the selected district, category, and date range. Try widening the
        filters to see more results.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
      >
        Reset filters
      </button>
    </div>
  );
}

export function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={`${card} p-10 text-center`}>
      <h2 className="text-lg font-semibold tracking-tight">Unable to load dashboard</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Something went wrong while preparing the dashboard overview. Please try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Retry
      </button>
    </div>
  );
}
