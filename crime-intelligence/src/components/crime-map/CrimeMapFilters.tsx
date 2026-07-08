"use client";

import { CATEGORIES, DISTRICTS } from "@/lib/dashboard/types";
import { STATIONS } from "@/lib/dashboard/summary";
import type { CrimeMapFilters } from "@/lib/crime-map/map-types";

const inputClass =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600";
const selectClass = `${inputClass} appearance-none`;

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
      {label}
      {children}
    </label>
  );
}

export function CrimeMapFilters({
  filters,
  onChange,
  onApply,
  onReset,
}: {
  filters: Required<CrimeMapFilters>;
  onChange: (filters: Required<CrimeMapFilters>) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const stations =
    filters.district === "all"
      ? DISTRICTS.flatMap((district) => STATIONS[district])
      : STATIONS[filters.district as keyof typeof STATIONS] ?? [];

  const update = (patch: Partial<Required<CrimeMapFilters>>) => onChange({ ...filters, ...patch });

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:h-[calc(100vh-14.5rem)] lg:overflow-y-auto">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
        <p className="mt-1 text-xs text-slate-500">Apply changes to refresh the map data.</p>
      </div>
      <div className="mt-4 space-y-4">
        <Field id="district" label="District">
          <select
            id="district"
            value={filters.district}
            onChange={(event) => update({ district: event.target.value, policeStation: "all" })}
            className={selectClass}
          >
            <option value="all">All districts</option>
            {DISTRICTS.map((district) => <option key={district}>{district}</option>)}
          </select>
        </Field>

        <Field id="police-station" label="Police station">
          <select
            id="police-station"
            value={filters.policeStation}
            onChange={(event) => update({ policeStation: event.target.value })}
            className={selectClass}
          >
            <option value="all">All stations</option>
            {stations.map((station) => <option key={station}>{station}</option>)}
          </select>
        </Field>

        <Field id="crime-type" label="Crime type">
          <select
            id="crime-type"
            value={filters.crimeType}
            onChange={(event) => update({ crimeType: event.target.value })}
            className={selectClass}
          >
            <option value="all">All crime types</option>
            {["Vehicle Theft", "Burglary", "Chain Snatching", "Cyber Fraud", "Assault", "Robbery", "Missing Person", "Narcotics", ...CATEGORIES].filter((value, index, arr) => arr.indexOf(value) === index).map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="date-from" label="From">
            <input id="date-from" type="date" value={filters.dateFrom} onChange={(event) => update({ dateFrom: event.target.value })} className={inputClass} />
          </Field>
          <Field id="date-to" label="To">
            <input id="date-to" type="date" value={filters.dateTo} onChange={(event) => update({ dateTo: event.target.value })} className={inputClass} />
          </Field>
        </div>

        <Field id="severity" label="Severity">
          <select id="severity" value={filters.severity} onChange={(event) => update({ severity: event.target.value as Required<CrimeMapFilters>["severity"] })} className={selectClass}>
            <option value="all">All severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </Field>

        <Field id="case-status" label="Case status">
          <select id="case-status" value={filters.caseStatus} onChange={(event) => update({ caseStatus: event.target.value })} className={selectClass}>
            <option value="all">All statuses</option>
            <option>Open</option>
            <option>Under Investigation</option>
            <option>Charge Sheet Filed</option>
            <option>Closed</option>
          </select>
        </Field>

        <Field id="time-of-day" label="Time of day">
          <select id="time-of-day" value={filters.timeOfDay} onChange={(event) => update({ timeOfDay: event.target.value as Required<CrimeMapFilters>["timeOfDay"] })} className={selectClass}>
            <option value="all">All times</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
          </select>
        </Field>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onApply} className="h-10 flex-1 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800">
            Apply filters
          </button>
          <button type="button" onClick={onReset} className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Reset
          </button>
        </div>
      </div>
    </aside>
  );
}
