"use client";

import type { CrimeMapLayerState } from "@/lib/crime-map/map-types";

const labels: Record<keyof CrimeMapLayerState, string> = {
  incidents: "Incidents",
  clusters: "Clusters",
  heatmap: "Heatmap",
  hotspots: "Hotspots",
  boundaries: "Boundaries",
};

export function MapLayerToggle({
  layers,
  onChange,
}: {
  layers: CrimeMapLayerState;
  onChange: (layers: CrimeMapLayerState) => void;
}) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Map layers</legend>
      {(Object.keys(layers) as Array<keyof CrimeMapLayerState>).map((key) => (
        <label
          key={key}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
        >
          <input
            type="checkbox"
            checked={layers[key]}
            onChange={(event) => onChange({ ...layers, [key]: event.target.checked })}
            className="h-4 w-4 accent-teal-700"
          />
          {labels[key]}
        </label>
      ))}
    </fieldset>
  );
}
