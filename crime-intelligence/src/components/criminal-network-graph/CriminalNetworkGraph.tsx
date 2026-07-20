"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { fetchNetworkGraph, NetworkGraphApiError } from "@/lib/criminal-network-graph/api";
import type { NetworkEdge, NetworkGraphFilters, NetworkGraphResponse, NetworkNode, NetworkNodeType, NetworkRelationshipType } from "@/lib/criminal-network-graph/types";

type LoadState = "loading" | "ready" | "empty" | "error" | "validation-error";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const NODE_TYPES: NetworkNodeType[] = ["accused", "fir", "location", "category"];
const RELATIONSHIPS: NetworkRelationshipType[] = ["named-in", "associated-with", "occurred-at", "classified-as", "linked-case"];
const DEFAULT_FILTERS: NetworkGraphFilters = { nodeTypes: NODE_TYPES, relationshipTypes: RELATIONSHIPS, maxNodes: 50 };
const colors: Record<NetworkNodeType, string> = { accused: "#0f766e", fir: "#1d4ed8", location: "#b45309", category: "#6d28d9" };

interface PositionedNode extends NetworkNode { x: number; y: number }

function positions(nodes: NetworkNode[]): PositionedNode[] {
  const columns: Record<NetworkNodeType, number> = { accused: 125, fir: 350, location: 575, category: 800 };
  return nodes.map((node) => {
    const peers = nodes.filter((item) => item.type === node.type);
    const index = peers.findIndex((item) => item.id === node.id);
    return { ...node, x: columns[node.type], y: 80 + (index + 1) * (430 / (peers.length + 1)) };
  });
}

function GraphCanvas({ data, selectedId, onSelect }: { data: NetworkGraphResponse; selectedId: string | null; onSelect: (id: string) => void }) {
  const [zoom, setZoom] = useState(1);
  const nodes = useMemo(() => positions(data.nodes), [data.nodes]);
  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  return (
    <section className={`${card} overflow-hidden p-0`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
        <div className="flex flex-wrap gap-3 text-xs">{NODE_TYPES.map((type) => <span key={type} className="flex items-center gap-1.5 capitalize"><i className="h-2.5 w-2.5 rounded-full" style={{ background: colors[type] }} />{type}</span>)}</div>
        <div className="flex items-center gap-2"><button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(.7, value - .1))} className="h-8 w-8 rounded border font-bold">−</button><span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.4, value + .1))} className="h-8 w-8 rounded border font-bold">+</button><button onClick={() => setZoom(1)} className="h-8 rounded border px-2 text-xs font-semibold">Reset</button></div>
      </div>
      <div className="overflow-auto bg-slate-50" style={{ minHeight: 540 }}>
        <svg viewBox="0 0 920 540" role="img" aria-label={`Network graph with ${data.nodes.length} nodes and ${data.edges.length} edges`} className="min-h-[540px] min-w-[800px]" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" /></marker></defs>
          {data.edges.map((edge) => {
            const source = byId.get(edge.source); const target = byId.get(edge.target);
            if (!source || !target) return null;
            const active = selectedId === edge.id;
            return <g key={edge.id} onClick={() => onSelect(edge.id)} className="cursor-pointer" role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") onSelect(edge.id); }}>
              <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={active ? "#0f766e" : "#94a3b8"} strokeWidth={active ? 3 : 1.5} markerEnd="url(#arrow)" />
              <title>{edge.label}: {edge.evidence}</title>
            </g>;
          })}
          {nodes.map((node) => {
            const active = selectedId === node.id;
            return <g key={node.id} transform={`translate(${node.x},${node.y})`} onClick={() => onSelect(node.id)} className="cursor-pointer" role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") onSelect(node.id); }}>
              <circle r={active ? 29 : 24} fill={colors[node.type]} stroke={active ? "#0f172a" : "white"} strokeWidth={active ? 4 : 3} />
              <text y={4} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">{node.degree}</text>
              <text y={42} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="600">{node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}</text>
              <title>{node.label}: {node.subtitle}</title>
            </g>;
          })}
        </svg>
      </div>
    </section>
  );
}

function DetailPanel({ node, edge }: { node?: NetworkNode; edge?: NetworkEdge }) {
  return <aside className={`${card} h-fit`}>
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{node ? `${node.type} node` : edge ? "Relationship edge" : "Graph detail"}</p>
    {!node && !edge ? <p className="mt-3 text-sm text-slate-500">Select a node or edge to inspect its authorized details and relationship basis.</p> : node ? <>
      <h2 className="mt-2 text-lg font-bold">{node.label}</h2><p className="mt-1 text-sm text-slate-600">{node.subtitle}</p>
      <dl className="mt-5 space-y-3 text-sm"><div><dt className="text-slate-500">Stable reference</dt><dd className="font-semibold">{node.id}</dd></div><div><dt className="text-slate-500">Connected edges</dt><dd className="font-semibold">{node.degree}</dd></div></dl>
      {node.href && <Link href={node.href} className="mt-5 inline-flex text-sm font-semibold text-teal-700 hover:underline">Open record →</Link>}
    </> : edge ? <>
      <h2 className="mt-2 text-lg font-bold">{edge.label}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{edge.evidence}</p>
      <dl className="mt-5 space-y-3 text-sm"><div><dt className="text-slate-500">Relationship type</dt><dd className="font-semibold">{edge.relationship}</dd></div><div><dt className="text-slate-500">Source → target</dt><dd className="break-all font-semibold">{edge.source} → {edge.target}</dd></div></dl>
    </> : null}
  </aside>;
}

