"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { fetchRepeatOffenders, RepeatOffenderApiError } from "@/lib/repeat-offender-detection/api";
import type { RepeatOffenderDetectionResponse, RepeatOffenderFilters, RepeatOffenderResult } from "@/lib/repeat-offender-detection/types";

type State = "loading" | "ready" | "empty" | "error" | "validation-error";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

function ResultCard({ result }: { result: RepeatOffenderResult }) {
  const confidenceColor = result.confidence === "High" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : result.confidence === "Medium" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-red-50 text-red-800 border-red-200";
  return (
    <article className={card}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{result.matchId}</p>
          <h2 className="mt-1 text-lg font-bold">{result.displayName ?? "Identity restricted"}</h2>
          <p className="mt-1 text-sm text-slate-500">{result.personId} · {result.identityStatus}</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold">{result.firCount} FIRs</span>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${confidenceColor}`}>{result.confidenceScore}% {result.confidence.toLowerCase()} confidence</span>
        </div>
      </div>
      {result.conflicts.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <strong>Identity disambiguation needed:</strong> {result.conflicts.join(" ")}
        </div>
      )}
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <div><h3 className="text-xs font-semibold uppercase text-slate-500">Crime category spread</h3><p className="mt-2 text-sm">{result.categories.join(", ")}</p></div>
        <div><h3 className="text-xs font-semibold uppercase text-slate-500">Location spread</h3><p className="mt-2 text-sm">{result.locations.join("; ")}</p></div>
        <div><h3 className="text-xs font-semibold uppercase text-slate-500">Time range</h3><p className="mt-2 text-sm">{new Date(result.firstSeen).toLocaleDateString("en-IN")} – {new Date(result.lastSeen).toLocaleDateString("en-IN")}</p></div>
      </div>
      <details className="mt-5 border-t border-slate-100 pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-teal-700">Review matching explanation and linked FIRs</summary>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <ul className="space-y-2 text-sm text-slate-600">
            {result.signals.map((signal) => <li key={`${signal.field}-${signal.explanation}`}><strong className="text-slate-800">+{signal.weight} {signal.field}:</strong> {signal.explanation}</li>)}
          </ul>
          <div className="space-y-2">
            {result.linkedFirs.map((fir) => (
              <div key={fir.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <Link href={`/fir-search/${fir.id}`} className="font-semibold text-teal-700 hover:underline">{fir.firNumber}</Link>
                <p className="mt-1 text-slate-600">{fir.category} · {fir.station}, {fir.district}</p>
              </div>
            ))}
          </div>
        </div>
      </details>
    </article>
  );
}

function DetectionContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<RepeatOffenderFilters>({ minimumFirCount: 2 });
  const [applied, setApplied] = useState<RepeatOffenderFilters>({ minimumFirCount: 2 });
  const [data, setData] = useState<RepeatOffenderDetectionResponse | null>(null);
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading"); setMessage("");
    try {
      const response = await fetchRepeatOffenders(applied, activeRole);
      setData(response); setState(response.results.length ? "ready" : "empty");
    } catch (error) {
      if (error instanceof RepeatOffenderApiError && error.status === 400) {
        setMessage(error.message); setState("validation-error");
      } else {
        setMessage("The detection service could not be reached safely."); setState("error");
      }
    }
  }, [activeRole, applied]);

  useEffect(() => { void load(); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); setApplied({ ...filters }); };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className={card}>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-slate-600">Name, alias, or person ID</span><input className={input} maxLength={80} value={filters.search ?? ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></label>
          <label><span className="mb-1 block text-xs font-semibold text-slate-600">Category</span><select className={input} value={filters.category ?? ""} onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}><option value="">All categories</option>{data?.availableFilters.categories.map((v) => <option key={v}>{v}</option>)}</select></label>
          <label><span className="mb-1 block text-xs font-semibold text-slate-600">District</span><select className={input} value={filters.district ?? ""} onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined })}><option value="">All districts</option>{data?.availableFilters.districts.map((v) => <option key={v}>{v}</option>)}</select></label>
          <label><span className="mb-1 block text-xs font-semibold text-slate-600">From</span><input type="date" className={input} value={filters.from ?? ""} onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })} /></label>
          <label><span className="mb-1 block text-xs font-semibold text-slate-600">To</span><input type="date" className={input} value={filters.to ?? ""} onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })} /></label>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <label className="w-48"><span className="mb-1 block text-xs font-semibold text-slate-600">Minimum FIR count</span><input type="number" min={2} max={20} className={input} value={filters.minimumFirCount ?? 2} onChange={(e) => setFilters({ ...filters, minimumFirCount: Number(e.target.value) })} /></label>
          <div className="flex gap-2">
            <button type="button" onClick={() => { const reset = { minimumFirCount: 2 }; setFilters(reset); setApplied(reset); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Reset</button>
            <button type="submit" className="h-10 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800">Run detection</button>
          </div>
        </div>
      </form>

      {data && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Sample-data analytical indicator — human verification required.</strong><p className="mt-1">{data.explanation}</p><p className="mt-1">{data.limitation}</p>{data.redacted && <p className="mt-1 font-medium">Identity fields are redacted for this role.</p>}</div>}
      {state === "loading" && <div className="h-64 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading repeat offender detection" />}
      {(state === "error" || state === "validation-error") && <section className={`${card} text-center`}><h2 className="font-semibold">{state === "validation-error" ? "Check the filters" : "Unable to run detection"}</h2><p className="mt-2 text-sm text-slate-600">{message}</p>{state === "error" && <button onClick={() => void load()} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Retry</button>}</section>}
      {state === "empty" && <section className={`${card} text-center`}><h2 className="font-semibold">No repeat-offender candidates found</h2><p className="mt-2 text-sm text-slate-600">No authorized sample records meet the active FIR threshold and filters.</p></section>}
      {state === "ready" && data && <><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Detection results</h2><span className="text-sm text-slate-500">{data.total} candidate{data.total === 1 ? "" : "s"}</span></div><div className="space-y-4">{data.results.map((result) => <ResultCard key={result.matchId} result={result} />)}</div></>}
    </div>
  );
}

export default function RepeatOffenderDetection() {
  return <AppShell title="Repeat Offender Detection" description="Find people linked to multiple FIRs using explainable identity signals, FIR counts, category spread, location spread, and time range." requiredPermission="page:repeat-offender-detection"><DetectionContent /></AppShell>;
}
