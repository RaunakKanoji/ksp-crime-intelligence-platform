"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { CATEGORIES, DISTRICTS } from "@/lib/dashboard/types";
import { STATIONS } from "@/lib/dashboard/summary";
import { hasPermission } from "@/lib/permissions";
import {
  FIR_DATE_PRESETS,
  FirAdvancedFilterValidationError,
  filterFirsAdvanced,
  normalizeAdvancedFilters,
} from "@/lib/fir/advanced-filters";
import {
  ACTS,
  CASE_STATUSES,
  EMPTY_FIR_ADVANCED_FILTERS,
  SECTIONS,
  type FirAdvancedFilterResponse,
  type FirAdvancedFilters,
  type FirSavedFilter,
  type FirValidationError,
} from "@/lib/fir/types";

const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
const SAVED_FILTERS_KEY = "ksp_fir_advanced_saved_filters";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";

function parseList(value: string | null): string[] {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function filtersFromSearch(searchParams: URLSearchParams): FirAdvancedFilters {
  const preset = searchParams.get("preset") ?? undefined;
  return normalizeAdvancedFilters({
    datePreset: preset as FirAdvancedFilters["datePreset"] | undefined,
    dateFrom: searchParams.get("from") ?? "",
    dateTo: searchParams.get("to") ?? "",
    districts: parseList(searchParams.get("districts")),
    policeStations: parseList(searchParams.get("stations")),
    crimeCategories: parseList(searchParams.get("categories")),
    acts: parseList(searchParams.get("acts")),
    sections: parseList(searchParams.get("sections")),
    caseStatuses: parseList(searchParams.get("statuses")),
    keyword: searchParams.get("q") ?? "",
  });
}

function filtersToSearch(filters: FirAdvancedFilters): string {
  const params = new URLSearchParams();
  if (filters.datePreset !== "all") params.set("preset", filters.datePreset);
  if (filters.datePreset === "custom" && filters.dateFrom) params.set("from", filters.dateFrom);
  if (filters.datePreset === "custom" && filters.dateTo) params.set("to", filters.dateTo);
  if (filters.districts.length) params.set("districts", filters.districts.join(","));
  if (filters.policeStations.length) params.set("stations", filters.policeStations.join(","));
  if (filters.crimeCategories.length) params.set("categories", filters.crimeCategories.join(","));
  if (filters.acts.length) params.set("acts", filters.acts.join(","));
  if (filters.sections.length) params.set("sections", filters.sections.join(","));
  if (filters.caseStatuses.length) params.set("statuses", filters.caseStatuses.join(","));
  if (filters.keyword) params.set("q", filters.keyword);
  return params.toString();
}

function readSavedFilters(): FirSavedFilter[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(SAVED_FILTERS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as FirSavedFilter[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item.id && item.name && item.createdAt && item.filters)
      .map((item) => ({ ...item, filters: normalizeAdvancedFilters(item.filters) }))
      .slice(0, 8);
  } catch {
    return [];
  }
}

function writeSavedFilters(filters: FirSavedFilter[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters.slice(0, 8)));
}

function ValidationAlert({ errors }: { errors: FirValidationError[] }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <h2 className="text-sm font-semibold text-red-800">Review advanced filters</h2>
      <ul className="mt-2 space-y-1 text-sm text-red-700">
        {errors.map((error) => (
          <li key={`${error.field}-${error.message}`}>{error.message}</li>
        ))}
      </ul>
    </section>
  );
}

function RedactedText({ children }: { children: React.ReactNode }) {
  if (children) return <>{children}</>;
  return <span className="italic text-slate-400">Restricted</span>;
}

