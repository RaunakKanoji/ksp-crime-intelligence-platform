"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { fetchGeospatialClusters, GeospatialClusterApiError } from "@/lib/geospatial-cluster-analysis/api";
import type { GeospatialCluster, GeospatialClusterFilters, GeospatialClusterResponse } from "@/lib/geospatial-cluster-analysis/types";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const DEFAULT_FILTERS: GeospatialClusterFilters = { radiusKm: 5, minimumPoints: 2 };

function ClusterMap({ clusters, selectedId, onSelect }: { clusters: GeospatialCluster[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const x = (longitude: number) => 40 + (longitude - 74) / 4 * 720;
  const y = (latitude: number) => 440 - (latitude - 12) / 6 * 390;
  return <section className={`${card} overflow-hidden p-0`}>
    <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 px-5 py-3"><div><h2 className="font-semibold">Aggregated cluster map</h2><p className="text-xs text-slate-500">Provider-free SVG fallback · district-scale rounded centers</p></div><div className="flex gap-3 text-xs"><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-teal-700" />Low/medium</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" />High risk</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-red-600" />Critical risk</span></div></div>
    <div className="overflow-auto bg-slate-50">
      <svg viewBox="0 0 800 480" className="min-h-[480px] min-w-[700px]" role="img" aria-label={`Map showing ${clusters.length} masked geospatial clusters`}>
        <rect x="40" y="30" width="720" height="410" rx="16" fill="#f8fafc" stroke="#cbd5e1" />
        {[1, 2, 3, 4, 5].map((line) => <line key={`h${line}`} x1="40" x2="760" y1={30 + line * 68} y2={30 + line * 68} stroke="#e2e8f0" />)}
        {[1, 2, 3, 4, 5, 6, 7].map((line) => <line key={`v${line}`} y1="30" y2="440" x1={40 + line * 90} x2={40 + line * 90} stroke="#e2e8f0" />)}
        <text x="55" y="55" fill="#64748b" fontSize="12">Karnataka sample extent (schematic)</text>
        {clusters.map((cluster) => {
          const active = cluster.id === selectedId;
          const color = cluster.highestSeverity === "critical" ? "#dc2626" : cluster.highestSeverity === "high" ? "#f59e0b" : "#0f766e";
          return <g key={cluster.id} transform={`translate(${x(cluster.center[0])},${y(cluster.center[1])})`} className="cursor-pointer" onClick={() => onSelect(cluster.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") onSelect(cluster.id); }}>
            <circle r={Math.min(42, 16 + cluster.incidentCount * 4)} fill={color} fillOpacity=".25" stroke={color} strokeWidth={active ? 4 : 2} />
            <circle r="12" fill={color} /><text y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">{cluster.incidentCount}</text>
            <text y={Math.min(42, 16 + cluster.incidentCount * 4) + 16} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="600">{cluster.district}</text>
            <title>{cluster.id}: {cluster.incidentCount} incidents, {cluster.dominantCategory}</title>
          </g>;
        })}
      </svg>
    </div>
  </section>;
}

function ClusterDetail({ cluster }: { cluster?: GeospatialCluster }) {
  return <aside className={`${card} h-fit`}>
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Cluster detail</p>
    {!cluster ? <p className="mt-3 text-sm text-slate-500">Select a cluster on the map to inspect its authorized aggregate details.</p> : <>
      <h2 className="mt-1 text-lg font-bold">{cluster.id}</h2><p className="mt-1 text-sm text-slate-500">{cluster.district} · {cluster.stations.join(", ")}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-500">Incidents</dt><dd className="font-bold">{cluster.incidentCount}</dd></div><div><dt className="text-slate-500">Confidence</dt><dd className="font-bold">{cluster.confidence}</dd></div><div><dt className="text-slate-500">Dominant category</dt><dd className="font-bold">{cluster.dominantCategory}</dd></div><div><dt className="text-slate-500">Average risk</dt><dd className="font-bold">{cluster.averageRiskScore}/100</dd></div><div><dt className="text-slate-500">Masked center</dt><dd className="font-bold">{cluster.center[1]}, {cluster.center[0]}</dd></div><div><dt className="text-slate-500">Precision</dt><dd className="font-bold">{cluster.precision}</dd></div></dl>
      <p className="mt-4 text-sm leading-6 text-slate-600">{cluster.explanation}</p>
      <div className="mt-4"><h3 className="text-xs font-semibold uppercase text-slate-500">Category distribution</h3><ul className="mt-2 space-y-2">{cluster.categoryDistribution.map((item) => <li key={item.category} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>{item.category}</span><strong>{item.count}</strong></li>)}</ul></div>
      <p className="mt-4 text-xs text-slate-500">{new Date(cluster.firstIncidentAt).toLocaleDateString("en-IN")} – {new Date(cluster.lastIncidentAt).toLocaleDateString("en-IN")}</p>
    </>}
  </aside>;
}

function AnalysisContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<GeospatialClusterFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<GeospatialClusterFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<GeospatialClusterResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setState("loading"); setMessage("");
    try {
      const response = await fetchGeospatialClusters(applied, activeRole);
      setData(response); setSelectedId(response.clusters[0]?.id ?? null); setState(response.clusters.length ? "ready" : "empty");
    } catch (error) {
      if (error instanceof GeospatialClusterApiError && error.status === 400) { setMessage(error.message); setState("validation-error"); }
      else { setMessage("The cluster-analysis service could not be reached safely."); setState("error"); }
    }
  }, [activeRole, applied]);
  useEffect(() => { void load(); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); setApplied({ ...filters }); };
  const selected = data?.clusters.find((cluster) => cluster.id === selectedId);

  return <div className="space-y-6">
    <form onSubmit={submit} className={card}>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Radius (km)</span><input type="number" min=".5" max="25" step=".5" className={input} value={filters.radiusKm ?? 5} onChange={(e) => setFilters({ ...filters, radiusKm: Number(e.target.value) })} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Minimum points</span><input type="number" min="2" max="10" className={input} value={filters.minimumPoints ?? 2} onChange={(e) => setFilters({ ...filters, minimumPoints: Number(e.target.value) })} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Category</span><select className={input} value={filters.category ?? ""} onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}><option value="">All categories</option>{data?.availableFilters.categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">District</span><select className={input} value={filters.district ?? ""} onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined, boundaryId: undefined })}><option value="">All districts</option>{data?.availableFilters.districts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Boundary</span><select className={input} value={filters.boundaryId ?? ""} onChange={(e) => setFilters({ ...filters, boundaryId: e.target.value || undefined })}><option value="">All available boundaries</option>{data?.availableFilters.boundaries.filter((item) => !filters.district || item.district === filters.district).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">From</span><input type="date" className={input} value={filters.from ?? ""} onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">To</span><input type="date" className={input} value={filters.to ?? ""} onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })} /></label>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Reset</button><button type="submit" className="h-10 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white">Analyze clusters</button></div>
    </form>
    {data && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Sample aggregate geospatial data.</strong><p className="mt-1">{data.algorithm.name}: {data.algorithm.radiusKm} km radius, minimum {data.algorithm.minimumPoints} points. Raw incident coordinates and exact addresses are not returned.</p><p className="mt-1">{data.filteredIncidentCount} filtered incidents · {data.total} clusters · {data.unclusteredIncidentCount} unclustered.</p></section>}
    {state === "loading" && <div className="h-[520px] animate-pulse rounded-2xl bg-slate-100" aria-label="Loading geospatial cluster analysis" />}
    {(state === "error" || state === "validation-error") && <section className={`${card} text-center`}><h2 className="font-semibold">{state === "validation-error" ? "Check the cluster filters" : "Unable to analyze clusters"}</h2><p className="mt-2 text-sm text-slate-600">{message}</p>{state === "error" && <button onClick={() => void load()} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Retry</button>}</section>}
    {state === "empty" && <section className={`${card} text-center`}><h2 className="font-semibold">No clusters found</h2><p className="mt-2 text-sm text-slate-600">No authorized sample incident groups meet the active radius, minimum-point, boundary, category, and time filters. The map fallback has no cluster geometry to display.</p></section>}
    {state === "ready" && data && <><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"><ClusterMap clusters={data.clusters} selectedId={selectedId} onSelect={setSelectedId} /><ClusterDetail cluster={selected} /></div><section className={card}><h2 className="font-bold">Algorithm notes and limitations</h2><div className="mt-3 grid gap-5 lg:grid-cols-2"><ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">{data.algorithm.notes.map((item) => <li key={item}>{item}</li>)}</ol><ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">{data.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div></section><p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">{data.auditNote}</p></>}
  </div>;
}

export default function GeospatialClusterAnalysis() {
  return <AppShell title="Geospatial Cluster Analysis" description="Analyze permission-filtered spatial incident concentration with configurable radius, category, boundary, and time controls." requiredPermission="page:geospatial-cluster-analysis"><AnalysisContent /></AppShell>;
}
