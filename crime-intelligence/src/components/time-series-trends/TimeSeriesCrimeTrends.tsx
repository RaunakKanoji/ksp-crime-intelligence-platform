"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { DISTRICTS } from "@/lib/dashboard/types";
import { STATIONS } from "@/lib/dashboard/summary";
import {
  DEFAULT_TREND_FILTERS,
  type TimeSeriesTrendsData,
  type TrendFilters,
  type TrendInterval,
  type TrendRange,
  type TrendDataPoint,
} from "@/lib/time-series-trends/types";
import { fetchTimeSeriesCrimeTrends } from "@/lib/time-series-trends/api";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";
const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 transition-colors";

type LoadState = "loading" | "ready" | "empty" | "error";

const CATEGORIES = [
  "Vehicle Theft",
  "Burglary",
  "Chain Snatching",
  "Cyber Fraud",
  "Assault",
  "Robbery",
  "Missing Person",
  "Narcotics",
];

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
  const isUp = trend === "up";
  const isDown = trend === "down";

  return (
    <section className={cardClass}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-bold text-slate-950">{value}</p>
        {change !== undefined && change !== 0 && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
              isUp
                ? "bg-red-50 text-red-700"
                : isDown
                ? "bg-green-50 text-green-700"
                : "bg-slate-50 text-slate-700"
            }`}
          >
            {isUp && "↑"}
            {isDown && "↓"}
            {!isUp && !isDown && "→"}{" "}
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
  filters: TrendFilters;
  onChange: (filters: TrendFilters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const stations =
    filters.district === "all"
      ? DISTRICTS.flatMap((d) => STATIONS[d as keyof typeof STATIONS] ?? [])
      : STATIONS[filters.district as keyof typeof STATIONS] ?? [];

  return (
    <section className={`${cardClass} flex flex-col gap-4 xl:flex-row xl:items-end`}>
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Time range
        <select
          value={filters.range}
          onChange={(e) => onChange({ ...filters, range: e.target.value as TrendRange })}
          className={inputClass}
        >
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="180d">Last 180 days</option>
          <option value="1y">Last 1 year</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Aggregation interval
        <select
          value={filters.interval}
          onChange={(e) => onChange({ ...filters, interval: e.target.value as TrendInterval })}
          className={inputClass}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        District
        <select
          value={filters.district}
          onChange={(e) =>
            onChange({ ...filters, district: e.target.value, policeStation: "all" })
          }
          className={inputClass}
        >
          <option value="all">All districts</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Police station
        <select
          value={filters.policeStation}
          onChange={(e) => onChange({ ...filters, policeStation: e.target.value })}
          className={inputClass}
        >
          <option value="all">All stations</option>
          {stations.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Crime category
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className={inputClass}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
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

function InteractiveTrendChart({ dataPoints }: { dataPoints: TrendDataPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartWidth = 720;
  const chartHeight = 200;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const totalWidth = chartWidth + paddingLeft + paddingRight;
  const totalHeight = chartHeight + paddingTop + paddingBottom;

  const maxCount = useMemo(() => {
    return Math.max(1, ...dataPoints.map((p) => p.firCount));
  }, [dataPoints]);

  const points = useMemo(() => {
    if (dataPoints.length === 0) return [];
    const stepX = dataPoints.length > 1 ? chartWidth / (dataPoints.length - 1) : chartWidth;

    return dataPoints.map((p, i) => {
      const x = paddingLeft + i * stepX;
      const y = paddingTop + chartHeight - (p.firCount / maxCount) * chartHeight;
      return { x, y, data: p };
    });
  }, [dataPoints, maxCount]);

  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    const baselineY = paddingTop + chartHeight;
    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [points, linePath]);

  // Determine tick intervals for Y axis
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let i = 0; i <= 4; i++) {
      ticks.push(Math.round((maxCount / 4) * i));
    }
    return Array.from(new Set(ticks)).sort((a, b) => a - b);
  }, [maxCount]);

  // Determine which X axis labels to render to avoid overlap
  const xLabelsToRender = useMemo(() => {
    const count = dataPoints.length;
    if (count <= 10) return dataPoints.map((_, i) => i);

    // Pick 5 evenly spaced labels
    const indices: number[] = [];
    const step = (count - 1) / 4;
    for (let i = 0; i < 5; i++) {
      indices.push(Math.round(step * i));
    }
    return indices;
  }, [dataPoints]);

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {yTicks.map((tick) => {
          const y = paddingTop + chartHeight - (tick / maxCount) * chartHeight;
          return (
            <g key={tick} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={y}
                x2={paddingLeft + chartWidth}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] font-medium fill-slate-500"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* X axis line */}
        <line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={paddingLeft + chartWidth}
          y2={paddingTop + chartHeight}
          stroke="#cbd5e1"
          strokeWidth={1.5}
        />

        {/* X axis labels */}
        {points.map((p, i) => {
          if (!xLabelsToRender.includes(i)) return null;
          return (
            <text
              key={i}
              x={p.x}
              y={paddingTop + chartHeight + 20}
              textAnchor="middle"
              className="text-[10px] font-medium fill-slate-500"
            >
              {p.data.label}
            </text>
          );
        })}

        {/* Area segment */}
        {areaPath && (
          <path d={areaPath} fill="url(#chartAreaGradient)" className="transition-all duration-300" />
        )}

        {/* Line segment */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#0f766e"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        )}

        {/* Interaction points */}
        {points.map((p, i) => {
          const isHovered = hoveredIndex === i;
          return (
            <g key={i}>
              {/* Invisible interactive overlay circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={16}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* Visible dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 4}
                fill={isHovered ? "#ffffff" : "#0f766e"}
                stroke="#0f766e"
                strokeWidth={isHovered ? 3 : 1.5}
                className="transition-all duration-150 pointer-events-none"
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredPoint && (
        <div
          className="absolute z-10 rounded-lg border border-slate-200 bg-white p-3 shadow-md text-xs space-y-1.5 pointer-events-none max-w-xs transition-opacity duration-150"
          style={{
            left: `${(hoveredPoint.x / totalWidth) * 100}%`,
            top: `${((hoveredPoint.y - 100) / totalHeight) * 100}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex justify-between gap-4">
            <span>{hoveredPoint.data.label}</span>
            <span className="text-teal-700">{hoveredPoint.data.firCount} FIRs</span>
          </div>
          <div>
            <div className="flex justify-between gap-6 text-slate-600">
              <span>Solved Rate:</span>
              <span className="font-semibold text-slate-800">
                {hoveredPoint.data.firCount > 0
                  ? `${Math.round((hoveredPoint.data.solvedCount / hoveredPoint.data.firCount) * 100)}%`
                  : "0%"}
              </span>
            </div>
            {Object.keys(hoveredPoint.data.categoryBreakdown).length > 0 && (
              <div className="mt-1 pt-1 border-t border-slate-50 text-[10px] space-y-0.5">
                <span className="font-semibold text-slate-400 uppercase tracking-wide">Category Share</span>
                {Object.entries(hoveredPoint.data.categoryBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([cat, count]) => (
                    <div key={cat} className="flex justify-between text-slate-500">
                      <span className="truncate max-w-[120px]">{cat}:</span>
                      <span>{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryTrendsSection({ dataPoints }: { dataPoints: TrendDataPoint[] }) {
  const aggregatedCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    dataPoints.forEach((p) => {
      Object.entries(p.categoryBreakdown).forEach(([cat, count]) => {
        counts[cat] = (counts[cat] ?? 0) + count;
        total += count;
      });
    });

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        share: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [dataPoints]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...aggregatedCategories.map((c) => c.count));
  }, [aggregatedCategories]);

  return (
    <section className={cardClass}>
      <h2 className="text-base font-semibold text-slate-950">Category distribution</h2>
      <p className="text-xs text-slate-500 mt-0.5">Top crime categories reported in the selected period.</p>
      <div className="mt-4 space-y-4">
        {aggregatedCategories.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No categories reported.</p>
        ) : (
          aggregatedCategories.map((item) => (
            <div key={item.category}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{item.category}</span>
                <span className="text-slate-500">
                  {item.count} · {item.share}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-700"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DistrictTrendsSection({ dataPoints }: { dataPoints: TrendDataPoint[] }) {
  const aggregatedDistricts = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    dataPoints.forEach((p) => {
      Object.entries(p.districtBreakdown).forEach(([dist, count]) => {
        counts[dist] = (counts[dist] ?? 0) + count;
        total += count;
      });
    });

    return Object.entries(counts)
      .map(([district, count]) => ({
        district,
        count,
        share: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [dataPoints]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...aggregatedDistricts.map((d) => d.count));
  }, [aggregatedDistricts]);

  return (
    <section className={cardClass}>
      <h2 className="text-base font-semibold text-slate-950">District breakdown</h2>
      <p className="text-xs text-slate-500 mt-0.5">Geographical distribution of active occurrences.</p>
      <div className="mt-4 space-y-4">
        {aggregatedDistricts.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No district records.</p>
        ) : (
          aggregatedDistricts.map((item) => (
            <div key={item.district}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{item.district}</span>
                <span className="text-slate-500">
                  {item.count} · {item.share}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-500"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function TimeSeriesCrimeTrendsContent({ data }: { data: TimeSeriesTrendsData }) {
  const trendsTable = useMemo(() => {
    // Reverse points to show latest dates first in the table
    return [...data.dataPoints].reverse();
  }, [data.dataPoints]);

  return (
    <div className="space-y-6">
      {/* Demo and summary indicators */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
          Aggregated analytics
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
          Demo data
        </span>
        <span className="text-xs text-slate-500 font-medium">
          Interval: <span className="capitalize">{data.filters.interval}</span> | Range:{" "}
          {data.filters.range} | Category:{" "}
          {data.filters.category === "all" ? "All categories" : data.filters.category}
        </span>
      </div>

      {/* Summary KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Crime count"
          value={data.totals.firCount}
          helper={`Previous period: ${data.totals.prevFirCount}`}
          trend={data.totals.changePercentage >= 0 ? "up" : "down"}
          change={data.totals.changePercentage}
        />
        <StatCard
          label="Solved rate"
          value={`${data.totals.solvedRate}%`}
          helper="Share of closed/charge-sheeted cases"
        />
        <StatCard
          label="Peak interval"
          value={data.totals.peakInterval}
          helper={`Peak volume: ${data.totals.peakCount} FIRs`}
        />
        <StatCard
          label="Trend index"
          value={
            data.totals.changePercentage > 5
              ? "Spike Observed"
              : data.totals.changePercentage < -5
              ? "Decline Trend"
              : "Stable"
          }
          helper="Comparison index to previous window"
        />
      </div>

      {/* Main visualization card */}
      <section className={cardClass}>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-950">Crime Trend Over Time</h2>
          <p className="text-xs text-slate-500">
            Interactive chart. Hover on specific data points to view count, solved rates, and top crime types.
          </p>
        </div>
        <InteractiveTrendChart dataPoints={data.dataPoints} />
      </section>

      {/* Distribution Grid */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <CategoryTrendsSection dataPoints={data.dataPoints} />
        <DistrictTrendsSection dataPoints={data.dataPoints} />
      </div>

      {/* Seasonality insights */}
      <section className={cardClass}>
        <h2 className="text-base font-semibold text-slate-950">Seasonality highlights & anomalies</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Calculated temporal variations. Requires official human investigator verification.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {data.seasonalityNotes.map((note) => (
            <div
              key={note.id}
              className={`rounded-lg border p-4 ${
                note.significance === "high"
                  ? "border-red-100 bg-red-50/50"
                  : note.significance === "medium"
                  ? "border-amber-100 bg-amber-50/50"
                  : "border-slate-100 bg-slate-50/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    note.significance === "high"
                      ? "bg-red-100 text-red-800"
                      : note.significance === "medium"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {note.significance} severity
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase">
                  {note.period}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">{note.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{note.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Detail Table */}
      <section className={`${cardClass} overflow-hidden p-0`}>
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-950">Trend data points</h2>
          <p className="text-xs text-slate-500 mt-0.5">Aggregated granular numbers of matching timeline intervals.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Interval Label</th>
                <th className="px-5 py-3 text-right">FIRs Count</th>
                <th className="px-5 py-3 text-right">Solved count</th>
                <th className="px-5 py-3 text-right">Solved rate</th>
                <th className="px-5 py-3 text-right">Top Reported crime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trendsTable.map((row) => {
                const solvedRate = row.firCount > 0 ? Math.round((row.solvedCount / row.firCount) * 100) : 0;
                const topCategory = Object.entries(row.categoryBreakdown).sort(
                  (a, b) => b[1] - a[1]
                )[0]?.[0] ?? "None";

                return (
                  <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{row.label}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                      {row.firCount}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600">{row.solvedCount}</td>
                    <td className="px-5 py-3.5 text-right text-slate-600">
                      <span className="font-semibold">{solvedRate}%</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600">{topCategory}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TimeSeriesCrimeTrendsDashboard() {
  const { activeRole } = useAppSession();

  const [draftFilters, setDraftFilters] = useState<TrendFilters>(DEFAULT_TREND_FILTERS);
  const [filters, setFilters] = useState<TrendFilters>(DEFAULT_TREND_FILTERS);

  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<TimeSeriesTrendsData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      try {
        const result = await fetchTimeSeriesCrimeTrends(filters, activeRole);
        if (cancelled) return;

        setData(result);
        if (result.totals.firCount === 0) {
          setState("empty");
        } else {
          setState("ready");
        }
      } catch {
        if (!cancelled) {
          setState("error");
        }
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
          setDraftFilters(DEFAULT_TREND_FILTERS);
          setFilters(DEFAULT_TREND_FILTERS);
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
          <h2 className="text-base font-semibold text-slate-950">Unable to load crime trends</h2>
          <p className="mt-2 text-sm text-slate-600">
            The time-series analysis service failed to respond. Please try again.
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
          <h2 className="text-base font-semibold text-slate-950">No temporal occurrences found</h2>
          <p className="mt-2 text-sm text-slate-600">{data.emptyReason}</p>
        </section>
      )}

      {state === "ready" && data && <TimeSeriesCrimeTrendsContent data={data} />}
    </div>
  );
}

export function TimeSeriesCrimeTrends() {
  return (
    <AppShell
      title="Time-Series Crime Trends"
      description="Analyze structural spikes, regular seasonal anomalies, and historical crime trajectory profiles."
      requiredPermission="page:time-series-trends"
    >
      <TimeSeriesCrimeTrendsDashboard />
    </AppShell>
  );
}
