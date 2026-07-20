"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { fetchCaseStatusTracking, CaseStatusApiError } from "@/lib/case-status-tracking/api";
import type { CaseLifecycleStatus, CaseStatusFilters, CaseStatusRow, CaseStatusTrackingResponse } from "@/lib/case-status-tracking/types";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const DEFAULT_FILTERS: CaseStatusFilters = { page: 1, pageSize: 5, sortBy: "updatedAt", sortDirection: "desc" };

function statusTone(status: CaseLifecycleStatus) {
  if (status === "Solved" || status === "Disposed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "Closed") return "border-slate-200 bg-slate-100 text-slate-700";
  if (status === "Registered" || status === "Pending Trial") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

function Timeline({ row, restricted }: { row: CaseStatusRow; restricted: boolean }) {
  return <aside className={`${card} h-fit`}>
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Case timeline</p>
    <h2 className="mt-1 text-lg font-bold">{row.firNumber}</h2>
    <p className="mt-1 text-sm text-slate-500">{row.category} · {row.station}, {row.district}</p>
    <div className="mt-5 space-y-0">
      {row.timeline.map((event, index) => <div key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
        {index < row.timeline.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />}
        <span className="relative mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-teal-700 ring-1 ring-teal-700" />
        <div><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone(event.status)}`}>{event.status}</span><p className="mt-2 text-sm font-medium">{event.summary}</p><p className="mt-1 text-xs text-slate-500">{new Date(event.occurredAt).toLocaleString("en-IN")}</p>{event.recordedBy ? <p className="mt-1 text-xs text-slate-600">Recorded by: {event.recordedBy}</p> : <p className="mt-1 text-xs italic text-slate-400">Recorder restricted</p>}{event.internalNote ? <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{event.internalNote}</p> : restricted && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs italic text-slate-400">Internal update details restricted</p>}</div>
      </div>)}
    </div>
    <dl className="mt-5 border-t border-slate-100 pt-4 text-sm"><dt className="text-slate-500">Assigned officer</dt><dd className="mt-1 font-semibold">{row.assignedOfficer ?? <span className="italic text-slate-400">Restricted</span>}</dd></dl>
  </aside>;
}

function TrackingContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<CaseStatusFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<CaseStatusFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<CaseStatusTrackingResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading"); setMessage("");
    try {
      const response = await fetchCaseStatusTracking(applied, activeRole);
      setData(response); setSelectedId((current) => response.rows.some((row) => row.id === current) ? current : response.rows[0]?.id ?? null);
      setState(response.rows.length ? "ready" : "empty");
    } catch (error) {
      if (error instanceof CaseStatusApiError && error.status === 400) { setMessage(error.message); setState("validation-error"); }
      else { setMessage("The case status service could not be reached safely."); setState("error"); }
    }
  }, [activeRole, applied]);
  useEffect(() => { void load(); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); setApplied({ ...filters, page: 1 }); };
  const select = (key: "district" | "station" | "category" | "status", value: string) => setFilters({ ...filters, [key]: value || undefined });
  const selected = data?.rows.find((row) => row.id === selectedId);

  return <div className="space-y-6">
    <form onSubmit={submit} className={card}>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
        <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-slate-600">Search FIR, category, district, or station</span><input className={input} maxLength={80} value={filters.search ?? ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Status</span><select className={input} value={filters.status ?? ""} onChange={(e) => select("status", e.target.value)}><option value="">All statuses</option>{data?.availableFilters.statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">District</span><select className={input} value={filters.district ?? ""} onChange={(e) => select("district", e.target.value)}><option value="">All districts</option>{data?.availableFilters.districts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Station</span><select className={input} value={filters.station ?? ""} onChange={(e) => select("station", e.target.value)}><option value="">All stations</option>{data?.availableFilters.stations.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Category</span><select className={input} value={filters.category ?? ""} onChange={(e) => select("category", e.target.value)}><option value="">All categories</option>{data?.availableFilters.categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Sort</span><select className={input} value={`${filters.sortBy}:${filters.sortDirection}`} onChange={(e) => { const [sortBy, sortDirection] = e.target.value.split(":"); setFilters({ ...filters, sortBy: sortBy as CaseStatusFilters["sortBy"], sortDirection: sortDirection as CaseStatusFilters["sortDirection"] }); }}><option value="updatedAt:desc">Recently updated</option><option value="registeredAt:desc">Newest registered</option><option value="registeredAt:asc">Oldest registered</option><option value="firNumber:asc">FIR number</option><option value="status:asc">Status</option></select></label>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex gap-3"><label><span className="mb-1 block text-xs font-semibold text-slate-600">From</span><input type="date" className={input} value={filters.from ?? ""} onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })} /></label><label><span className="mb-1 block text-xs font-semibold text-slate-600">To</span><input type="date" className={input} value={filters.to ?? ""} onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })} /></label></div>
        <div className="flex gap-2"><button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Reset</button><button type="submit" className="h-10 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white">Apply filters</button></div>
      </div>
    </form>
    {data && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><strong>Sample case-lifecycle data.</strong> Statuses must be verified against the authoritative case record.{data.restrictedDetailsRedacted && " Officer and internal timeline details are restricted for this role."}</div>}
    {state === "loading" && <div className="h-80 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading case status tracking" />}
    {(state === "error" || state === "validation-error") && <section className={`${card} text-center`}><h2 className="font-semibold">{state === "validation-error" ? "Check the tracking filters" : "Unable to load case statuses"}</h2><p className="mt-2 text-sm text-slate-600">{message}</p>{state === "error" && <button onClick={() => void load()} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Retry</button>}</section>}
    {state === "empty" && <section className={`${card} text-center`}><h2 className="font-semibold">No cases match</h2><p className="mt-2 text-sm text-slate-600">No authorized sample cases match the active search, lifecycle, location, category, and date filters.</p></section>}
    {state === "ready" && data && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><section className={`${card} overflow-hidden p-0`}><div className="flex justify-between px-5 py-4"><h2 className="font-bold">Tracked cases</h2><span className="text-sm text-slate-500">{data.total} total</span></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead className="border-y bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">FIR</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Registered</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{data.rows.map((row) => <tr key={row.id} onClick={() => setSelectedId(row.id)} className={`cursor-pointer border-b last:border-0 ${selectedId === row.id ? "bg-teal-50" : "hover:bg-slate-50"}`}><td className="px-5 py-4"><Link href={`/fir-search/${row.id}`} onClick={(event) => event.stopPropagation()} className="font-semibold text-teal-700 hover:underline">{row.firNumber}</Link></td><td className="px-5 py-4">{row.station}, {row.district}</td><td className="px-5 py-4">{row.category}</td><td className="px-5 py-4">{new Date(row.registeredAt).toLocaleDateString("en-IN")}</td><td className="px-5 py-4">{new Date(row.updatedAt).toLocaleDateString("en-IN")}</td><td className="px-5 py-4"><span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusTone(row.currentStatus)}`}>{row.currentStatus}</span></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t px-5 py-4 text-sm"><span>Page {data.page} of {data.totalPages}</span><div className="flex gap-2"><button disabled={data.page <= 1} onClick={() => setApplied({ ...applied, page: data.page - 1 })} className="rounded border px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button><button disabled={data.page >= data.totalPages} onClick={() => setApplied({ ...applied, page: data.page + 1 })} className="rounded border px-3 py-1.5 font-semibold disabled:opacity-40">Next</button></div></div></section>{selected && <Timeline row={selected} restricted={data.restrictedDetailsRedacted} />}</div>}
    {data && <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">{data.auditNote}</p>}
  </div>;
}

export default function CaseStatusTracking() {
  return <AppShell title="Case Status Tracking" description="Track permission-filtered investigation and case lifecycle status through registered, investigation, filing, trial, solved, closed, and disposed stages." requiredPermission="page:case-status-tracking"><TrackingContent /></AppShell>;
}
