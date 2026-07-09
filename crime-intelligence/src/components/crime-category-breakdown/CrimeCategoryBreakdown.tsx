"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import {
  DEFAULT_CATEGORY_BREAKDOWN_FILTERS,
  type CategoryBreakdownData,
  type CategoryBreakdownFilters,
  type CategoryBreakdownItem,
  type CategoryFirDetail,
  type CategoryBreakdownRange,
} from "@/lib/crime-category-breakdown/types";
import { fetchCrimeCategoryBreakdown } from "@/lib/crime-category-breakdown/api";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 shadow-sm";
const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 transition-colors";

type LoadState = "loading" | "ready" | "empty" | "error";
type SortField = "category" | "count" | "share" | "solvedRate" | "change";
type SortOrder = "asc" | "desc";

// Color palette for the categories
const CATEGORY_COLORS: Record<string, { stroke: string; bg: string; text: string }> = {
  "Vehicle Theft": { stroke: "#0d9488", bg: "bg-teal-500", text: "text-teal-600" }, // teal-600
  "Burglary": { stroke: "#4f46e5", bg: "bg-indigo-500", text: "text-indigo-600" }, // indigo-600
  "Chain Snatching": { stroke: "#e11d48", bg: "bg-rose-500", text: "text-rose-600" }, // rose-600
  "Cyber Fraud": { stroke: "#d97706", bg: "bg-amber-500", text: "text-amber-600" }, // amber-600
  "Assault": { stroke: "#059669", bg: "bg-emerald-500", text: "text-emerald-600" }, // emerald-600
  "Robbery": { stroke: "#7c3aed", bg: "bg-violet-500", text: "text-violet-600" }, // violet-600
  "Missing Person": { stroke: "#0284c7", bg: "bg-sky-500", text: "text-sky-600" }, // sky-600
  "Narcotics": { stroke: "#475569", bg: "bg-slate-500", text: "text-slate-600" }, // slate-600
};

const DEFAULT_COLOR = { stroke: "#94a3b8", bg: "bg-slate-400", text: "text-slate-500" };

