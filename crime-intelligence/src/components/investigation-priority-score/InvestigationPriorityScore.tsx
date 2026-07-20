"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { fetchPriorityScores, PriorityScoreApiError } from "@/lib/investigation-priority-score/api";
import type { InvestigationPriorityResponse, InvestigationPriorityResult, PriorityScoreFilters } from "@/lib/investigation-priority-score/types";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const DEFAULT_FILTERS: PriorityScoreFilters = { minimumScore: 0 };

function bandTone(score: number) {
  if (score >= 80) return "border-red-200 bg-red-50 text-red-800";
  if (score >= 65) return "border-orange-200 bg-orange-50 text-orange-800";
  if (score >= 40) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function ScoreCard({ result }: { result: InvestigationPriorityResult }) {
  return <article className={card}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{result.id}</p><h2 className="mt-1 text-lg font-bold"><Link href={`/fir-search/${result.id}`} className="hover:text-teal-700 hover:underline">{result.firNumber}</Link></h2><p className="mt-1 text-sm text-slate-500">{result.category} · {result.station}, {result.district} · {result.status}</p></div>
      <div className="text-right"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${bandTone(result.score)}`}>{result.priorityBand}</span><p className="mt-2 text-3xl font-bold">{result.score}<span className="text-sm font-medium text-slate-400">/100</span></p><p className="text-xs text-slate-500">{result.confidence} data confidence</p></div>
    </div>
    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{ width: `${result.score}%` }} /></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {result.factors.map((factor) => <div key={factor.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex justify-between gap-2"><h3 className="text-sm font-semibold">{factor.label}</h3><strong className="text-sm text-teal-700">{factor.points}/{factor.maximumPoints}</strong></div>
        <p className="mt-1 text-xs font-medium text-slate-500">{factor.rawLevel} input</p><p className="mt-2 text-xs leading-5 text-slate-600">{factor.explanation}</p>
        <p className="mt-2 text-xs text-slate-500"><strong>Sources:</strong> {factor.sourceFields.join(", ")}</p><p className="mt-1 text-xs italic text-slate-500">{factor.limitation}</p>
      </div>)}
    </div>
    {result.repeatOffenderReference && <p className="mt-4 text-xs text-slate-500">Authorized repeat-offender match reference: {result.repeatOffenderReference}</p>}
  </article>;
}

function PriorityContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<PriorityScoreFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<PriorityScoreFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<InvestigationPriorityResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading"); setMessage("");
    try {
      const response = await fetchPriorityScores(applied, activeRole);
      setData(response); setState(response.results.length ? "ready" : "empty");
    } catch (error) {
      if (error instanceof PriorityScoreApiError && error.status === 400) { setMessage(error.message); setState("validation-error"); }
      else { setMessage("The priority scoring service could not be reached safely."); setState("error"); }
    }
  }, [activeRole, applied]);
  useEffect(() => { void load(); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); setApplied({ ...filters }); };

  return <div className="space-y-6">
    <form onSubmit={submit} className={card}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Search FIR, category, or location</span><input className={input} maxLength={80} value={filters.search ?? ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">District</span><select className={input} value={filters.district ?? ""} onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined })}><option value="">All districts</option>{data?.availableFilters.districts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Category</span><select className={input} value={filters.category ?? ""} onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}><option value="">All categories</option>{data?.availableFilters.categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Case status</span><select className={input} value={filters.status ?? ""} onChange={(e) => setFilters({ ...filters, status: e.target.value ? e.target.value as PriorityScoreFilters["status"] : undefined })}><option value="">All statuses</option>{data?.availableFilters.statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Minimum score</span><input type="number" min={0} max={100} className={input} value={filters.minimumScore ?? 0} onChange={(e) => setFilters({ ...filters, minimumScore: Number(e.target.value) })} /></label>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Reset</button><button type="submit" className="h-10 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white">Calculate scores</button></div>
    </form>
    {data && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Decision support only — human review required.</strong><p className="mt-1">{data.explanation}</p><p className="mt-1 font-medium">{data.scoringFormula}</p><ul className="mt-2 list-disc space-y-1 pl-5">{data.limitations.map((item) => <li key={item}>{item}</li>)}</ul>{data.sensitiveReferencesRedacted && <p className="mt-2 font-semibold">Sensitive repeat-offender references are redacted for this role; their authorized indicator contribution remains visible.</p>}</section>}
    {state === "loading" && <div className="h-80 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading investigation priority scores" />}
    {(state === "error" || state === "validation-error") && <section className={`${card} text-center`}><h2 className="font-semibold">{state === "validation-error" ? "Check the scoring filters" : "Unable to calculate scores"}</h2><p className="mt-2 text-sm text-slate-600">{message}</p>{state === "error" && <button onClick={() => void load()} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Retry</button>}</section>}
    {state === "empty" && <section className={`${card} text-center`}><h2 className="font-semibold">No cases meet the threshold</h2><p className="mt-2 text-sm text-slate-600">No authorized sample cases match the active search, status, location, category, and minimum-score filters.</p></section>}
    {state === "ready" && data && <><div className="flex justify-between gap-2"><h2 className="text-lg font-bold">Priority review ranking</h2><span className="text-sm text-slate-500">{data.total} case{data.total === 1 ? "" : "s"}</span></div><div className="space-y-4">{data.results.map((result) => <ScoreCard result={result} key={result.id} />)}</div><p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">{data.auditNote}</p></>}
  </div>;
}

export default function InvestigationPriorityScore() {
  return <AppShell title="Investigation Priority Score" description="Review transparent, permission-filtered case priority indicators without automating investigative decisions." requiredPermission="page:investigation-priority-score"><PriorityContent /></AppShell>;
}
