"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { getCrimeSummary, STATIONS } from "@/lib/dashboard/summary";
import type { CrimeSummary, CrimeSummaryCard, SummaryFilters } from "@/lib/dashboard/summary";
import { CATEGORIES, DATE_RANGES, DISTRICTS } from "@/lib/dashboard/types";

const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
const DEFAULT_FILTERS: SummaryFilters = { range: "30d", district: "all", station: "all", category: "all" };

type LoadState = "loading" | "ready" | "empty" | "error";

// ---- Filters ----------------------------------------------------------
function SummaryFiltersBar({
  filters,
  onChange,
}: {
  filters: SummaryFilters;
  onChange: (next: SummaryFilters) => void;
}) {
  const selectClass =
    "h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-sm text-slate-700 outline-none focus:border-teal-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
  const chevronClass =
    "pointer-events-none absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-r border-slate-500";
  const stationOptions =
    filters.district !== "all" ? STATIONS[filters.district as keyof typeof STATIONS] ?? [] : [];

  return (
    <div className={`${card} flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4`}>
      <Field id="filter-range" label="Date range">
        <select
          id="filter-range"
          className={selectClass}
          value={filters.range}
          onChange={(e) => onChange({ ...filters, range: e.target.value as SummaryFilters["range"] })}
        >
          {DATE_RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        <span className={chevronClass} aria-hidden="true" />
      </Field>

      <Field id="filter-district" label="District">
        <select
          id="filter-district"
          className={selectClass}
          value={filters.district}
          // Reset station whenever the district changes.
          onChange={(e) => onChange({ ...filters, district: e.target.value, station: "all" })}
        >
          <option value="all">All districts</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <span className={chevronClass} aria-hidden="true" />
      </Field>

      <Field id="filter-station" label="Station">
        <select
          id="filter-station"
          className={selectClass}
          value={filters.station}
          disabled={filters.district === "all"}
          onChange={(e) => onChange({ ...filters, station: e.target.value })}
        >
          <option value="all">All stations</option>
          {stationOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className={chevronClass} aria-hidden="true" />
      </Field>

      <Field id="filter-category" label="Category">
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
      </Field>

      <button
        type="button"
        onClick={() => onChange(DEFAULT_FILTERS)}
        className="ml-auto h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        Reset filters
      </button>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}

// ---- Delta indicator (polarity-aware) ---------------------------------
function DeltaBadge({ card: c }: { card: CrimeSummaryCard }) {
  if (c.restricted) return null;
  const good =
    c.polarity === "positive" ? c.direction === "up" : c.polarity === "negative" ? c.direction === "down" : null;
  const color =
    good === null || c.direction === "flat"
      ? "text-slate-500"
      : good
      ? "text-emerald-600"
      : "text-red-600";
  const arrow = c.direction === "up" ? "▲" : c.direction === "down" ? "▼" : "→";
  const sign = c.deltaPct > 0 ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${color}`}>
      <span aria-hidden="true">{arrow}</span>
      {sign}
      {c.deltaPct.toFixed(1)}%
    </span>
  );
}

// ---- Summary card -----------------------------------------------------
function MetricCard({ card: c }: { card: CrimeSummaryCard }) {
  if (c.restricted) {
    return (
      <div className={`${card} border-dashed`}>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-400">Restricted</p>
        <p className="mt-1 text-xs text-slate-400">Requires investigation-notes access</p>
      </div>
    );
  }
  return (
    <div className={card}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{c.displayValue}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-500">
        <DeltaBadge card={c} />
        <span>{c.helper}</span>
      </div>
      {c.format === "number" && (
        <p className="mt-1 text-xs text-slate-400">Previous: {c.previousDisplayValue}</p>
      )}
    </div>
  );
}

// ---- States -----------------------------------------------------------
function SummarySkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

// ---- Orchestrator content --------------------------------------------
function CrimeSummaryContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<SummaryFilters>(DEFAULT_FILTERS);
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<CrimeSummary | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (activeFilters: SummaryFilters) => {
      const current = ++requestId.current;
      setState("loading");
      try {
        const result = await getCrimeSummary(activeFilters, activeRole);
        if (current !== requestId.current) return;
        setData(result);
        setState(result.totalFirs === 0 ? "empty" : "ready");
      } catch (err) {
        if (current !== requestId.current) return;
        console.error("Crime summary load failed:", err);
        setState("error");
      }
    },
    [activeRole]
  );

  useEffect(() => {
    load(filters);
  }, [load, filters]);

  const restrictedCount = useMemo(
    () => data?.cards.filter((c) => c.restricted).length ?? 0,
    [data]
  );

  if (state === "loading") return <SummarySkeleton />;
  if (state === "error") {
    return (
      <div className={`${card} p-10 text-center`}>
        <h2 className="text-lg font-semibold tracking-tight">Unable to load summary</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Something went wrong while preparing the crime summary. Please try again.
        </p>
        <button
          type="button"
          onClick={() => load(filters)}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Sample data
        </span>
        <span className="text-xs text-slate-500">
          Demonstration figures only — a connected data source is not yet available.
        </span>
      </div>

      <SummaryFiltersBar filters={filters} onChange={setFilters} />

      {state === "empty" || !data ? (
        <div className={`${card} p-10 text-center`}>
          <h2 className="text-lg font-semibold tracking-tight">No matching records</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            There are no FIRs for the selected district, station, category, and date range. Try
            widening the filters to see more results.
          </p>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Showing <span className="font-medium text-slate-900">{data.periodLabel}</span> compared
            with <span className="font-medium text-slate-900">{data.previousPeriodLabel.toLowerCase()}</span>.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.cards.map((c) => (
              <MetricCard key={c.id} card={c} />
            ))}
          </div>
          {restrictedCount > 0 && (
            <p className="text-xs text-slate-500">
              {restrictedCount} card{restrictedCount === 1 ? " is" : "s are"} hidden because your role
              cannot view investigation-sensitive intelligence.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function CrimeSummaryCards() {
  return (
    <AppShell
      title="Crime Summary Cards"
      description="High-level crime metrics with time-period comparison for the Karnataka State Police portal."
      requiredPermission="page:dashboard"
    >
      <CrimeSummaryContent />
    </AppShell>
  );
}