function GraphContent() {
  const { activeRole } = useAppSession();
  const [filters, setFilters] = useState<NetworkGraphFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<NetworkGraphFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<NetworkGraphResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading"); setMessage(""); setSelectedId(null);
    try {
      const response = await fetchNetworkGraph(applied, activeRole);
      setData(response); setState(response.nodes.length ? "ready" : "empty");
    } catch (error) {
      if (error instanceof NetworkGraphApiError && error.status === 400) { setMessage(error.message); setState("validation-error"); }
      else { setMessage("The network graph could not be loaded safely."); setState("error"); }
    }
  }, [activeRole, applied]);
  useEffect(() => { void load(); }, [load]);
  const toggle = <T extends string>(values: T[] | undefined, value: T) => values?.includes(value) ? values.filter((item) => item !== value) : [...(values ?? []), value];
  const submit = (event: FormEvent) => { event.preventDefault(); setApplied({ ...filters }); };
  const selectedNode = data?.nodes.find((node) => node.id === selectedId);
  const selectedEdge = data?.edges.find((edge) => edge.id === selectedId);

  return <div className="space-y-6">
    <form onSubmit={submit} className={card}>
      <div className="grid gap-4 md:grid-cols-3">
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Node search</span><input className={input} maxLength={80} placeholder="Label or stable reference" value={filters.search ?? ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">District</span><select className={input} value={filters.district ?? ""} onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined })}><option value="">All districts</option>{data?.availableFilters.districts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-slate-600">Performance node limit</span><input type="number" min={5} max={100} className={input} value={filters.maxNodes ?? 50} onChange={(e) => setFilters({ ...filters, maxNodes: Number(e.target.value) })} /></label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <fieldset><legend className="text-xs font-semibold text-slate-600">Node types</legend><div className="mt-2 flex flex-wrap gap-3">{NODE_TYPES.map((type) => <label key={type} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" checked={filters.nodeTypes?.includes(type)} onChange={() => setFilters({ ...filters, nodeTypes: toggle(filters.nodeTypes, type) })} />{type}</label>)}</div></fieldset>
        <fieldset><legend className="text-xs font-semibold text-slate-600">Relationship types</legend><div className="mt-2 flex flex-wrap gap-3">{RELATIONSHIPS.map((type) => <label key={type} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.relationshipTypes?.includes(type)} onChange={() => setFilters({ ...filters, relationshipTypes: toggle(filters.relationshipTypes, type) })} />{type.replaceAll("-", " ")}</label>)}</div></fieldset>
      </div>
      <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Reset</button><button type="submit" className="h-10 rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white">Apply filters</button></div>
    </form>
    {data && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Sample relationship data.</strong><p className="mt-1">{data.explanation}</p><p className="mt-1">{data.limitation}</p>{data.accusedLabelsRedacted && <p className="mt-1 font-semibold">Accused labels and profile links are restricted for this role.</p>}{data.truncated && <p className="mt-1 font-semibold">Result limited to {applied.maxNodes} of {data.totalNodesBeforeLimit} matching nodes.</p>}</div>}
    {state === "loading" && <div className="h-[540px] animate-pulse rounded-2xl bg-slate-100" aria-label="Loading criminal network graph" />}
    {(state === "error" || state === "validation-error") && <section className={`${card} text-center`}><h2 className="font-semibold">{state === "validation-error" ? "Check the graph filters" : "Unable to load graph"}</h2><p className="mt-2 text-sm text-slate-600">{message}</p>{state === "error" && <button onClick={() => void load()} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Retry</button>}</section>}
    {state === "empty" && <section className={`${card} text-center`}><h2 className="font-semibold">No network data matches</h2><p className="mt-2 text-sm text-slate-600">No authorized nodes match the active search, district, node-type, and relationship filters.</p></section>}
    {state === "ready" && data && <><div className="flex flex-wrap justify-between gap-2 text-sm text-slate-500"><span>{data.nodes.length} nodes · {data.edges.length} edges</span><span>Select nodes or edges for details</span></div><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><GraphCanvas data={data} selectedId={selectedId} onSelect={setSelectedId} /><DetailPanel node={selectedNode} edge={selectedEdge} /></div><p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">{data.auditNote}</p></>}
  </div>;
}

export default function CriminalNetworkGraph() {
  return <AppShell title="Criminal Network Graph" description="Visualize permission-filtered relationships between accused persons, FIRs, generalized locations, and crime categories." requiredPermission="page:criminal-network-graph"><GraphContent /></AppShell>;
}
