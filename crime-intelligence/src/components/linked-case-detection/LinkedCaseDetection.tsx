"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { fetchLinkedCases, LinkedCaseApiError } from "@/lib/linked-case-detection/api";
import type { LinkedCaseCandidate, LinkedCaseDetectionResponse, LinkedCaseFilters } from "@/lib/linked-case-detection/types";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const DEFAULT_FILTERS: LinkedCaseFilters = { sourceFirId: "FIR-SAMPLE-001", minimumConfidence: "Low" };

function Candidate({ candidate }: { candidate: LinkedCaseCandidate }) {
  const tone = candidate.confidence === "High" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : candidate.confidence === "Medium" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <article className={card}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{candidate.linkId}</p>
          <h2 className="mt-1 text-lg font-bold"><Link href={`/fir-search/${candidate.target.id}`} className="hover:text-teal-700 hover:underline">{candidate.target.firNumber}</Link></h2>
          <p className="mt-1 text-sm text-slate-500">{candidate.target.category} · {candidate.target.station}, {candidate.target.district}</p>
        </div>
        <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${tone}`}>{candidate.score}% · {candidate.confidence} confidence</span>
      </div>
      <p className="mt-4 text-sm text-slate-600">{candidate.explanation}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {candidate.signals.map((signal) => (
          <div key={signal.type} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">{signal.label}</h3>
              <span className="text-xs font-bold text-teal-700">+{signal.weight}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600">{signal.explanation}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span>Registered {new Date(candidate.target.registeredAt).toLocaleDateString("en-IN")}</span>
        <span>Status: {candidate.target.status}</span>
      </div>
    </article>
  );
}

function DetectionPanel() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<LinkedCaseFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<LinkedCaseFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<LinkedCaseDetectionResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading"); setMessage("");
    try {
      const response = await fetchLinkedCases(applied, activeRole);
      setData(response);
      setState(response.candidates.length ? "ready" : "empty");
    } catch (error) {
      if (error instanceof LinkedCaseApiError && error.status === 400) {
        setMessage(error.message); setState("validation-error");
      } else {
        setMessage("The linked-case service could not be reached safely."); setState("error");
      }
    }
  }, [activeRole, applied]);

  useEffect(() => { void load(); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); setApplied({ ...filters }); };

  return (
    <div className="space-y-6">
      <form className={card} onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <label className="lg:col-span-2"><span className="mb-1 block text-xs font-semibold text-slate-600">Source FIR</span><select className={input} value={filters.sourceFirId} onChange={(e) => setFilters({ ...filters, sourceFirId: e.target.value })}>{data?.availableFilters.sourceCases.map((item) => <option value={item.id} key={item.id}>{item.firNumber} ({item.id})</option>) ?? <option value={filters.sourceFirId}>{filters.sourceFirId}</option>}</select></label>
          <label><span className="mb-1 block text-xs font-semibold text-slate-600">Candidate district</span><select className={input} value={filters.district ?? ""} onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined })}><option value="">All districts</option>{data?.availableFilters.districts.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="mb-1 block text-xs font-semibold text-slate-600">Minimum confidence</span><select className={input} value={filters.minimumConfidence ?? "Low"} onChange={(e) => setFilters({ ...filters, minimumConfidence: e.target.value as LinkedCaseFilters["minimumConfidence"] })}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <div className="grid grid-cols-2 gap-2">
            <label><span className="mb-1 block text-xs font-semibold text-slate-600">From</span><input type="date" className={input} value={filters.from ?? ""} onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })} /></label>
            <label><span className="mb-1 block text-xs font-semibold text-slate-600">To</span><input type="date" className={input} value={filters.to ?? ""} onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })} /></label>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Reset</button>
          <button type="submit" className="h-10 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800">Detect possible links</button>
        </div>
      </form>

      {data && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>Sample-data analytical indicator — human verification required.</strong>
          <p className="mt-1">{data.explanation}</p><p className="mt-1">{data.limitation}</p>
          {(data.phoneSignalsRedacted || data.associateSignalsRedacted) && <p className="mt-1 font-semibold">Restricted signals omitted: {[data.phoneSignalsRedacted && "phone references", data.associateSignalsRedacted && "associate references"].filter(Boolean).join(", ")}.</p>}
        </section>
      )}

      {data && <section className={`${card} flex flex-wrap items-center justify-between gap-3`}><div><p className="text-xs font-semibold uppercase text-slate-500">Source case</p><h2 className="mt-1 font-bold"><Link href={`/fir-search/${data.sourceCase.id}`} className="text-teal-700 hover:underline">{data.sourceCase.firNumber}</Link></h2><p className="mt-1 text-sm text-slate-500">{data.sourceCase.category} · {data.sourceCase.station}, {data.sourceCase.district}</p></div><span className="text-sm text-slate-500">{data.total} possible link{data.total === 1 ? "" : "s"}</span></section>}
      {state === "loading" && <div className="h-64 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading linked case detection" />}
      {(state === "error" || state === "validation-error") && <section className={`${card} text-center`}><h2 className="font-semibold">{state === "validation-error" ? "Check the detection inputs" : "Unable to detect linked cases"}</h2><p className="mt-2 text-sm text-slate-600">{message}</p>{state === "error" && <button onClick={() => void load()} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Retry</button>}</section>}
      {state === "empty" && <section className={`${card} text-center`}><h2 className="font-semibold">No possible links found</h2><p className="mt-2 text-sm text-slate-600">No authorized sample cases meet the active date, district, signal, and confidence filters.</p></section>}
      {state === "ready" && data && <div className="space-y-4">{data.candidates.map((candidate) => <Candidate key={candidate.linkId} candidate={candidate} />)}</div>}
    </div>
  );
}

export default function LinkedCaseDetection() {
  return <AppShell title="Linked Case Detection" description="Detect and explain possible links between FIRs using authorized identity, vehicle, method, location, time, property, phone, and associate signals." requiredPermission="page:linked-case-detection"><DetectionPanel /></AppShell>;
}
