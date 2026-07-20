"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { fetchLocationIntelligence, LocationIntelligenceApiError } from "@/lib/location-detail-intelligence/api";
import type { LocationDetailIntelligenceResponse, LocationIntelligenceFilters } from "@/lib/location-detail-intelligence/types";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const DEFAULT_FILTERS: LocationIntelligenceFilters = { locationId: "LOC-BEN-CENTRAL-DIVISION" };

function MaskedMap({ data }: { data: LocationDetailIntelligenceResponse }) {
  const scoreColor = data.hotspot.level === "Critical" ? "#dc2626" : data.hotspot.level === "High" ? "#f59e0b" : "#0f766e";
  return <section className={`${card} overflow-hidden p-0`}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3"><div><h2 className="font-semibold">Location context map</h2><p className="text-xs text-slate-500">Provider-free fallback · masked aggregate center</p></div><div className="flex gap-3 text-xs"><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-teal-700" />Selected area</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-slate-500" />Nearby station</span></div></div>
    <svg viewBox="0 0 700 360" className="min-h-[360px] w-full bg-slate-50" role="img" aria-label={`Masked map for ${data.location.label}`}>
      <rect x="35" y="30" width="630" height="290" rx="18" fill="#f8fafc" stroke="#cbd5e1" />
      {[1, 2, 3, 4].map((line) => <line key={`h${line}`} x1="35" x2="665" y1={30 + line * 58} y2={30 + line * 58} stroke="#e2e8f0" />)}
      {[1, 2, 3, 4, 5].map((line) => <line key={`v${line}`} y1="30" y2="320" x1={35 + line * 105} x2={35 + line * 105} stroke="#e2e8f0" />)}
      <circle cx="330" cy="175" r="70" fill={scoreColor} fillOpacity=".14" stroke={scoreColor} strokeWidth="2" strokeDasharray="6 4" />
      <circle cx="330" cy="175" r="16" fill={scoreColor} /><text x="330" y="179" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">{data.incidentCount}</text>
      <path d="M430 215 l12 -22 12 22 z" fill="#475569" /><rect x="435" y="215" width="14" height="14" fill="#475569" />
      <text x="330" y="266" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="700">{data.location.label}</text>
      <text x="442" y="245" textAnchor="middle" fill="#475569" fontSize="11">{data.location.nearbyPoliceStation}</text>
      <text x="50" y="52" fill="#64748b" fontSize="11">Center: {data.location.maskedCenter[1]}, {data.location.maskedCenter[0]} · {data.location.precision}</text>
    </svg>
  </section>;
}

function DetailContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<LocationIntelligenceFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<LocationIntelligenceFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<LocationDetailIntelligenceResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setState("loading"); setMessage("");
    try {
      const response = await fetchLocationIntelligence(applied, activeRole);
      setData(response); setState(response ? "ready" : "empty");
    } catch (error) {
      if (error instanceof LocationIntelligenceApiError && error.status === 400) { setMessage(error.message); setState("validation-error"); }
      else { setMessage("The location-intelligence service could not be reached safely."); setState("error"); }
    }
  }, [activeRole, applied]);
  useEffect(() => { void load(); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); setApplied({ ...filters }); };

  return <div className="space-y-6">
    <form onSubmit={submit} className={card}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Location area</span><select className={input} value={filters.locationId} onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}>{data?.availableFilters.locations.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.district}</option>) ?? <option value={filters.locationId}>Central Division area · Bengaluru City</option>}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Category</span><select className={input} value={filters.category ?? ""} onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}><option value="">All categories</option>{data?.availableFilters.categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">From</span><input type="date" className={input} value={filters.from ?? ""} onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">To</span><input type="date" className={input} value={filters.to ?? ""} onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })} /></label>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Reset</button><button type="submit" className="h-10 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white">Load intelligence</button></div>
    </form>
    {data && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Sample aggregate location intelligence.</strong><p className="mt-1">{data.explanation}</p>{data.sensitiveReferencesRedacted && <p className="mt-1 font-semibold">Repeat-offender match references are redacted for this role.</p>}</section>}
    {state === "loading" && <div className="h-[480px] animate-pulse rounded-2xl bg-slate-100" aria-label="Loading location detail intelligence" />}
    {(state === "error" || state === "validation-error") && <section className={`${card} text-center`}><h2 className="font-semibold">{state === "validation-error" ? "Check the location filters" : "Unable to load location intelligence"}</h2><p className="mt-2 text-sm text-slate-600">{message}</p>{state === "error" && <button onClick={() => void load()} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Retry</button>}</section>}
    {state === "empty" && <section className={`${card} text-center`}><h2 className="font-semibold">No location intelligence found</h2><p className="mt-2 text-sm text-slate-600">No authorized sample incidents match the selected area, category, and time filters. The map fallback has no aggregate location to display.</p></section>}
    {state === "ready" && data && <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={card}><p className="text-xs font-semibold uppercase text-slate-500">Incident count</p><p className="mt-2 text-3xl font-bold">{data.incidentCount}</p><p className="text-sm text-slate-500">filtered records</p></div>
        <div className={card}><p className="text-xs font-semibold uppercase text-slate-500">Hotspot score</p><p className="mt-2 text-3xl font-bold">{data.hotspot.score}<span className="text-sm text-slate-400">/100</span></p><p className="text-sm text-slate-500">{data.hotspot.level} · {data.hotspot.confidence} confidence</p></div>
        <div className={card}><p className="text-xs font-semibold uppercase text-slate-500">Top category</p><p className="mt-2 text-xl font-bold">{data.topCategories[0]?.category ?? "Unavailable"}</p><p className="text-sm text-slate-500">{data.topCategories[0]?.sharePercent ?? 0}% of filtered incidents</p></div>
        <div className={card}><p className="text-xs font-semibold uppercase text-slate-500">Nearby police station</p><p className="mt-2 text-xl font-bold">{data.location.nearbyPoliceStation}</p><p className="text-sm text-slate-500">{data.location.district}</p></div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><MaskedMap data={data} /><aside className={card}><h2 className="font-bold">Hotspot explanation</h2><p className="mt-2 text-sm leading-6 text-slate-600">{data.hotspot.explanation}</p><ul className="mt-4 space-y-2">{data.hotspot.signals.map((item) => <li key={item} className="rounded-lg bg-slate-50 p-2 text-sm">{item}</li>)}</ul><div className="mt-5 border-t pt-4"><h3 className="font-semibold">Patrol review insight</h3><p className="mt-2 text-sm text-slate-700">{data.patrolInsight.text}</p><p className="mt-2 text-xs leading-5 text-amber-800">{data.patrolInsight.caution}</p><p className="mt-2 text-xs text-slate-500">Sources: {data.patrolInsight.sourceFields.join(", ")}</p></div></aside></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}><h2 className="font-bold">Top categories</h2><div className="mt-4 space-y-3">{data.topCategories.map((item) => <div key={item.category}><div className="flex justify-between text-sm"><span>{item.category}</span><strong>{item.count} · {item.sharePercent}%</strong></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{ width: `${item.sharePercent}%` }} /></div></div>)}</div></section>
        <section className={card}><h2 className="font-bold">Time pattern</h2><div className="mt-4 grid grid-cols-4 gap-3">{data.timePatterns.map((item) => <div key={item.window} className="rounded-lg bg-slate-50 p-3 text-center"><p className="text-xs text-slate-500">{item.window}</p><p className="mt-1 text-xl font-bold">{item.incidentCount}</p><p className="text-xs text-slate-500">{item.sharePercent}%</p></div>)}</div></section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card}><h2 className="font-bold">Repeat offenders linked to area</h2><p className="mt-1 text-xs text-slate-500">Identity groupings require investigator verification and are not evidence.</p><div className="mt-4 space-y-2">{data.repeatOffenders.length ? data.repeatOffenders.map((item, index) => <div key={item.matchReference ?? `restricted-${index}`} className="rounded-lg border border-slate-100 p-3 text-sm"><div className="flex justify-between gap-2"><strong>{item.displayLabel}</strong><span>{item.confidence} confidence</span></div><p className="mt-1 text-slate-500">{item.linkedFirCount} linked FIRs{item.matchReference ? ` · ${item.matchReference}` : ""}</p></div>) : <p className="text-sm text-slate-500">No repeat-offender grouping is linked to the filtered area.</p>}</div></section>
        <section className={`${card} overflow-hidden p-0`}><div className="px-5 py-4"><h2 className="font-bold">Recent FIRs</h2><p className="mt-1 text-xs text-slate-500">Permission-filtered records in the selected area.</p></div><div className="divide-y border-t">{data.recentFirs.map((fir) => <div key={fir.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><div>{fir.detailLinkAllowed ? <Link href={`/fir-search/${fir.id}`} className="font-semibold text-teal-700 hover:underline">{fir.firNumber}</Link> : <span className="font-semibold">{fir.firNumber}</span>}<p className="mt-1 text-xs text-slate-500">{fir.category} · {new Date(fir.incidentAt).toLocaleDateString("en-IN")}</p></div><span className="text-xs text-slate-500">{fir.status}</span></div>)}</div></section>
      </div>
      <section className={card}><h2 className="font-bold">Limitations</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">{data.limitations.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">{data.auditNote}</p>
    </>}
  </div>;
}

export default function LocationDetailIntelligence() {
  return <AppShell title="Location Detail Intelligence" description="Review permission-filtered incident, category, time, station, hotspot, repeat-offender, and recent-FIR context for a selected generalized area." requiredPermission="page:location-detail-intelligence"><DetailContent /></AppShell>;
}