function MultiSelectGroup({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (option: string) => {
    onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option]);
  };
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</legend>
      <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
        {options.map((option) => {
          const checked = values.includes(option);
          return (
            <label
              key={option}
              className={`inline-flex h-8 cursor-pointer items-center rounded-lg border px-2.5 text-xs font-semibold transition ${
                checked
                  ? "border-teal-700 bg-teal-50 text-teal-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(option)}
                className="sr-only"
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function FirAdvancedFiltersSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

function StateCard({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`${card} p-10 text-center`}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}

function FilterPanel({
  filters,
  savedFilters,
  onChange,
  onApply,
  onReset,
  onSave,
  onLoadSaved,
  onDeleteSaved,
  loading,
}: {
  filters: FirAdvancedFilters;
  savedFilters: FirSavedFilter[];
  onChange: (filters: FirAdvancedFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onSave: () => void;
  onLoadSaved: (filter: FirSavedFilter) => void;
  onDeleteSaved: (id: string) => void;
  loading: boolean;
}) {
  const inputClass =
    "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
  const stationOptions = useMemo(() => {
    const districts = filters.districts.length > 0 ? filters.districts : [...DISTRICTS];
    return districts.flatMap((district) => STATIONS[district as keyof typeof STATIONS] ?? []);
  }, [filters.districts]);
  const update = (patch: Partial<FirAdvancedFilters>) => onChange(normalizeAdvancedFilters({ ...filters, ...patch }));

  return (
    <section className={card}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="date-preset" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Date preset
            </label>
            <select
              id="date-preset"
              value={filters.datePreset}
              onChange={(event) => update({ datePreset: event.target.value as FirAdvancedFilters["datePreset"] })}
              className={inputClass}
            >
              {FIR_DATE_PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date-from" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              From date
            </label>
            <input
              id="date-from"
              type="date"
              value={filters.dateFrom}
              disabled={filters.datePreset !== "custom"}
              onChange={(event) => update({ dateFrom: event.target.value, datePreset: "custom" })}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date-to" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              To date
            </label>
            <input
              id="date-to"
              type="date"
              value={filters.dateTo}
              disabled={filters.datePreset !== "custom"}
              onChange={(event) => update({ dateTo: event.target.value, datePreset: "custom" })}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="keyword" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Keyword
            </label>
            <input
              id="keyword"
              value={filters.keyword}
              onChange={(event) => update({ keyword: event.target.value })}
              className={inputClass}
              placeholder="FIR, category, station"
            />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <MultiSelectGroup
            label="Districts"
            values={filters.districts}
            options={[...DISTRICTS]}
            onChange={(districts) => update({ districts, policeStations: [] })}
          />
          <MultiSelectGroup
            label="Police stations"
            values={filters.policeStations}
            options={stationOptions}
            onChange={(policeStations) => update({ policeStations })}
          />
          <MultiSelectGroup
            label="Crime categories"
            values={filters.crimeCategories}
            options={[...CATEGORIES]}
            onChange={(crimeCategories) => update({ crimeCategories })}
          />
          <MultiSelectGroup
            label="Case statuses"
            values={filters.caseStatuses}
            options={CASE_STATUSES}
            onChange={(caseStatuses) => update({ caseStatuses })}
          />
          <MultiSelectGroup
            label="Acts"
            values={filters.acts}
            options={[...ACTS]}
            onChange={(acts) => update({ acts })}
          />
          <MultiSelectGroup
            label="Legal sections"
            values={filters.sections}
            options={[...SECTIONS]}
            onChange={(sections) => update({ sections })}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Saved filters</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {savedFilters.length === 0 ? (
                <span className="text-xs text-slate-500">No local saved filters yet.</span>
              ) : (
                savedFilters.map((saved) => (
                  <span key={saved.id} className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => onLoadSaved(saved)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {saved.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSaved(saved.id)}
                      className="border-l border-slate-200 px-2 text-xs font-semibold text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${saved.name}`}
                    >
                      x
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset filters
            </button>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Save filter
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Applying..." : "Apply filters"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function ResultsTable({
  data,
  onPage,
  canOpenDetail,
}: {
  data: FirAdvancedFilterResponse;
  onPage: (page: number) => void;
  canOpenDetail: boolean;
}) {
  return (
    <section className={`${card} overflow-hidden p-0`}>
      <div className="flex flex-col gap-3 px-6 pt-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Advanced Filter Results</h2>
          <p className="text-sm text-slate-600">
            {data.total.toLocaleString("en-IN")} matching sample records - {data.activeFilterCount} active filters
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
            Sample data
          </span>
          {!data.redaction.pii && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
              PII redacted
            </span>
          )}
          {!data.redaction.investigationNotes && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Notes redacted
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1040px] text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-6 py-2.5 font-medium">FIR number</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Location</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Incident date</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Category</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Legal section</th>
              <th scope="col" className="px-6 py-2.5 font-medium">People</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 align-top last:border-0">
                <td className="px-6 py-3">
                  {canOpenDetail ? (
                    <Link href={`/fir-search/${row.id}`} className="font-semibold text-teal-800 underline-offset-2 hover:underline">
                      {row.firNumber}
                    </Link>
                  ) : (
                    <p className="font-semibold text-slate-900">{row.firNumber}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">{row.incidentSummary}</p>
                </td>
                <td className="px-6 py-3 text-slate-700">
                  <p className="font-medium">{row.district}</p>
                  <p className="text-xs text-slate-500">{row.policeStation}</p>
                </td>
                <td className="px-6 py-3 text-slate-700">
                  <p>{new Date(row.incidentDate).toLocaleDateString("en-IN")}</p>
                  <p className="text-xs text-slate-500">Reported {new Date(row.reportedDate).toLocaleDateString("en-IN")}</p>
                </td>
                <td className="px-6 py-3 text-slate-700">{row.crimeCategory}</td>
                <td className="px-6 py-3 text-slate-700">
                  <p>{row.act}</p>
                  <p className="text-xs text-slate-500">Section {row.section}</p>
                </td>
                <td className="px-6 py-3 text-slate-700">
                  <p>Accused: <RedactedText>{row.accusedName}</RedactedText></p>
                  <p className="mt-1 text-xs text-slate-500">Victim: <RedactedText>{row.victimName}</RedactedText></p>
                </td>
                <td className="px-6 py-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {row.caseStatus}
                  </span>
                  {row.sensitiveNote ? (
                    <p className="mt-2 text-xs text-slate-500">{row.sensitiveNote}</p>
                  ) : (
                    <p className="mt-2 text-xs italic text-slate-400">Investigation note restricted</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1 text-xs text-slate-500">
          <p>{data.savedFilterNote}</p>
          <p>{data.auditNote}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={data.page <= 1}
            onClick={() => onPage(data.page - 1)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={data.page >= data.totalPages}
            onClick={() => onPage(data.page + 1)}
            className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function FirAdvancedFiltersContent() {
  const { activeRole } = useAppSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialFilters = useMemo(() => filtersFromSearch(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [filters, setFilters] = useState<FirAdvancedFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<FirAdvancedFilterResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<FirValidationError[]>([]);
  const [savedFilters, setSavedFilters] = useState<FirSavedFilter[]>([]);
  const requestId = useRef(0);

  const canOpenDetail = hasPermission(activeRole, "page:fir-detail");

  useEffect(() => {
    setSavedFilters(readSavedFilters());
  }, []);

  const syncUrl = useCallback(
    (nextFilters: FirAdvancedFilters) => {
      const query = filtersToSearch(nextFilters);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  const load = useCallback(
    async (activeFilters: FirAdvancedFilters, activePage: number) => {
      const current = ++requestId.current;
      setState("loading");
      setValidationErrors([]);
      try {
        const result = await filterFirsAdvanced(
          { filters: activeFilters, page: activePage, pageSize: 8 },
          activeRole
        );
        if (current !== requestId.current) return;
        setData(result);
        setState(result.total === 0 ? "empty" : "ready");
      } catch (err) {
        if (current !== requestId.current) return;
        if (err instanceof FirAdvancedFilterValidationError) {
          setValidationErrors(err.errors);
          setState("validation-error");
          return;
        }
        console.error("FIR advanced filters failed:", err);
        setState("error");
      }
    },
    [activeRole]
  );

  useEffect(() => {
    void load(filters, page);
  }, [filters, load, page]);

  const apply = () => {
    setPage(1);
    syncUrl(filters);
    void load(filters, 1);
  };

  const reset = () => {
    setFilters(EMPTY_FIR_ADVANCED_FILTERS);
    setPage(1);
    syncUrl(EMPTY_FIR_ADVANCED_FILTERS);
  };

  const save = () => {
    const activeCount = data?.activeFilterCount ?? 0;
    const name = activeCount > 0 ? `${activeCount} filters - ${new Date().toLocaleDateString("en-IN")}` : "All FIR records";
    const next: FirSavedFilter = {
      id: `SAVED-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      filters,
    };
    const updated = [next, ...savedFilters.filter((item) => filtersToSearch(item.filters) !== filtersToSearch(filters))].slice(0, 8);
    setSavedFilters(updated);
    writeSavedFilters(updated);
  };

  const loadSaved = (saved: FirSavedFilter) => {
    setFilters(saved.filters);
    setPage(1);
    syncUrl(saved.filters);
  };

  const deleteSaved = (id: string) => {
    const updated = savedFilters.filter((item) => item.id !== id);
    setSavedFilters(updated);
    writeSavedFilters(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Sample data
        </span>
        <span className="text-xs text-slate-500">
          Advanced filters use permission-filtered demonstration FIRs until Catalyst Data Store and saved queries are connected.
        </span>
      </div>

      <FilterPanel
        filters={filters}
        savedFilters={savedFilters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onApply={apply}
        onReset={reset}
        onSave={save}
        onLoadSaved={loadSaved}
        onDeleteSaved={deleteSaved}
        loading={state === "loading"}
      />

      {state === "validation-error" && <ValidationAlert errors={validationErrors} />}

      {state === "loading" ? (
        <FirAdvancedFiltersSkeleton />
      ) : state === "error" ? (
        <StateCard
          title="Unable to apply advanced filters"
          message="Something went wrong while preparing FIR results. Please try again."
          action={
            <button
              type="button"
              onClick={() => void load(filters, page)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Retry
            </button>
          }
        />
      ) : state === "empty" || !data ? (
        <StateCard
          title="No matching FIR records"
          message="No sample FIR records match the selected advanced filters. Remove one or more filters or reset to all records."
          action={
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <ResultsTable data={data} onPage={setPage} canOpenDetail={canOpenDetail} />
      )}
    </div>
  );
}

export default function FirAdvancedFilters() {
  return (
    <AppShell
      title="FIR Advanced Filters"
      description="Apply multi-select FIR filters across date presets, locations, legal sections, categories, and case statuses."
      requiredPermission="page:fir-advanced-filters"
    >
      <FirAdvancedFiltersContent />
    </AppShell>
  );
}