function getCategoryColors(catName: string) {
  return CATEGORY_COLORS[catName] || DEFAULT_COLOR;
}

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
  filters: CategoryBreakdownFilters;
  onChange: (filters: CategoryBreakdownFilters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const districts = [
    "Bengaluru City",
    "Mysuru",
    "Belagavi",
    "Kalaburagi",
    "Mangaluru",
    "Hubballi-Dharwad",
  ];

  return (
    <section className={`${cardClass} flex flex-col gap-4 xl:flex-row xl:items-end`}>
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        District
        <select
          value={filters.district}
          onChange={(event) => onChange({ ...filters, district: event.target.value })}
          className={inputClass}
        >
          <option value="all">All Districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Time window
        <select
          value={filters.range}
          onChange={(event) =>
            onChange({ ...filters, range: event.target.value as CategoryBreakdownRange })
          }
          className={inputClass}
        >
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="180d">Last 180 days</option>
          <option value="1y">Last 1 year</option>
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

function DonutChart({
  categories,
  activeCategory,
  onSelectCategory,
  totalCount,
}: {
  categories: CategoryBreakdownItem[];
  activeCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  totalCount: number;
}) {
  const [hoveredCategory, setHoveredCategory] = useState<CategoryBreakdownItem | null>(null);

  // Filter out categories with zero count to draw clean segments
  const activeSegments = useMemo(() => {
    return categories.filter((c) => c.count > 0);
  }, [categories]);

  // SVG parameters
  const radius = 90;
  const strokeWidth = 24;
  const center = 130;
  const circumference = 2 * Math.PI * radius;

  // Compute segments offsets
  const segments = useMemo(() => {
    let accumulatedShare = 0;
    return activeSegments.map((cat) => {
      const share = cat.share;
      const dashLength = (share / 100) * circumference;
      const offset = (accumulatedShare / 100) * circumference;
      accumulatedShare += share;
      const colors = getCategoryColors(cat.category);
      return {
        ...cat,
        dashLength,
        offset: -offset,
        colors,
      };
    });
  }, [activeSegments, circumference]);

  const displayTitle = hoveredCategory
    ? hoveredCategory.category
    : activeCategory
    ? activeCategory
    : "Total Crimes";

  const displayCount = hoveredCategory
    ? hoveredCategory.count
    : activeCategory
    ? categories.find((c) => c.category === activeCategory)?.count || 0
    : totalCount;

  const displayShare = hoveredCategory
    ? hoveredCategory.share
    : activeCategory
    ? categories.find((c) => c.category === activeCategory)?.share || 0
    : 100;

  return (
    <div className="flex flex-col items-center justify-around gap-6 md:flex-row">
      <div className="relative h-64 w-64 flex-shrink-0">
        <svg width="260" height="260" viewBox="0 0 260 260" className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg) => {
            const isActive = activeCategory === seg.category;
            const isHovered = hoveredCategory?.category === seg.category;
            const currentStrokeWidth = isActive || isHovered ? strokeWidth + 4 : strokeWidth;
            return (
              <circle
                key={seg.category}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.colors.stroke}
                strokeWidth={currentStrokeWidth}
                strokeDasharray={`${seg.dashLength} ${circumference}`}
                strokeDashoffset={seg.offset}
                className="cursor-pointer transition-all duration-200 hover:opacity-90"
                onMouseEnter={() => setHoveredCategory(seg)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => onSelectCategory(isActive ? null : seg.category)}
              />
            );
          })}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 max-w-[130px] truncate">
            {displayTitle}
          </p>
          <p className="mt-1 text-3xl font-extrabold text-slate-950">{displayCount}</p>
          <p className="text-xs text-slate-500">{displayShare}% share</p>
        </div>
      </div>

      {/* Grid Legend */}
      <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2">
        {categories.map((cat) => {
          const colors = getCategoryColors(cat.category);
          const isSelected = activeCategory === cat.category;
          return (
            <button
              key={cat.category}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : cat.category)}
              className={`flex items-center gap-3 rounded-lg border p-2.5 text-left text-xs transition-all ${
                isSelected
                  ? "border-teal-600 bg-teal-50/50 ring-1 ring-teal-600"
                  : "border-slate-100 bg-slate-50/30 hover:bg-slate-50"
              }`}
            >
              <span className={`h-3 w-3 flex-shrink-0 rounded-sm ${colors.bg}`} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 truncate">{cat.category}</p>
                <p className="text-slate-500">
                  {cat.count} cases ({cat.share}%)
                </p>
              </div>
              {cat.count > 0 && cat.change !== 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    cat.trend === "up"
                      ? "bg-red-50 text-red-700"
                      : cat.trend === "down"
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {cat.trend === "up" ? "↑" : cat.trend === "down" ? "↓" : "→"} {Math.abs(cat.change)}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategoryTable({
  categories,
  activeCategory,
  onSelectCategory,
  sortField,
  sortOrder,
  onSort,
}: {
  categories: CategoryBreakdownItem[];
  activeCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}) {
  const SortArrow = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-slate-300">↕</span>;
    return sortOrder === "asc" ? <span className="ml-1 text-teal-700">▲</span> : <span className="ml-1 text-teal-700">▼</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs text-slate-700">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50 uppercase tracking-wide text-slate-500 font-semibold">
            <th
              className="cursor-pointer py-3 px-4 hover:bg-slate-100"
              onClick={() => onSort("category")}
            >
              Category <SortArrow field="category" />
            </th>
            <th
              className="cursor-pointer py-3 px-4 text-right hover:bg-slate-100"
              onClick={() => onSort("count")}
            >
              Incident Count <SortArrow field="count" />
            </th>
            <th
              className="cursor-pointer py-3 px-4 hover:bg-slate-100"
              onClick={() => onSort("share")}
            >
              Share (%) <SortArrow field="share" />
            </th>
            <th
              className="cursor-pointer py-3 px-4 text-right hover:bg-slate-100"
              onClick={() => onSort("solvedRate")}
            >
              Solved Rate <SortArrow field="solvedRate" />
            </th>
            <th
              className="cursor-pointer py-3 px-4 text-right hover:bg-slate-100"
              onClick={() => onSort("change")}
            >
              Trend (Growth) <SortArrow field="change" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.category;
            const colors = getCategoryColors(cat.category);
            return (
              <tr
                key={cat.category}
                onClick={() => onSelectCategory(isSelected ? null : cat.category)}
                className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${
                  isSelected ? "bg-teal-50/40 font-medium" : ""
                }`}
              >
                <td className="py-3.5 px-4 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${colors.bg}`} />
                  <span className="text-slate-900 font-semibold">{cat.category}</span>
                </td>
                <td className="py-3.5 px-4 text-right text-slate-900 font-bold">{cat.count}</td>
                <td className="py-3.5 px-4 min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-slate-600">{cat.share}%</span>
                    <div className="h-1.5 w-full max-w-[100px] rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${colors.bg}`} style={{ width: `${cat.share}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right text-slate-900">
                  {cat.solvedRate}%
                  <span className="ml-1 text-[10px] text-slate-400">
                    ({cat.solvedCount}/{cat.count})
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {cat.count > 0 && cat.change !== 0 ? (
                    <span
                      className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 font-bold ${
                        cat.trend === "up"
                          ? "bg-red-50 text-red-700"
                          : cat.trend === "down"
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {cat.trend === "up" && "↑"}
                      {cat.trend === "down" && "↓"}
                      {cat.trend === "flat" && "→"}{" "}
                      {Math.abs(cat.change)}%
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FirDrillDown({
  category,
  firs,
  onClose,
}: {
  category: string;
  firs: CategoryFirDetail[];
  onClose: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFirs = useMemo(() => {
    if (!searchTerm.trim()) return firs;
    const term = searchTerm.toLowerCase();
    return firs.filter(
      (fir) =>
        fir.firNumber.toLowerCase().includes(term) ||
        fir.policeStation.toLowerCase().includes(term) ||
        fir.accusedName.toLowerCase().includes(term) ||
        fir.victimName.toLowerCase().includes(term) ||
        fir.incidentSummary.toLowerCase().includes(term)
    );
  }, [firs, searchTerm]);

  const severityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Closed":
        return "bg-green-50 text-green-700 border-green-200";
      case "Charge Sheet Filed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Under Investigation":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">{category} Records</h2>
          <p className="text-xs text-slate-500">{firs.length} total active incidents</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title="Close Inspector"
        >
          ✕
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter FIRs by number, suspect, station..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none focus:border-teal-600 focus:bg-white transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
        {filteredFirs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
            <p className="text-sm">No matching FIR records</p>
            <p className="text-xs mt-1">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredFirs.map((fir) => (
            <div
              key={fir.id}
              className="rounded-lg border border-slate-200 p-3.5 space-y-2 bg-slate-50/30 hover:border-teal-200 hover:bg-slate-50/60 transition-all text-xs"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/fir-search/${fir.id}`}
                  className="font-bold text-teal-700 hover:underline hover:text-teal-800"
                >
                  {fir.firNumber}
                </Link>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusColor(
                    fir.caseStatus
                  )}`}
                >
                  {fir.caseStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-500">
                <p>
                  <strong className="text-slate-700">Station:</strong> {fir.policeStation}
                </p>
                <p>
                  <strong className="text-slate-700">Date:</strong> {fir.incidentDateTime.slice(0, 10)}
                </p>
                <p className="col-span-2">
                  <strong className="text-slate-700">Accused:</strong>{" "}
                  <span className={fir.accusedName.includes("Redacted") ? "italic text-red-500" : "text-slate-900"}>
                    {fir.accusedName}
                  </span>
                </p>
                <p className="col-span-2">
                  <strong className="text-slate-700">Victim:</strong>{" "}
                  <span className={fir.victimName.includes("Redacted") ? "italic text-red-500" : "text-slate-900"}>
                    {fir.victimName}
                  </span>
                </p>
              </div>

              <div className="flex gap-2 pt-1 border-t border-slate-100/50">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${severityColor(
                    fir.severity
                  )}`}
                >
                  {fir.severity}
                </span>
                <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  Score: <strong className="ml-0.5 text-slate-900">{fir.riskScore}</strong>
                </span>
              </div>

              <p className="text-slate-600 line-clamp-2 mt-1.5 italic bg-white border border-slate-100 p-1.5 rounded text-[11px]">
                &quot;{fir.incidentSummary}&quot;
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CrimeCategoryBreakdownContent({ data }: { data: CategoryBreakdownData }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [sortField, setSortField] = useState<SortField>("count");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Reset active category on filter changes
  useEffect(() => {
    setActiveCategory(null);
  }, [data.filters]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedCategories = useMemo(() => {
    return [...data.categories].sort((a, b) => {
      let multiplier = sortOrder === "asc" ? 1 : -1;
      if (sortField === "category") {
        return a.category.localeCompare(b.category) * multiplier;
      }
      return (a[sortField] - b[sortField]) * multiplier;
    });
  }, [data.categories, sortField, sortOrder]);

  // Compute stat card metrics
  const totalCrimes = data.totalCount;

  const topCategory = useMemo(() => {
    if (data.categories.length === 0) return null;
    return data.categories[0]; // Already sorted count-desc by service
  }, [data.categories]);

  const highestGrowth = useMemo(() => {
    if (data.categories.length === 0) return null;
    return [...data.categories].sort((a, b) => b.change - a.change)[0];
  }, [data.categories]);

  const avgSolvedRate = useMemo(() => {
    if (data.categories.length === 0) return 0;
    const solved = data.categories.reduce((sum, c) => sum + c.solvedCount, 0);
    return totalCrimes > 0 ? Number(((solved / totalCrimes) * 100).toFixed(1)) : 0;
  }, [data.categories, totalCrimes]);

  const activeCategoryFirs = activeCategory ? data.firs[activeCategory] || [] : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Incidents"
          value={totalCrimes}
          helper="Crimes recorded in selected filter"
        />
        <StatCard
          label="Top Category"
          value={topCategory ? topCategory.category : "N/A"}
          helper={topCategory ? `${topCategory.count} cases (${topCategory.share}% share)` : "No data available"}
        />
        <StatCard
          label="Highest Growth"
          value={highestGrowth && highestGrowth.change > 0 ? highestGrowth.category : "N/A"}
          helper={
            highestGrowth && highestGrowth.change > 0
              ? `Increased by +${highestGrowth.change}%`
              : "No growth observed"
          }
          trend={highestGrowth && highestGrowth.change > 0 ? "up" : "flat"}
          change={highestGrowth ? highestGrowth.change : 0}
        />
        <StatCard
          label="Avg Solved Rate"
          value={`${avgSolvedRate}%`}
          helper="Overall case resolution status"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main analytical card */}
        <section className={`${cardClass} lg:col-span-2 flex flex-col`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Category Distribution</h2>
              <p className="text-xs text-slate-500">
                Visualizing proportions and trend velocities
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode("chart")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  viewMode === "chart"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Chart View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  viewMode === "table"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Table View
              </button>
            </div>
          </div>

          <div className="flex-1">
            {viewMode === "chart" ? (
              <DonutChart
                categories={data.categories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                totalCount={totalCrimes}
              />
            ) : (
              <CategoryTable
                categories={sortedCategories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            )}
          </div>
        </section>

        {/* Drill-down panel */}
        <section className={cardClass}>
          {activeCategory ? (
            <FirDrillDown
              category={activeCategory}
              firs={activeCategoryFirs}
              onClose={() => setActiveCategory(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full py-16 text-slate-400">
              <svg
                className="h-12 w-12 text-slate-300 stroke-1.5 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              <h3 className="text-sm font-bold text-slate-800">Select a Category</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                Click a slice in the chart or a row in the table to inspect individual FIRs.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Audit Logs Warning Banner */}
      <footer className="rounded-lg border border-teal-100 bg-teal-50/30 p-4">
        <div className="flex gap-2">
          <span className="text-teal-700 text-sm">ℹ</span>
          <p className="text-xs leading-relaxed text-teal-800">{data.auditNote}</p>
        </div>
      </footer>
    </div>
  );
}

function CrimeCategoryBreakdownDashboard() {
  const { activeRole } = useAppSession();

  const [filters, setFilters] = useState<CategoryBreakdownFilters>(DEFAULT_CATEGORY_BREAKDOWN_FILTERS);
  const [draftFilters, setDraftFilters] = useState<CategoryBreakdownFilters>(DEFAULT_CATEGORY_BREAKDOWN_FILTERS);
  const [data, setData] = useState<CategoryBreakdownData | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setState("loading");
        const result = await fetchCrimeCategoryBreakdown(filters, activeRole);
        if (!active) return;
        setData(result);
        if (result.totalCount === 0) {
          setState("empty");
        } else {
          setState("ready");
        }
      } catch (error) {
        if (!active) return;
        console.error(error);
        setState("error");
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [filters, activeRole]);

  return (
    <div className="space-y-6">
      <Filters
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={() => setFilters(draftFilters)}
        onReset={() => {
          setDraftFilters(DEFAULT_CATEGORY_BREAKDOWN_FILTERS);
          setFilters(DEFAULT_CATEGORY_BREAKDOWN_FILTERS);
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
          <h2 className="text-base font-semibold text-slate-950">Unable to load category breakdown</h2>
          <p className="mt-2 text-sm text-slate-600">
            The category breakdown service failed to load. Please retry.
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
          <h2 className="text-base font-semibold text-slate-950">No crimes recorded</h2>
          <p className="mt-2 text-sm text-slate-600">
            There are no incident records matching the selected district and time range.
          </p>
        </section>
      )}

      {state === "ready" && data && <CrimeCategoryBreakdownContent data={data} />}
    </div>
  );
}

export function CrimeCategoryBreakdown() {
  return (
    <AppShell
      title="Crime Category Breakdown"
      description="Analyze distributions, percentage shares, monthly velocities, and individual records of key crime categories."
      requiredPermission="page:crime-category-breakdown"
    >
      <CrimeCategoryBreakdownDashboard />
    </AppShell>
  );
}
