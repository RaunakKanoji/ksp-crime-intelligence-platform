"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { fetchPredictiveCrimeRisk, PredictiveCrimeRiskApiError } from "@/lib/predictive-crime-risk/api";
import type {
  PredictiveCrimeRiskAssessment,
  PredictiveCrimeRiskFilters,
  PredictiveCrimeRiskResponse,
  PredictiveRiskLevel,
  PredictiveRiskTimeWindow,
} from "@/lib/predictive-crime-risk/types";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const DEFAULT_FILTERS: PredictiveCrimeRiskFilters = { horizonDays: 14, minimumConfidence: 35 };
const windowLabels: Record<PredictiveRiskTimeWindow, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night" };

function levelTone(level: PredictiveRiskLevel) {
  if (level === "High") return "border-red-200 bg-red-50 text-red-800";
  if (level === "Medium") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function RiskMeter({ value }: { value: number }) {
  return <div className="mt-3">
    <div className="flex items-center justify-between text-xs text-slate-500"><span>Risk score</span><strong>{value}/100</strong></div>
    <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-700" style={{ width: `${value}%` }} /></div>
  </div>;
}

function AssessmentCard({ assessment }: { assessment: PredictiveCrimeRiskAssessment }) {
  return <article className={card}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{assessment.id} · {windowLabels[assessment.timeWindow]} window</p>
        <h2 className="mt-1 text-lg font-bold">{assessment.category} risk estimate in {assessment.station}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{assessment.observation}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${levelTone(assessment.riskLevel)}`}>{assessment.riskLevel} review risk</span>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold">{assessment.confidence} confidence</span>
      </div>
    </div>
    <RiskMeter value={assessment.riskScore} />
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
      <span>{assessment.district} · {assessment.station}</span>
      <span>{assessment.historicalIncidentCount} historical incident{assessment.historicalIncidentCount === 1 ? "" : "s"}</span>
      <span>{assessment.currentWindowCount} current / {assessment.previousWindowCount} previous</span>
      <span>{assessment.trendPercent >= 0 ? "+" : ""}{assessment.trendPercent}% trend</span>
      <span>{assessment.horizonDays}-day horizon</span>
      <span>Observed {new Date(assessment.firstObservedAt).toLocaleDateString("en-IN")}–{new Date(assessment.lastObservedAt).toLocaleDateString("en-IN")}</span>
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {assessment.signals.map((signal) => <div key={signal.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex justify-between gap-2"><h3 className="text-sm font-semibold">{signal.label}</h3><strong className="text-sm text-teal-700">+{signal.scoreContribution}</strong></div>
        <p className="mt-1 text-sm font-semibold text-slate-800">{signal.value}</p>
        <p className="mt-2 text-xs leading-5 text-slate-600">{signal.explanation}</p>
        <p className="mt-2 text-xs text-slate-500"><strong>Sources:</strong> {signal.sourceFields.join(", ")}</p>
      </div>)}
    </div>
    <details className="mt-5 border-t border-slate-100 pt-4">
      <summary className="cursor-pointer text-sm font-semibold text-teal-700">Explanation, limitation, and bias warning</summary>
      <p className="mt-3 text-sm text-slate-700"><strong>Explanation:</strong> {assessment.explanation}</p>
      <p className="mt-2 text-sm text-slate-600"><strong>Limitation:</strong> {assessment.limitation}</p>
      <p className="mt-2 text-sm text-amber-800"><strong>Bias warning:</strong> {assessment.biasWarning}</p>
      <p className="mt-2 text-sm text-slate-600"><strong>No deterministic claim:</strong> {assessment.noDeterministicClaim}</p>
      <p className="mt-2 text-xs text-slate-500"><strong>Related sample FIR IDs:</strong> {assessment.relatedFirIds.join(", ")}</p>
    </details>
  </article>;
}

function PredictiveCrimeRiskContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<PredictiveCrimeRiskFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<PredictiveCrimeRiskFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<PredictiveCrimeRiskResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      const response = await fetchPredictiveCrimeRisk(applied, activeRole);
      setData(response);
      setState(response.assessments.length ? "ready" : "empty");
    } catch (error) {
      if (error instanceof PredictiveCrimeRiskApiError && error.status === 400) {
        setMessage(error.message);
        setState("validation-error");
      } else {
        setMessage("The predictive-risk service could not be reached safely.");
        setState("error");
      }
    }
  }, [activeRole, applied]);

  useEffect(() => { void load(); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); setApplied({ ...filters }); };
  const reset = () => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); };
  const highCount = data?.assessments.filter((item) => item.riskLevel === "High").length ?? 0;
  const averageScore = data?.assessments.length ? Math.round(data.assessments.reduce((sum, item) => sum + item.riskScore, 0) / data.assessments.length) : 0;

  return <div className="space-y-6">
    <form onSubmit={submit} className={card}>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Search risk estimates</span>
          <input className={input} maxLength={100} value={filters.search ?? ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="District, station, category, time window" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-600">District</span>
          <select className={input} value={filters.district ?? ""} onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined, station: undefined })}>
            <option value="">All districts</option>{data?.availableFilters.districts.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-600">Station / area</span>
          <select className={input} value={filters.station ?? ""} onChange={(e) => setFilters({ ...filters, station: e.target.value || undefined })}>
            <option value="">All stations</option>{data?.availableFilters.stations.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-600">Crime category</span>
          <select className={input} value={filters.category ?? ""} onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}>
            <option value="">All categories</option>{data?.availableFilters.categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-600">Time window</span>
          <select className={input} value={filters.timeWindow ?? ""} onChange={(e) => setFilters({ ...filters, timeWindow: e.target.value ? e.target.value as PredictiveRiskTimeWindow : undefined })}>
            <option value="">All windows</option>{data?.availableFilters.timeWindows.map((item) => <option key={item} value={item}>{windowLabels[item]}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2 md:col-span-2">
          <label><span className="mb-1 block text-xs font-semibold text-slate-600">From</span><input type="date" className={input} value={filters.from ?? ""} onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })} /></label>
          <label><span className="mb-1 block text-xs font-semibold text-slate-600">To</span><input type="date" className={input} value={filters.to ?? ""} onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })} /></label>
        </div>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-600">Risk horizon</span>
          <select className={input} value={filters.horizonDays ?? 14} onChange={(e) => setFilters({ ...filters, horizonDays: Number(e.target.value) })}>
            <option value={7}>Next 7 days</option><option value={14}>Next 14 days</option><option value={30}>Next 30 days</option><option value={60}>Next 60 days</option><option value={90}>Next 90 days</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-600">Minimum confidence</span>
          <input type="number" min={0} max={100} className={input} value={filters.minimumConfidence ?? 35} onChange={(e) => setFilters({ ...filters, minimumConfidence: e.target.value === "" ? undefined : Number(e.target.value) })} />
        </label>
      </div>
      <p className="mt-3 text-xs text-slate-500">Inputs are validated server-side. The score uses historical trend, station-level location, time-window, and category features only.</p>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={reset} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Reset</button>
        <button type="submit" className="h-10 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white">Estimate risk</button>
      </div>
    </form>

    {data && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <strong>Decision support only — human review required.</strong>
      <p className="mt-1">{data.explanation}</p>
      <p className="mt-1"><strong>Formula:</strong> {data.scoringFormula}</p>
      <p className="mt-1"><strong>Bias warning:</strong> {data.biasWarning}</p>
      {data.sensitiveReferencesRedacted && <p className="mt-1 font-semibold">Sensitive references are redacted for this role.</p>}
    </section>}

    {data && <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className={card}><p className="text-xs font-semibold uppercase text-slate-500">Risk estimates</p><p className="mt-2 text-2xl font-bold">{data.total}</p><p className="text-xs text-slate-500">matching filters</p></div>
      <div className={card}><p className="text-xs font-semibold uppercase text-slate-500">High review risk</p><p className="mt-2 text-2xl font-bold">{highCount}</p><p className="text-xs text-slate-500">requires review</p></div>
      <div className={card}><p className="text-xs font-semibold uppercase text-slate-500">Average score</p><p className="mt-2 text-2xl font-bold">{averageScore}</p><p className="text-xs text-slate-500">across visible estimates</p></div>
      <div className={card}><p className="text-xs font-semibold uppercase text-slate-500">Provider</p><p className="mt-2 text-sm font-bold">Explainable rules</p><p className="text-xs text-slate-500">no external AI call</p></div>
    </section>}

    {state === "loading" && <div className="h-72 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading predictive crime risk" />}
    {(state === "error" || state === "validation-error") && <section className={`${card} text-center`}>
      <h2 className="font-semibold">{state === "validation-error" ? "Check the predictive-risk inputs" : "Unable to load predictive crime risk"}</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      {state === "error" && <button onClick={() => void load()} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Retry</button>}
    </section>}
    {state === "empty" && <section className={`${card} text-center`}>
      <h2 className="font-semibold">No risk estimates match</h2>
      <p className="mt-2 text-sm text-slate-600">No authorized sample records match the selected historical range, location, time-window, category, and confidence filters.</p>
    </section>}
    {state === "ready" && data && <>
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Area/time/category risk estimates</h2><span className="text-sm text-slate-500">{data.total} estimate{data.total === 1 ? "" : "s"}</span></div>
      <div className="space-y-4">{data.assessments.map((assessment) => <AssessmentCard key={assessment.id} assessment={assessment} />)}</div>
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
        <strong>Limitations:</strong> {data.limitations.join(" ")} <span>{data.auditNote}</span>
      </section>
    </>}
  </div>;
}

export default function PredictiveCrimeRisk() {
  return <AppShell
    title="Predictive Crime Risk"
    description="Estimate area, time-window, and category-specific review risk using explainable historical signals."
    requiredPermission="page:predictive-crime-risk"
  >
    <PredictiveCrimeRiskContent />
  </AppShell>;
}
