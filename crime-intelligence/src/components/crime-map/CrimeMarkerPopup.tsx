"use client";

import type { CrimeIncidentFeature } from "@/lib/crime-map/map-types";

export function CrimeMarkerPopup({ incident }: { incident: CrimeIncidentFeature }) {
  const props = incident.properties;
  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-slate-900">{props.firNumber}</div>
      <div className="text-xs text-slate-600">{props.crimeType} · {props.policeStation}</div>
      <div className="text-xs text-slate-500">{props.caseStatus}</div>
    </div>
  );
}
