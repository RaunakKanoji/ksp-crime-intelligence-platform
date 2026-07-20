"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { fetchMoAnalysis, MoAnalysisApiError } from "@/lib/modus-operandi-analysis/api";
import type { MoAnalysisFilters, MoAnalysisResponse, MoPattern } from "@/lib/modus-operandi-analysis/types";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const DEFAULT_FILTERS: MoAnalysisFilters = { minimumSimilarity: 50 };

function PatternCard({ pattern }: { pattern: MoPattern }) {
  const tone = pattern.confidence === "High" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : pattern.confidence === "Medium" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-700";
  return <article className={card}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{pattern.id} · {pattern.category}</p><h2 className="mt-1 text-lg font-bold">{pattern.label}</h2><p className="mt-1 text-sm text-slate-500">{pattern.firCount} linked FIRs · {pattern.districts.join(", ")}</p></div>
      <div className="flex gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>{pattern.similarityScore}% · {pattern.confidence}</span><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${pattern.repeatPattern ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 text-slate-600"}`}>{pattern.repeatPattern ? "Repeat pattern" : "Single occurrence"}</span></div>
    </div>
    <p className="mt-4 text-sm leading-6 text-slate-600">{pattern.explanation}</p>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <section><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Extracted recurring attributes</h3><div className="mt-2 space-y-2">{pattern.attributes.length ? pattern.attributes.map((attribute) => <div key={`${attribute.type}-${attribute.value}`} className="rounded-lg bg-slate-50 p-3 text-sm"><div className="flex justify-between gap-2"><strong>{attribute.value}</strong><span className="text-xs text-slate-500">{attribute.type}</span></div><p className="mt-1 text-xs text-slate-500">Source: {attribute.sourceField}</p></div>) : <p className="text-sm text-slate-500">No single attribute recurs across every linked FIR.</p>}</div></section>
      <section><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linked FIRs</h3><div className="mt-2 space-y-2">{pattern.linkedFirs.map((fir) => <div key={fir.id} className="rounded-lg border border-slate-100 p-3 text-sm"><Link href={`/fir-search/${fir.id}`} className="font-semibold text-teal-700 hover:underline">{fir.firNumber}</Link><p className="mt-1 text-xs text-slate-500">{fir.category} · {fir.station}, {fir.district} · {new Date(fir.registeredAt).toLocaleDateString("en-IN")}</p><p className="mt-2 text-xs text-slate-600">{fir.attributes.map((item) => item.value).join(" · ")}</p></div>)}</div></section>
    </div>
  </article>;
}

function AnalysisContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<MoAnalysisFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<MoAnalysisFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<MoAnalysisResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading"); setMessage("");
    try {
      const response = await fetchMoAnalysis(applied, activeRole);
      setData(response); setState(response.patterns.length ? "ready" : "empty");
    } catch (error) {
      if (error instanceof MoAnalysisApiError && error.status === 400) { setMessage(error.message); setState("validation-error"); }
      else { setMessage("The analysis service could not be reached safely."); setState("error"); }
    }
  }, [activeRole, applied]);
  useEffect(() => { void load(); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); setApplied({ ...filters }); };

  return <div className="space-y-6">
    <form onSubmit={submit} className={card}>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-slate-600">Narrative, FIR, or category search</span><input className={input} maxLength={100} value={filters.search ?? ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="e.g. forced lock" /></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Category</span><select className={input} value={filters.category ?? ""} onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}><option value="">All categories</option>{data?.availableFilters.categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">District</span><select className={input} value={filters.district ?? ""} onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined })}><option value="">All districts</option>{data?.availableFilters.districts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">From</span><input type="date" className={input} value={filters.from ?? ""} onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">To</span><input type="date" className={input} value={filters.to ?? ""} onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })} /></label>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <label className="w-56"><span className="mb-1 block text-xs font-semibold text-slate-600">Minimum similarity (%)</span><input type="number" min={20} max={100} className={input} value={filters.minimumSimilarity ?? 50} onChange={(e) => setFilters({ ...filters, minimumSimilarity: Number(e.target.value) })} /></label>
        <div className="flex gap-2"><button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Reset</button><button type="submit" className="h-10 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white">Analyze methods</button></div>
      </div>
    </form>
    {data && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Sample-data decision support — manual verification required.</strong><p className="mt-1">{data.explanation}</p><p className="mt-1">{data.limitation}</p><p className="mt-1 font-semibold">Extraction method: deterministic rules. No generative AI output is used.</p></section>}
    {data && data.categoryGroups.length > 0 && <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.categoryGroups.map((group) => <div key={group.category} className={card}><p className="text-xs font-semibold uppercase text-slate-500">{group.category}</p><p className="mt-2 text-2xl font-bold">{group.linkedFirCount}</p><p className="text-sm text-slate-500">linked FIRs across {group.patternCount} pattern{group.patternCount === 1 ? "" : "s"}</p></div>)}</section>}
    {state === "loading" && <div className="h-72 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading modus operandi analysis" />}
    {(state === "error" || state === "validation-error") && <section className={`${card} text-center`}><h2 className="font-semibold">{state === "validation-error" ? "Check the analysis filters" : "Unable to run analysis"}</h2><p className="mt-2 text-sm text-slate-600">{message}</p>{state === "error" && <button onClick={() => void load()} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Retry</button>}</section>}
    {state === "empty" && <section className={`${card} text-center`}><h2 className="font-semibold">No method patterns found</h2><p className="mt-2 text-sm text-slate-600">No authorized sample FIRs match the text, category, district, date, and similarity filters.</p></section>}
    {state === "ready" && data && <><div className="flex justify-between gap-2"><h2 className="text-lg font-bold">Method patterns</h2><span className="text-sm text-slate-500">{data.total} result{data.total === 1 ? "" : "s"}</span></div><div className="space-y-4">{data.patterns.map((pattern) => <PatternCard pattern={pattern} key={pattern.id} />)}</div><p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">{data.auditNote}</p></>}
  </div>;
}

export default function ModusOperandiAnalysis() {
  return <AppShell title="Modus Operandi Analysis" description="Extract, group, search, and compare repeated crime methods across permission-filtered FIR records." requiredPermission="page:modus-operandi-analysis"><AnalysisContent /></AppShell>;
}
