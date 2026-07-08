"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import {
  DEFAULT_DISTRICT_ANALYTICS_FILTERS,
  type DistrictComparisonData,
  type DistrictComparisonFilters,
  type DistrictComparisonRow,
  type ComparisonRange,
} from "@/lib/district-crime-comparison/types";
import { fetchDistrictCrimeComparison } from "@/lib/district-crime-comparison/api";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";
const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 transition-colors";

type LoadState = "loading" | "ready" | "empty" | "error";
type SortField = "district" | "population" | "firCount" | "crimeRatePer100k" | "solvedRate" | "averageRiskScore";
type SortOrder = "asc" | "desc";

function StatCard({
  label,
  value,
  helper,
  trend,
  change,
}: {
  label: string;
  value: string | number;
  helper: string;
  trend?: "up" | "down" | "flat";
  change?: number;
}) {
  return (
    <section className={cardClass}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-bold text-slate-950">{value}</p>
        {trend && change !== undefined && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
              trend === "up"
                ? "bg-red-50 text-red-700"
                : trend === "down"
                ? "bg-green-50 text-green-700"
                : "bg-slate-50 text-slate-700"
            }`}
          >
            {trend === "up" && "↑"}
            {trend === "down" && "↓"}
            {trend === "flat" && "→"}{" "}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{helper}</p>
    </section>
  );
}

function Filters({
  filters,
  onChange,
  onApply,
  onReset,
}: {
  filters: DistrictComparisonFilters;
  onChange: (filters: DistrictComparisonFilters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const categories = [
    "Vehicle Theft",
    "Burglary",
    "Chain Snatching",
    "Cyber Fraud",
    "Assault",
    "Robbery",
    "Missing Person",
    "Narcotics",
  ];

  return (
    <section className={`${cardClass} flex flex-col gap-4 xl:flex-row xl:items-end`}>
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Time window
        <select
          value={filters.range}
          onChange={(event) =>
            onChange({ ...filters, range: event.target.value as ComparisonRange })
          }
          className={inputClass}
        >
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="180d">Last 180 days</option>
          <option value="1y">Last 1 year</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Crime category
        <select
          value={filters.category}
          onChange={(event) => onChange({ ...filters, category: event.target.value })}
          className={inputClass}
        >
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </label>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={onApply}
          className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onReset}
          className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </section>
  );
}

function ProgressBar({
  value,
  tone = "teal",
  label,
  rightLabel,
  dark = false,
}: {
  value: number;
  tone?: "teal" | "amber" | "slate" | "red" | "green";
  label?: string;
  rightLabel?: string;
  dark?: boolean;
}) {
  const color =
    tone === "amber"
      ? "bg-amber-500"
      : tone === "red"
      ? "bg-red-500"
      : tone === "green"
      ? "bg-green-600"
      : tone === "slate"
      ? "bg-slate-500"
      : "bg-teal-700";

  return (
    <div>
      {(label || rightLabel) && (
        <div className="mb-1 flex items-center justify-between text-xs font-medium">
          {label && <span className="text-slate-700">{label}</span>}
          {rightLabel && <span className="text-slate-500">{rightLabel}</span>}
        </div>
      )}
      <div className={`h-2 overflow-hidden rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function DistrictCrimeComparisonContent({ data }: { data: DistrictComparisonData }) {
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("crimeRatePer100k");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [chartMetric, setChartMetric] = useState<"rate" | "count">("rate");

  // If no district selected, default to the top one by rate
  const selectedDistrict = useMemo(() => {
    if (data.districtRows.length === 0) return null;
    if (selectedDistrictName) {
      const match = data.districtRows.find((r) => r.district === selectedDistrictName);
      if (match) return match;
    }
    return data.districtRows[0];
  }, [data.districtRows, selectedDistrictName]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedRows = useMemo(() => {
    const rows = [...data.districtRows];
    rows.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      aVal = aVal as number;
      bVal = bVal as number;
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
    return rows;
  }, [data.districtRows, sortField, sortOrder]);

  const maxRate = Math.max(0.1, ...data.districtRows.map((r) => r.crimeRatePer100k));
  const maxCount = Math.max(1, ...data.districtRows.map((r) => r.firCount));

  return (
    <div className="space-y-6">
      {/* Demo indicators */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
          Aggregated analytics
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
          Demo data
        </span>
        <span className="text-xs text-slate-500 font-medium">
          Filters applied: range = {data.filters.range}, category = {data.filters.category === "all" ? "All categories" : data.filters.category}
        </span>
      </div>

      {/* Summary KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="State total FIRs"
          value={data.totals.firCount}
          helper={`Previous period: ${data.totals.prevFirCount}`}
          trend={data.totals.trend}
          change={data.totals.changePercentage}
        />
        <StatCard
          label="State crime rate"
          value={`${data.totals.crimeRatePer100k}`}
          helper="Crimes per 100,000 population"
        />
        <StatCard
          label="Solved rate"
          value={`${data.totals.solvedRate}%`}
          helper="Statewide closing status"
        />
        <StatCard
          label="Avg risk score"
          value={`${data.totals.averageRiskScore} / 10`}
          helper="Incident priority score average"
        />
      </div>

      {/* Main comparative grid */}
      <div className="grid gap-6 xl:grid-cols-[1.8fr_1.2fr]">
        {/* District list table */}
        <section className={`${cardClass} overflow-hidden p-0 flex flex-col`}>
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">District rankings</h2>
              <p className="text-xs text-slate-500 mt-0.5">Click column headers to sort, or select a row to see detailed breakdown.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 text-center">Rank</th>
                  <th
                    className="px-5 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("district")}
                  >
                    District {sortField === "district" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="px-5 py-3 text-right cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("population")}
                  >
                    Population {sortField === "population" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="px-5 py-3 text-right cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("firCount")}
                  >
                    FIRs (current) {sortField === "firCount" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="px-5 py-3 text-right cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("crimeRatePer100k")}
                  >
                    Rate per 100k {sortField === "crimeRatePer100k" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="px-5 py-3 text-right cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("solvedRate")}
                  >
                    Solved Rate {sortField === "solvedRate" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="px-5 py-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("averageRiskScore")}
                  >
                    Avg Risk {sortField === "averageRiskScore" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="px-5 py-3 text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRows.map((row, index) => {
                  const isSelected = selectedDistrict?.district === row.district;
                  const rank = data.districtRows.findIndex((r) => r.district === row.district) + 1;
                  
                  return (
                    <tr
                      key={row.district}
                      onClick={() => setSelectedDistrictName(row.district)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-teal-50/70 hover:bg-teal-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-500">{rank}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{row.district}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600">
                        {row.population.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                        {row.firCount}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-teal-800">
                        {row.crimeRatePer100k}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                        {row.solvedRate}%
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-slate-700">
                        {row.averageRiskScore}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
                            row.trend === "up"
                              ? "bg-red-50 text-red-700"
                              : row.trend === "down"
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-50 text-slate-700"
                          }`}
                        >
                          {row.trend === "up" && "↑"}
                          {row.trend === "down" && "↓"}
                          {row.trend === "flat" && "→"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Selected District Details Side panel */}
        {selectedDistrict && (
          <section className="space-y-4">
            <div className="rounded-lg bg-slate-900 p-5 text-white shadow-md">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
                  Detailed profile
                </span>
                <h2 className="text-xl font-bold mt-1 text-slate-100">{selectedDistrict.district}</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Population: {selectedDistrict.population.toLocaleString()} citizens
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-800 p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                    Total Crimes
                  </span>
                  <span className="text-2xl font-bold mt-1 block">{selectedDistrict.firCount}</span>
                  <span className="text-xs text-slate-400 block mt-1">
                    Prev: {selectedDistrict.prevFirCount}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-800 p-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                    Rate per 100k
                  </span>
                  <span className="text-2xl font-bold text-teal-400 mt-1 block">
                    {selectedDistrict.crimeRatePer100k}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">
                    Prev: {selectedDistrict.prevCrimeRatePer100k}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-300">
                    <span>Solved rate</span>
                    <span>{selectedDistrict.solvedRate}%</span>
                  </div>
                  <ProgressBar value={selectedDistrict.solvedRate} tone="green" dark />
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-300">
                    <span>Average incident risk</span>
                    <span>{selectedDistrict.averageRiskScore} / 10</span>
                  </div>
                  <ProgressBar value={selectedDistrict.averageRiskScore * 10} tone="amber" dark />
                </div>
              </div>
            </div>

            {/* Category breakdown card */}
            <div className={cardClass}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Category Breakdown ({selectedDistrict.district})
              </h3>
              <div className="mt-4 space-y-4">
                {selectedDistrict.categoryBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    No crimes recorded in this range.
                  </p>
                ) : (
                  selectedDistrict.categoryBreakdown.map((item) => (
                    <div key={item.category}>
                      <ProgressBar
                        value={item.share * 100}
                        tone="teal"
                        label={item.category}
                        rightLabel={`${item.count} FIRs (${Math.round(item.share * 100)}%)`}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* SVG Bar Chart Visualization */}
      <section className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-950">Visual crime metrics comparative</h2>
            <p className="text-xs text-slate-500 mt-0.5">Quick statewide distribution analysis by metric.</p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setChartMetric("rate")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                chartMetric === "rate"
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Crime Rate per 100k
            </button>
            <button
              type="button"
              onClick={() => setChartMetric("count")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                chartMetric === "count"
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Total FIRs
            </button>
          </div>
        </div>

        {/* SVG chart */}
        <div className="h-64 w-full">
          <svg viewBox="0 0 800 240" className="h-full w-full font-medium" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="60" y1="20" x2="780" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="60" y1="70" x2="780" y2="70" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="60" y1="120" x2="780" y2="120" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="60" y1="170" x2="780" y2="170" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="60" y1="200" x2="780" y2="200" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Bars */}
            {data.districtRows.map((row, idx) => {
              const x = 90 + idx * 110;
              const value = chartMetric === "rate" ? row.crimeRatePer100k : row.firCount;
              const maxValue = chartMetric === "rate" ? maxRate : maxCount;
              
              // Map value to Y coordinate (height range: 20 to 200, so height is up to 180)
              const height = (value / maxValue) * 160 || 4; // minimum 4px height
              const y = 200 - height;
              const isSelected = selectedDistrict?.district === row.district;

              return (
                <g
                  key={row.district}
                  className="cursor-pointer group"
                  onClick={() => setSelectedDistrictName(row.district)}
                >
                  {/* Hover background highlight */}
                  <rect
                    x={x - 25}
                    y="10"
                    width="80"
                    height="210"
                    fill="transparent"
                    className="group-hover:fill-slate-50 transition-colors"
                    rx="4"
                  />

                  {/* The bar */}
                  <rect
                    x={x}
                    y={y}
                    width="30"
                    height={height}
                    fill={isSelected ? "#0d9488" : "#94a3b8"}
                    rx="2"
                    className="transition-all duration-300"
                  />

                  {/* Value tag */}
                  <text
                    x={x + 15}
                    y={y - 8}
                    textAnchor="middle"
                    className="text-[10px] font-bold"
                    fill={isSelected ? "#0f766e" : "#64748b"}
                  >
                    {value}
                  </text>

                  {/* X Axis label */}
                  <text
                    x={x + 15}
                    y="220"
                    textAnchor="middle"
                    className="text-[10px] font-semibold"
                    fill={isSelected ? "#0f766e" : "#475569"}
                  >
                    {row.district.replace(" City", "")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>
    </div>
  );
}

function DistrictCrimeComparisonDashboard() {
  const { activeRole } = useAppSession();
  const [draftFilters, setDraftFilters] = useState<DistrictComparisonFilters>(
    DEFAULT_DISTRICT_ANALYTICS_FILTERS
  );
  const [filters, setFilters] = useState<DistrictComparisonFilters>(
    DEFAULT_DISTRICT_ANALYTICS_FILTERS
  );
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<DistrictComparisonData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState("loading");
      try {
        const result = await fetchDistrictCrimeComparison(filters, activeRole);
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
    <div className="space-y-6">
      <Filters
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={() => setFilters(draftFilters)}
        onReset={() => {
          setDraftFilters(DEFAULT_DISTRICT_ANALYTICS_FILTERS);
          setFilters(DEFAULT_DISTRICT_ANALYTICS_FILTERS);
        }}
      />

      {state === "loading" && (
        <section className={cardClass}>
          <div className="space-y-4">
            <div className="h-6 w-1/4 animate-pulse rounded bg-slate-200" />
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="h-20 animate-pulse rounded bg-slate-200" />
              <div className="h-20 animate-pulse rounded bg-slate-200" />
              <div className="h-20 animate-pulse rounded bg-slate-200" />
              <div className="h-20 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="h-64 animate-pulse rounded bg-slate-200" />
          </div>
        </section>
      )}

      {state === "error" && (
        <section className={`${cardClass} text-center py-10`}>
          <h2 className="text-base font-semibold text-slate-950">Unable to load comparison analytics</h2>
          <p className="mt-2 text-sm text-slate-600">
            The comparison analytics service failed to load. Please retry.
          </p>
          <button
            type="button"
            onClick={() => setFilters({ ...filters })}
            className="mt-4 h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
          >
            Retry
          </button>
        </section>
      )}

      {state === "empty" && data && (
        <section className={`${cardClass} text-center py-10`}>
          <h2 className="text-base font-semibold text-slate-950">No comparative records</h2>
          <p className="mt-2 text-sm text-slate-600">{data.emptyReason}</p>
        </section>
      )}

      {state === "ready" && data && <DistrictCrimeComparisonContent data={data} />}
    </div>
  );
}

export function DistrictCrimeComparison() {
  return (
    <AppShell
      title="District Crime Comparison"
      description="Compare crime frequency, population-normalized rates, and solved status across Karnataka districts."
      requiredPermission="page:district-comparison"
    >
      <DistrictCrimeComparisonDashboard />
    </AppShell>
  );
}
