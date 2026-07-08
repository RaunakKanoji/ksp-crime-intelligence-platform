"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { getDashboardOverview } from "@/lib/dashboard/service";
import type { DashboardData, DashboardFilters } from "@/lib/dashboard/types";
import {
  DashboardEmpty,
  DashboardError,
  DashboardFiltersBar,
  DashboardSkeleton,
  DistrictOverview,
  MapPreview,
  RecentAlerts,
  SummaryCards,
  TopCategories,
  TrendPreview,
} from "./sections";

type LoadState = "loading" | "ready" | "empty" | "error";

const DEFAULT_FILTERS: DashboardFilters = {
  range: "30d",
  district: "all",
  category: "all",
};

function DashboardContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (activeFilters: DashboardFilters) => {
      const currentRequest = ++requestId.current;
      setState("loading");
      try {
        const result = await getDashboardOverview(activeFilters, activeRole);
        if (currentRequest !== requestId.current) return; // a newer request superseded this one
        const totalFirs = result.summary.find((m) => m.id === "total-firs")?.value ?? 0;
        setData(result);
        setState(totalFirs === 0 ? "empty" : "ready");
      } catch (err) {
        if (currentRequest !== requestId.current) return;
        console.error("Dashboard load failed:", err);
        setState("error");
      }
    },
    [activeRole]
  );

  // Reload whenever filters or the effective role change.
  useEffect(() => {
    load(filters);
  }, [load, filters]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  if (state === "loading") return <DashboardSkeleton />;
  if (state === "error") return <DashboardError onRetry={() => load(filters)} />;

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

      <DashboardFiltersBar filters={filters} onChange={setFilters} />

      {state === "empty" || !data ? (
        <DashboardEmpty onReset={resetFilters} />
      ) : (
        <>
          <SummaryCards metrics={data.summary} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrendPreview points={data.trend} />
            </div>
            <TopCategories categories={data.categories} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <MapPreview hotspots={data.hotspots} />
            <RecentAlerts alerts={data.alerts} redaction={data.redaction} />
          </div>

          <DistrictOverview districts={data.districts} />
        </>
      )}
    </div>
  );
}

export default function DashboardOverview() {
  return (
    <AppShell
      title="Dashboard Overview"
      description="Statewide crime intelligence summary for the Karnataka State Police portal."
      requiredPermission="page:dashboard"
    >
      <DashboardContent />
    </AppShell>
  );
}
