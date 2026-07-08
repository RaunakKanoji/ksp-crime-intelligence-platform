"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { CATEGORIES, DISTRICTS } from "@/lib/dashboard/types";
import { STATIONS } from "@/lib/dashboard/summary";
import { hasPermission } from "@/lib/permissions";
import { searchFirs, FirSearchValidationError } from "@/lib/fir/search";
import {
  ACTS,
  CASE_STATUSES,
  EMPTY_FIR_FILTERS,
  SECTIONS,
  type FirSearchFilters,
  type FirSearchResponse,
  type FirValidationError,
} from "@/lib/fir/types";

const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";

function Field({
  id,
  label,
  helper,
  children,
}: {
  id: string;
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
      {helper && <p className="text-xs text-slate-400">{helper}</p>}
    </div>
  );
}

function RedactedText({ children }: { children: React.ReactNode }) {
  if (children) return <>{children}</>;
  return <span className="italic text-slate-400">Restricted</span>;
}

function FirSearchSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="h-52 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

function FirSearchError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className={`${card} p-10 text-center`}>
      <h2 className="text-lg font-semibold tracking-tight">Unable to load FIR records</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Something went wrong while preparing the FIR search results. Please try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Retry
      </button>
    </section>
  );
}

function ValidationAlert({ errors }: { errors: FirValidationError[] }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <h2 className="text-sm font-semibold text-red-800">Review search filters</h2>
      <ul className="mt-2 space-y-1 text-sm text-red-700">
        {errors.map((error) => (
          <li key={`${error.field}-${error.message}`}>{error.message}</li>
        ))}
      </ul>
    </section>
  );
}

