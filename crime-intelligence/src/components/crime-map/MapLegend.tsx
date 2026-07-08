"use client";

export function MapLegend() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 p-3 text-xs text-slate-600 shadow-sm">
      <div className="font-semibold text-slate-900">Legend</div>
      <div className="mt-2 grid gap-1">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-teal-700" /> Incident marker</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cyan-700" /> Cluster</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Hotspot identified</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Heat intensity</span>
      </div>
    </div>
  );
}
