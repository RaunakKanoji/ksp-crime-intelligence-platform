"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { DISTRICTS } from "@/lib/dashboard/types";
import { STATIONS } from "@/lib/dashboard/summary";
import {
  DEFAULT_STATION_ANALYTICS_FILTERS,
  type PoliceStationAnalyticsData,
  type StationAnalyticsFilters,
} from "@/lib/police-station-analytics/types";
import { fetchPoliceStationAnalytics } from "@/lib/police-station-analytics/api";

const card = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";
const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600";

type LoadState = "loading" | "ready" | "empty" | "error";

function StatCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <section className={card}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </section>
  );
}

function Filters({
  filters,
  onChange,
  onApply,
  onReset,
}: {
  filters: StationAnalyticsFilters;
  onChange: (filters: StationAnalyticsFilters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const stations =
    filters.district === "all"
      ? DISTRICTS.flatMap((district) => STATIONS[district])
      : STATIONS[filters.district as keyof typeof STATIONS] ?? [];
  const categories = ["Vehicle Theft", "Burglary", "Chain Snatching", "Cyber Fraud", "Assault", "Robbery", "Missing Person", "Narcotics"];

  return (
    <section className={`${card} flex flex-col gap-4 xl:flex-row xl:items-end`}>
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Date range
        <select value={filters.range} onChange={(event) => onChange({ ...filters, range: event.target.value as StationAnalyticsFilters["range"] })} className={inputClass}>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="180d">Last 180 days</option>
          <option value="1y">Last 1 year</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        District
        <select value={filters.district} onChange={(event) => onChange({ ...filters, district: event.target.value, policeStation: "all" })} className={inputClass}>
          <option value="all">All districts</option>
          {DISTRICTS.map((district) => <option key={district}>{district}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Police station
        <select value={filters.policeStation} onChange={(event) => onChange({ ...filters, policeStation: event.target.value })} className={inputClass}>
          <option value="all">All stations</option>
          {stations.map((station) => <option key={station}>{station}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Category
        <select value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })} className={inputClass}>
          <option value="all">All categories</option>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
      </label>
      <div className="ml-auto flex gap-2">
        <button type="button" onClick={onApply} className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
          Apply
        </button>
        <button type="button" onClick={onReset} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Reset
        </button>
      </div>
    </section>
  );
}

function ProgressBar({ value, tone = "teal" }: { value: number; tone?: "teal" | "amber" | "slate" }) {
  const color = tone === "amber" ? "bg-amber-500" : tone === "slate" ? "bg-slate-500" : "bg-teal-700";
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function AnalyticsContent({ data }: { data: PoliceStationAnalyticsData }) {
  const maxTrend = Math.max(1, ...data.timeTrend.map((point) => point.firCount));
  const maxCategory = Math.max(1, ...data.categoryDistribution.map((item) => item.count));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
          Demo data
        </span>
        <span className="text-sm text-slate-500">
          Context: {data.filters.range}, {data.filters.district === "all" ? "all districts" : data.filters.district}, {data.filters.policeStation === "all" ? "all stations" : data.filters.policeStation}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="FIR count" value={data.totals.firCount} helper={`${data.totals.stationCount} station aggregates`} />
        <StatCard label="Solved rate" value={`${data.totals.solvedRate}%`} helper="Closed or charge-sheet filed" />
        <StatCard label="Pending cases" value={data.totals.pendingCount} helper="Open or under investigation" />
        <StatCard label="Repeat incidents" value={data.totals.repeatIncidentCount} helper="Repeated station/category patterns" />
        <StatCard label="District average delta" value={data.selectedStation ? `${data.selectedStation.comparisonToDistrictAverage >= 0 ? "+" : ""}${data.selectedStation.comparisonToDistrictAverage}` : "N/A"} helper="Selected station vs district average" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className={card}>
          <h2 className="text-base font-semibold text-slate-950">Category distribution</h2>
          <div className="mt-4 space-y-4">
            {data.categoryDistribution.map((item) => (
              <div key={item.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{item.category}</span>
                  <span className="text-slate-500">{item.count} · {Math.round(item.share * 100)}%</span>
                </div>
                <ProgressBar value={(item.count / maxCategory) * 100} />
              </div>
            ))}
          </div>
        </section>

        <section className={card}>
          <h2 className="text-base font-semibold text-slate-950">Solved vs pending cases</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Solved</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{data.statusBreakdown.solved}</p>
              <ProgressBar value={data.totals.solvedRate} />
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{data.statusBreakdown.pending}</p>
              <ProgressBar value={data.totals.firCount ? (data.statusBreakdown.pending / data.totals.firCount) * 100 : 0} tone="amber" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-slate-200 p-3"><span className="text-slate-500">Open</span><p className="font-semibold">{data.statusBreakdown.open}</p></div>
            <div className="rounded-lg border border-slate-200 p-3"><span className="text-slate-500">Charge sheet</span><p className="font-semibold">{data.statusBreakdown.chargeSheetFiled}</p></div>
            <div className="rounded-lg border border-slate-200 p-3"><span className="text-slate-500">Closed</span><p className="font-semibold">{data.statusBreakdown.closed}</p></div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className={card}>
          <h2 className="text-base font-semibold text-slate-950">Time trends</h2>
          <div className="mt-4 flex h-44 items-end gap-3">
            {data.timeTrend.map((point) => (
              <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t bg-teal-700" style={{ height: `${Math.max(4, (point.firCount / maxTrend) * 150)}px` }} title={`${point.label}: ${point.firCount}`} />
                <span className="text-xs text-slate-500">{point.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={card}>
          <h2 className="text-base font-semibold text-slate-950">Response indicators</h2>
          <div className="mt-4 grid gap-3">
            {data.responseIndicators.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-800">{item.label}</p>
                  <p className="text-lg font-semibold text-slate-950">{item.value}</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={card}>
        <h2 className="text-base font-semibold text-slate-950">Repeat incidents</h2>
        {data.repeatIncidents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No repeat incident patterns found for the selected filters.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 font-medium">Station</th>
                  <th className="px-4 py-2 font-medium">Crime type</th>
                  <th className="px-4 py-2 text-right font-medium">Incidents</th>
                  <th className="px-4 py-2 font-medium">Peak window</th>
                  <th className="px-4 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.repeatIncidents.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.policeStation}</td>
                    <td className="px-4 py-3 text-slate-600">{item.crimeType}</td>
                    <td className="px-4 py-3 text-right font-semibold">{item.incidentCount}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{item.peakWindow}</td>
                    <td className="px-4 py-3 text-slate-500">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={`${card} overflow-hidden p-0`}>
        <div className="p-5">
          <h2 className="text-base font-semibold text-slate-950">Police station comparison</h2>
          <p className="mt-1 text-sm text-slate-500">Aggregated station-level view; no victim or accused details are included.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5 font-medium">Police station</th>
                <th className="px-5 py-2.5 font-medium">District</th>
                <th className="px-5 py-2.5 text-right font-medium">FIRs</th>
                <th className="px-5 py-2.5 text-right font-medium">Solved</th>
                <th className="px-5 py-2.5 text-right font-medium">Pending</th>
                <th className="px-5 py-2.5 font-medium">Top category</th>
                <th className="px-5 py-2.5 text-right font-medium">Risk</th>
                <th className="px-5 py-2.5 text-right font-medium">Vs district avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.stationRows.map((row) => (
                <tr key={`${row.district}-${row.policeStation}`}>
                  <td className="px-5 py-3 font-medium text-slate-900">{row.policeStation}</td>
                  <td className="px-5 py-3 text-slate-600">{row.district}</td>
                  <td className="px-5 py-3 text-right font-semibold">{row.firCount}</td>
                  <td className="px-5 py-3 text-right">{row.solvedCount}</td>
                  <td className="px-5 py-3 text-right">{row.pendingCount}</td>
                  <td className="px-5 py-3 text-slate-600">{row.dominantCategory}</td>
                  <td className="px-5 py-3 text-right">{row.averageRiskScore}</td>
                  <td className="px-5 py-3 text-right">{row.comparisonToDistrictAverage >= 0 ? "+" : ""}{row.comparisonToDistrictAverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PoliceStationAnalyticsContent() {
  const { activeRole } = useAppSession();
  const [draftFilters, setDraftFilters] = useState<StationAnalyticsFilters>(DEFAULT_STATION_ANALYTICS_FILTERS);
  const [filters, setFilters] = useState<StationAnalyticsFilters>(DEFAULT_STATION_ANALYTICS_FILTERS);
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<PoliceStationAnalyticsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState("loading");
      try {
        const result = await fetchPoliceStationAnalytics(filters, activeRole);
        if (cancelled) return;
        setData(result);
        setState(result.totals.firCount === 0 ? "empty" : "ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [filters, activeRole]);

  return (
    <div className="space-y-4">
      <Filters
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={() => setFilters(draftFilters)}
        onReset={() => {
          setDraftFilters(DEFAULT_STATION_ANALYTICS_FILTERS);
          setFilters(DEFAULT_STATION_ANALYTICS_FILTERS);
        }}
      />

      {state === "loading" && (
        <section className={card}>
          <p className="text-sm font-medium text-slate-600">Loading police station analytics...</p>
        </section>
      )}

      {state === "error" && (
        <section className={`${card} text-center`}>
          <h2 className="text-base font-semibold text-slate-950">Unable to load analytics</h2>
          <p className="mt-2 text-sm text-slate-600">The station analytics service did not respond. Please retry.</p>
          <button type="button" onClick={() => setFilters({ ...filters })} className="mt-4 h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
            Retry
          </button>
        </section>
      )}

      {state === "empty" && data && (
        <section className={card}>
          <h2 className="text-base font-semibold text-slate-950">No matching station aggregates</h2>
          <p className="mt-2 text-sm text-slate-600">{data.emptyReason}</p>
        </section>
      )}

      {state === "ready" && data && <AnalyticsContent data={data} />}
    </div>
  );
}

export function PoliceStationAnalytics() {
  return (
    <AppShell
      title="Police Station Analytics"
      description="Analyze FIR count, categories, case status, repeat incidents, response indicators, and station comparison."
      requiredPermission="page:dashboard"
    >
      <PoliceStationAnalyticsContent />
    </AppShell>
  );
}
