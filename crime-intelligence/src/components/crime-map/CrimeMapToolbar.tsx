"use client";

import type { CrimeMapFilters, CrimeMapLayerState } from "@/lib/crime-map/map-types";
import { MapLayerToggle } from "./MapLayerToggle";

const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 disabled:cursor-not-allowed disabled:bg-slate-50";

const quickRanges = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

function isoDate(daysAgo: number) {
  const date = new Date("2026-07-08T00:00:00+05:30");
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function CrimeMapToolbar({
  search,
  onSearchChange,
  onSearch,
  filters,
  onFiltersChange,
  layers,
  onLayersChange,
  source,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  filters: CrimeMapFilters;
  onFiltersChange: (filters: CrimeMapFilters) => void;
  layers: CrimeMapLayerState;
  onLayersChange: (layers: CrimeMapLayerState) => void;
  source: "real" | "mock";
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-semibold text-slate-950">Hotspot Detection</h1>
            {source === "mock" && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                Demo data
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Hotspot scoring uses explainable area-level signals and requires human review.
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-[minmax(14rem,1fr)_auto_auto]">
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearch();
            }}
            className={inputClass}
            placeholder="Search FIR, area, station, crime type"
            aria-label="Search map cases"
          />
          <button
            type="button"
            onClick={onSearch}
            className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Search
          </button>
          <button
            type="button"
            disabled
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-400"
          >
            Export
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {quickRanges.map((range) => (
            <button
              key={range.label}
              type="button"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  dateFrom: isoDate(range.days),
                  dateTo: "2026-07-08",
                })
              }
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {range.label}
            </button>
          ))}
        </div>
        <MapLayerToggle layers={layers} onChange={onLayersChange} />
      </div>
    </section>
  );
}