function FirFilters({
  filters,
  onChange,
  onSubmit,
  onReset,
  canViewPii,
  loading,
}: {
  filters: FirSearchFilters;
  onChange: (filters: FirSearchFilters) => void;
  onSubmit: () => void;
  onReset: () => void;
  canViewPii: boolean;
  loading: boolean;
}) {
  const inputClass =
    "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
  const selectClass = `${inputClass} appearance-none pr-9`;
  const districtStations =
    filters.district !== "all" ? STATIONS[filters.district as keyof typeof STATIONS] ?? [] : [];
  const allStations = DISTRICTS.flatMap((district) => STATIONS[district]);
  const stationOptions = filters.district !== "all" ? districtStations : allStations;

  const update = (patch: Partial<FirSearchFilters>) => onChange({ ...filters, ...patch });

  return (
    <section className={card}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field id="fir-number" label="FIR number">
            <input
              id="fir-number"
              value={filters.firNumber}
              onChange={(event) => update({ firNumber: event.target.value })}
              className={inputClass}
              placeholder="BLR-CEN-2026"
            />
          </Field>

          <Field id="district" label="District">
            <select
              id="district"
              value={filters.district}
              onChange={(event) => update({ district: event.target.value, policeStation: "all" })}
              className={selectClass}
            >
              <option value="all">All districts</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
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
              {stationOptions.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
          </Field>

          <Field id="case-status" label="Case status">
            <select
              id="case-status"
              value={filters.caseStatus}
              onChange={(event) => update({ caseStatus: event.target.value })}
              className={selectClass}
            >
              <option value="all">All statuses</option>
              {CASE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>

          <Field id="date-from" label="From date">
            <input
              id="date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(event) => update({ dateFrom: event.target.value })}
              className={inputClass}
            />
          </Field>

          <Field id="date-to" label="To date">
            <input
              id="date-to"
              type="date"
              value={filters.dateTo}
              onChange={(event) => update({ dateTo: event.target.value })}
              className={inputClass}
            />
          </Field>

          <Field id="crime-category" label="Crime category">
            <select
              id="crime-category"
              value={filters.crimeCategory}
              onChange={(event) => update({ crimeCategory: event.target.value })}
              className={selectClass}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>

          <Field id="act" label="Act">
            <select
              id="act"
              value={filters.act}
              onChange={(event) => update({ act: event.target.value })}
              className={selectClass}
            >
              <option value="all">All acts</option>
              {ACTS.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </Field>

          <Field id="section" label="Section">
            <select
              id="section"
              value={filters.section}
              onChange={(event) => update({ section: event.target.value })}
              className={selectClass}
            >
              <option value="all">All sections</option>
              {SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="accused-name"
            label="Accused name"
            helper={!canViewPii ? "Requires PII permission" : undefined}
          >
            <input
              id="accused-name"
              value={filters.accusedName}
              onChange={(event) => update({ accusedName: event.target.value })}
              className={inputClass}
              disabled={!canViewPii}
              placeholder={canViewPii ? "Name or partial name" : "Restricted"}
            />
          </Field>

          <Field
            id="victim-name"
            label="Victim name"
            helper={!canViewPii ? "Requires PII permission" : undefined}
          >
            <input
              id="victim-name"
              value={filters.victimName}
              onChange={(event) => update({ victimName: event.target.value })}
              className={inputClass}
              disabled={!canViewPii}
              placeholder={canViewPii ? "Name or partial name" : "Restricted"}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reset filters
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Searching..." : "Search FIRs"}
          </button>
        </div>
      </form>
    </section>
  );
}

function FirResults({
  data,
  onPage,
  canOpenDetail,
}: {
  data: FirSearchResponse;
  onPage: (page: number) => void;
  canOpenDetail: boolean;
}) {
  return (
    <section className={`${card} overflow-hidden p-0`}>
      <div className="flex flex-col gap-3 px-6 pt-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">FIR Records</h2>
          <p className="text-sm text-slate-600">
            {data.total.toLocaleString("en-IN")} matching sample records · Page {data.page} of {data.totalPages}
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
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-6 py-2.5 font-medium">FIR number</th>
              <th scope="col" className="px-6 py-2.5 font-medium">District / station</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Incident date</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Category</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Act / section</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Accused</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Victim</th>
              <th scope="col" className="px-6 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 align-top last:border-0">
                <td className="px-6 py-3">
                  {canOpenDetail ? (
                    <Link
                      href={`/fir-search/${row.id}`}
                      className="font-semibold text-teal-800 underline-offset-2 hover:underline"
                    >
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
                  <p className="text-xs text-slate-500">
                    Reported {new Date(row.reportedDate).toLocaleDateString("en-IN")}
                  </p>
                </td>
                <td className="px-6 py-3 text-slate-700">{row.crimeCategory}</td>
                <td className="px-6 py-3 text-slate-700">
                  <p>{row.act}</p>
                  <p className="text-xs text-slate-500">Section {row.section}</p>
                </td>
                <td className="px-6 py-3 text-slate-700">
                  <RedactedText>{row.accusedName}</RedactedText>
                </td>
                <td className="px-6 py-3 text-slate-700">
                  <RedactedText>{row.victimName}</RedactedText>
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

      <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">{data.auditNote}</p>
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

function EmptyResults({ onReset }: { onReset: () => void }) {
  return (
    <section className={`${card} p-10 text-center`}>
      <h2 className="text-lg font-semibold tracking-tight">No matching FIR records</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        No sample FIR records match the active filters. Try a broader date range, district, station, category, act,
        section, or case status.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
      >
        Reset filters
      </button>
    </section>
  );
}

function FirSearchContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<FirSearchFilters>(EMPTY_FIR_FILTERS);
  const [page, setPage] = useState(1);
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<FirSearchResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<FirValidationError[]>([]);
  const requestId = useRef(0);

  const canViewPii = hasPermission(activeRole, "data:view-pii");
  const canOpenDetail = hasPermission(activeRole, "page:fir-detail");

  const safeFilters = useMemo(() => {
    if (canViewPii) return filters;
    return { ...filters, accusedName: "", victimName: "" };
  }, [canViewPii, filters]);

  const load = useCallback(
    async (activeFilters: FirSearchFilters, activePage: number) => {
      const current = ++requestId.current;
      setState("loading");
      setValidationErrors([]);
      try {
        const result = await searchFirs({ filters: activeFilters, page: activePage, pageSize: 8 }, activeRole);
        if (current !== requestId.current) return;
        setData(result);
        setState(result.total === 0 ? "empty" : "ready");
      } catch (err) {
        if (current !== requestId.current) return;
        if (err instanceof FirSearchValidationError) {
          setValidationErrors(err.errors);
          setState("validation-error");
          return;
        }
        console.error("FIR search failed:", err);
        setState("error");
      }
    },
    [activeRole]
  );

  useEffect(() => {
    void load(safeFilters, page);
  }, [load, safeFilters, page]);

  const submit = () => {
    setPage(1);
    void load(safeFilters, 1);
  };

  const reset = () => {
    setFilters(EMPTY_FIR_FILTERS);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Sample data
        </span>
        <span className="text-xs text-slate-500">
          FIR search is using permission-filtered demonstration records until Catalyst Data Store is connected.
        </span>
      </div>

      <FirFilters
        filters={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onSubmit={submit}
        onReset={reset}
        canViewPii={canViewPii}
        loading={state === "loading"}
      />

      {state === "validation-error" && <ValidationAlert errors={validationErrors} />}

      {state === "loading" ? (
        <FirSearchSkeleton />
      ) : state === "error" ? (
        <FirSearchError onRetry={() => void load(safeFilters, page)} />
      ) : state === "validation-error" ? (
        data ? <FirResults data={data} onPage={setPage} canOpenDetail={canOpenDetail} /> : null
      ) : state === "empty" || !data ? (
        <EmptyResults onReset={reset} />
      ) : (
        <FirResults data={data} onPage={setPage} canOpenDetail={canOpenDetail} />
      )}
    </div>
  );
}

export default function FirSearch() {
  return (
    <AppShell
      title="FIR Search"
      description="Search and filter FIR records across districts, police stations, dates, categories, acts, sections, people fields, and case status."
      requiredPermission="page:fir-search"
    >
      <FirSearchContent />
    </AppShell>
  );
}
