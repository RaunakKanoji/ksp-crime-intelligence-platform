"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { fetchCrimePatterns, CrimePatternApiError } from "@/lib/crime-pattern-discovery/api";
import type { CrimePatternDiscoveryResponse, CrimePatternFilters, CrimePatternType, DiscoveredCrimePattern } from "@/lib/crime-pattern-discovery/types";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const DEFAULT_FILTERS: CrimePatternFilters = { minimumOccurrences: 2, minimumConfidence: 50 };
const typeLabels: Record<CrimePatternType, string> = { time: "Time", location: "Location", category: "Category", "modus-operandi": "Modus operandi", accused: "Accused" };

function confidenceTone(confidence: DiscoveredCrimePattern["confidence"]) {
  if (confidence === "High") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (confidence === "Medium") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function PatternCard({ pattern }: { pattern: DiscoveredCrimePattern }) {
  return <article className={card}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{typeLabels[pattern.type]} pattern · {pattern.ruleId}</p>
        <h2 className="mt-1 text-lg font-bold">{pattern.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{pattern.observation}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${confidenceTone(pattern.confidence)}`}>{pattern.confidence} confidence</span>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold">{pattern.confidenceScore}/100</span>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
      <span>{pattern.district ?? "Multi-district"}</span><span>{pattern.category ?? "Multi-category"}</span>
      <span>{pattern.occurrenceCount} occurrence{pattern.occurrenceCount === 1 ? "" : "s"}</span>
      <span>Observed {new Date(pattern.firstObservedAt).toLocaleDateString("en-IN")}–{new Date(pattern.lastObservedAt).toLocaleDateString("en-IN")}</span>
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {pattern.signals.map((signal) => <div key={signal.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex justify-between gap-2"><h3 className="text-sm font-semibold">{signal.label}</h3><strong className="text-sm text-teal-700">{signal.value}</strong></div>
        <p className="mt-2 text-xs text-slate-500"><strong>Sources:</strong> {signal.sourceFields.join(", ")}</p>
      </div>)}
    </div>
    <details className="mt-5 border-t border-slate-100 pt-4">
      <summary className="cursor-pointer text-sm font-semibold text-teal-700">Observation review details</summary>
      <p className="mt-3 text-sm text-slate-700"><strong>Explanation:</strong> {pattern.explanation}</p>
      <p className="mt-2 text-sm text-slate-600"><strong>Limitation:</strong> {pattern.limitation}</p>
      <p className="mt-2 text-xs text-slate-500"><strong>Related sample FIR IDs:</strong> {pattern.relatedFirIds.join(", ")}</p>
      {pattern.accusedMatchReference ? <p className="mt-2 text-xs text-slate-500">Authorized accused match reference: {pattern.accusedMatchReference}</p> : null}
    </details>
  </article>;
}

function PatternDiscoveryContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<CrimePatternFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<CrimePatternFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<CrimePatternDiscoveryResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      const response = await fetchCrimePatterns(applied, activeRole);
      setData(response);
      setState(response.patterns.length ? "ready" : "empty");
    } catch (error) {
      if (error instanceof CrimePatternApiError && error.status === 400) {
        setMessage(error.message);
        setState("validation-error");
      } else {
        setMessage("The pattern-discovery service could not be reached safely.");
        setState("error");
      }
    }
  }, [activeRole, applied]);

  useEffect(() => { void load(); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); setApplied({ ...filters }); };
  const reset = () => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); };
  const highConfidence = data?.patterns.filter((pattern) => pattern.confidence === "High").length ?? 0;
  const relatedFirCount = data ? new Set(data.patterns.flatMap((pattern) => pattern.relatedFirIds)).size : 0;

  return <div className="space-y-6">
    <form onSubmit={submit} className={card}>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
        <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-slate-600">Search patterns</span><input className={input} maxLength={100} value={filters.search ?? ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Pattern type</span><select className={input} value={filters.type ?? ""} onChange={(e) => setFilters({ ...filters, type: e.target.value ? e.target.value as CrimePatternType : undefined })}><option value="">All types</option>{data?.availableFilters.types.map((item) => <option key={item} value={item}>{typeLabels[item]}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">District</span><select className={input} value={filters.district ?? ""} onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined })}><option value="">All districts</option>{data?.availableFilters.districts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Category</span><select className={input} value={filters.category ?? ""} onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}><option value="">All categories</option>{data?.availableFilters.categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-2"><label><span className="mb-1 block text-xs font-semibold text-slate-600">From</span><input type="date" className={input} value={filters.from ?? ""} onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })} /></label><label><span className="mb-1 block text-xs font-semibold text-slate-600">To</span><input type="date" className={input} value={filters.to ?? ""} onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })} /></label></div>
        <div className="grid grid-cols-2 gap-2"><label><span className="mb-1 block text-xs font-semibold text-slate-600">Min occurrences</span><input type="number" min={2} max={10} className={input} value={filters.minimumOccurrences ?? 2} onChange={(e) => setFilters({ ...filters, minimumOccurrences: Number(e.target.value) })} /></label><label><span className="mb-1 block text-xs font-semibold text-slate-600">Min confidence</span><input type="number" min={20} max={100} className={input} value={filters.minimumConfidence ?? 50} onChange={(e) => setFilters({ ...filters, minimumConfidence: Number(e.target.value) })} /></label></div>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={reset} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Reset</button><button type="submit" className="h-10 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white">Discover patterns</button></div>
    </form>

    {data && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Sample-data observations — human review required.</strong><p className="mt-1">{data.explanation}</p><p className="mt-1">Pattern observations are correlations in authorized records; they do not establish guilt, causation, or final investigative conclusions.</p>{data.sensitiveReferencesRedacted && <p className="mt-1 font-semibold">Sensitive accused references are redacted for this role.</p>}</section>}
    {data && <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><div className={card}><p className="text-xs font-semibold uppercase text-slate-500">Patterns</p><p className="mt-2 text-2xl font-bold">{data.total}</p><p className="text-xs text-slate-500">matching filters</p></div><div className={card}><p className="text-xs font-semibold uppercase text-slate-500">Rules</p><p className="mt-2 text-2xl font-bold">{data.rules.length}</p><p className="text-xs text-slate-500">active rule definitions</p></div><div className={card}><p className="text-xs font-semibold uppercase text-slate-500">High confidence</p><p className="mt-2 text-2xl font-bold">{highConfidence}</p><p className="text-xs text-slate-500">requires review</p></div><div className={card}><p className="text-xs font-semibold uppercase text-slate-500">FIR references</p><p className="mt-2 text-2xl font-bold">{relatedFirCount}</p><p className="text-xs text-slate-500">sample source records</p></div></section>}
    {data && <section className={card}><h2 className="text-lg font-bold">Pattern rules</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.rules.map((rule) => <div key={rule.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-teal-700">{rule.id} · {typeLabels[rule.type]}</p><h3 className="mt-1 text-sm font-semibold">{rule.name}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{rule.condition}</p><p className="mt-2 text-xs text-slate-500"><strong>Sources:</strong> {rule.sourceFields.join(", ")}</p><p className="mt-2 text-xs text-slate-500"><strong>Limit:</strong> {rule.limitation}</p></div>)}</div></section>}
    {state === "loading" && <div className="h-72 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading crime pattern discovery" />}
    {(state === "error" || state === "validation-error") && <section className={`${card} text-center`}><h2 className="font-semibold">{state === "validation-error" ? "Check the pattern filters" : "Unable to discover crime patterns"}</h2><p className="mt-2 text-sm text-slate-600">{message}</p>{state === "error" && <button onClick={() => void load()} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Retry</button>}</section>}
    {state === "empty" && <section className={`${card} text-center`}><h2 className="font-semibold">No patterns match</h2><p className="mt-2 text-sm text-slate-600">No authorized sample patterns match the active type, district, category, date, occurrence, confidence, and search filters.</p></section>}
    {state === "ready" && data && <><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Discovered pattern observations</h2><span className="text-sm text-slate-500">{data.total} pattern{data.total === 1 ? "" : "s"}</span></div><div className="space-y-4">{data.patterns.map((pattern) => <PatternCard key={pattern.id} pattern={pattern} />)}</div><p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">{data.limitations.join(" ")} {data.auditNote}</p></>}
  </div>;
}

export default function CrimePatternDiscovery() {
  return <AppShell title="Crime Pattern Discovery" description="Discover explainable time, location, category, modus-operandi, and accused-linked patterns from authorized records." requiredPermission="page:crime-pattern-discovery"><PatternDiscoveryContent /></AppShell>;
}
