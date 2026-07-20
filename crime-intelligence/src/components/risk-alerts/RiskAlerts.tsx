"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { fetchRiskAlerts, RiskAlertsApiError } from "@/lib/risk-alerts/api";
import type { RiskAlert, RiskAlertFilters, RiskAlertsResponse, RiskAlertSeverity } from "@/lib/risk-alerts/types";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const DEFAULT_FILTERS: RiskAlertFilters = {};
const labels: Record<string, string> = { "theft-spike": "Theft spike", "repeated-location": "Repeated location", "repeat-accused": "Repeat accused", "high-risk-unresolved": "High-risk unresolved", "district-category-spike": "District category spike" };

function severityTone(severity: RiskAlertSeverity) {
  if (severity === "Critical") return "border-red-200 bg-red-50 text-red-800";
  if (severity === "High") return "border-orange-200 bg-orange-50 text-orange-800";
  if (severity === "Medium") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function AlertCard({ alert }: { alert: RiskAlert }) {
  return <article className={card}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{labels[alert.type]} · {alert.id}</p><h2 className="mt-1 text-lg font-bold">{alert.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{alert.summary}</p></div>
      <div className="flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityTone(alert.severity)}`}>{alert.severity}</span><span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold">{alert.reviewStatus}</span></div>
    </div>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><span>{alert.district}{alert.station ? ` · ${alert.station}` : ""}</span><span>{alert.category}</span><span>{alert.relatedRecordCount} related record{alert.relatedRecordCount === 1 ? "" : "s"}</span><span>{alert.confidence} confidence</span><span>Detected {new Date(alert.detectedAt).toLocaleString("en-IN")}</span></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{alert.signals.map((signal) => <div key={signal.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex justify-between gap-2"><h3 className="text-sm font-semibold">{signal.label}</h3><strong className="text-sm text-teal-700">{signal.value}</strong></div><p className="mt-2 text-xs leading-5 text-slate-600">{signal.explanation}</p><p className="mt-2 text-xs text-slate-500"><strong>Sources:</strong> {signal.sourceFields.join(", ")}</p></div>)}</div>
    <details className="mt-5 border-t border-slate-100 pt-4"><summary className="cursor-pointer text-sm font-semibold text-teal-700">Review trigger and limitation</summary><p className="mt-3 text-sm text-slate-700"><strong>Trigger:</strong> {alert.thresholdExplanation}</p><p className="mt-2 text-sm text-slate-600"><strong>Limitation:</strong> {alert.limitation}</p>{alert.sensitiveReference && <p className="mt-2 text-xs text-slate-500">Authorized source reference: {alert.sensitiveReference}</p>}</details>
  </article>;
}

function AlertContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<RiskAlertFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<RiskAlertFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<RiskAlertsResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setState("loading"); setMessage("");
    try {
      const response = await fetchRiskAlerts(applied, activeRole);
      setData(response); setState(response.alerts.length ? "ready" : "empty");
    } catch (error) {
      if (error instanceof RiskAlertsApiError && error.status === 400) { setMessage(error.message); setState("validation-error"); }
      else { setMessage("The risk-alert service could not be reached safely."); setState("error"); }
    }
  }, [activeRole, applied]);
  useEffect(() => { void load(); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); setApplied({ ...filters }); };

  return <div className="space-y-6">
    <form onSubmit={submit} className={card}>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
        <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-slate-600">Search alerts</span><input className={input} maxLength={80} value={filters.search ?? ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Alert type</span><select className={input} value={filters.type ?? ""} onChange={(e) => setFilters({ ...filters, type: e.target.value ? e.target.value as RiskAlertFilters["type"] : undefined })}><option value="">All types</option>{data?.availableFilters.types.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Severity</span><select className={input} value={filters.severity ?? ""} onChange={(e) => setFilters({ ...filters, severity: e.target.value ? e.target.value as RiskAlertFilters["severity"] : undefined })}><option value="">All severities</option>{data?.availableFilters.severities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Review status</span><select className={input} value={filters.reviewStatus ?? ""} onChange={(e) => setFilters({ ...filters, reviewStatus: e.target.value ? e.target.value as RiskAlertFilters["reviewStatus"] : undefined })}><option value="">All review states</option>{data?.availableFilters.reviewStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">District</span><select className={input} value={filters.district ?? ""} onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined })}><option value="">All districts</option>{data?.availableFilters.districts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-2"><label><span className="mb-1 block text-xs font-semibold text-slate-600">From</span><input type="date" className={input} value={filters.from ?? ""} onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })} /></label><label><span className="mb-1 block text-xs font-semibold text-slate-600">To</span><input type="date" className={input} value={filters.to ?? ""} onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })} /></label></div>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Reset</button><button type="submit" className="h-10 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white">Apply filters</button></div>
    </form>
    {data && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Sample-data decision support — human review required.</strong><p className="mt-1">{data.explanation}</p><p className="mt-1">Alerts indicate thresholds in available data; they do not predict crime, establish guilt, or mandate operational action.</p>{data.sensitiveReferencesRedacted && <p className="mt-1 font-semibold">Sensitive source references are redacted for this role.</p>}</section>}
    {data && <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">{(["Critical", "High", "Medium", "Low"] as RiskAlertSeverity[]).map((severity) => <div key={severity} className={card}><p className="text-xs font-semibold uppercase text-slate-500">{severity}</p><p className="mt-2 text-2xl font-bold">{data.counts[severity]}</p><p className="text-xs text-slate-500">matching alerts</p></div>)}</section>}
    {state === "loading" && <div className="h-72 animate-pulse rounded-2xl bg-slate-100" aria-label="Loading risk alerts" />}
    {(state === "error" || state === "validation-error") && <section className={`${card} text-center`}><h2 className="font-semibold">{state === "validation-error" ? "Check the alert filters" : "Unable to load risk alerts"}</h2><p className="mt-2 text-sm text-slate-600">{message}</p>{state === "error" && <button onClick={() => void load()} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Retry</button>}</section>}
    {state === "empty" && <section className={`${card} text-center`}><h2 className="font-semibold">No alerts match</h2><p className="mt-2 text-sm text-slate-600">No authorized sample alerts match the active type, severity, review status, district, date, and search filters.</p></section>}
    {state === "ready" && data && <><div className="flex justify-between gap-2"><h2 className="text-lg font-bold">Alert review feed</h2><span className="text-sm text-slate-500">{data.total} alert{data.total === 1 ? "" : "s"}</span></div><div className="space-y-4">{data.alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}</div><p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">{data.auditNote}</p></>}
  </div>;
}

export default function RiskAlerts() {
  return <AppShell title="Risk Alerts" description="Review explainable threshold alerts derived from authorized hotspot, repeat-offender, case-status, and priority-score signals." requiredPermission="page:risk-alerts"><AlertContent /></AppShell>;
}
