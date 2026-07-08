"use client";

import type {
  CrimeIncidentFeature,
  CrimeIncidentFeatureCollection,
  HotspotFeature,
  HotspotFeatureCollection,
  HotspotDetectionSummary,
  PatternAlert,
} from "@/lib/crime-map/map-types";
import { maxRiskIncident, topCrimeType } from "@/lib/crime-map/map-utils";

function SeverityBadge({ severity }: { severity: string }) {
  const tone =
    severity === "critical"
      ? "border-red-200 bg-red-50 text-red-700"
      : severity === "high"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : severity === "medium"
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-slate-50 text-slate-600";
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`}>{severity}</span>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

export function CrimeMapIntelPanel({
  incidents,
  hotspots,
  alerts,
  detection,
  selectedIncident,
  selectedHotspot,
}: {
  incidents: CrimeIncidentFeatureCollection;
  hotspots: HotspotFeatureCollection;
  alerts: PatternAlert[];
  detection: HotspotDetectionSummary | null;
  selectedIncident: CrimeIncidentFeature | null;
  selectedHotspot: HotspotFeature | null;
}) {
  const highestRisk = maxRiskIncident(incidents.features);

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:h-[calc(100vh-14.5rem)] lg:overflow-y-auto">
      <h2 className="text-sm font-semibold text-slate-900">Hotspot Detection</h2>

      <div className="mt-4 space-y-4">
        {selectedIncident ? (
          <section className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">{selectedIncident.properties.firNumber}</h3>
                <p className="mt-1 text-sm text-slate-600">{selectedIncident.properties.crimeType}</p>
              </div>
              <SeverityBadge severity={selectedIncident.properties.severity} />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-xs uppercase text-slate-400">District</dt><dd>{selectedIncident.properties.district}</dd></div>
              <div><dt className="text-xs uppercase text-slate-400">Police station</dt><dd>{selectedIncident.properties.policeStation}</dd></div>
              <div><dt className="text-xs uppercase text-slate-400">Incident datetime</dt><dd>{new Date(selectedIncident.properties.incidentDateTime).toLocaleString("en-IN")}</dd></div>
              <div><dt className="text-xs uppercase text-slate-400">Case status</dt><dd>{selectedIncident.properties.caseStatus}</dd></div>
              <div><dt className="text-xs uppercase text-slate-400">Risk score</dt><dd>{selectedIncident.properties.riskScore}/100</dd></div>
              <div><dt className="text-xs uppercase text-slate-400">Address</dt><dd>{selectedIncident.properties.addressText ?? "Area-level location"}</dd></div>
              <div><dt className="text-xs uppercase text-slate-400">Modus operandi summary</dt><dd>{selectedIncident.properties.modusOperandi ?? "Pattern detected from safe incident attributes."}</dd></div>
            </dl>
            <button type="button" className="mt-4 h-10 w-full rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Open case
            </button>
          </section>
        ) : selectedHotspot ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-amber-950">{selectedHotspot.properties.areaName ?? selectedHotspot.properties.h3CellId ?? "Hotspot identified"}</h3>
                <p className="mt-1 text-sm text-amber-900">Hotspot identified for area-level operational review.</p>
              </div>
              <SeverityBadge severity={selectedHotspot.properties.severity} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-amber-950">
              <div><dt className="text-xs uppercase text-amber-700">Risk score</dt><dd>{selectedHotspot.properties.riskScore}/100</dd></div>
              <div><dt className="text-xs uppercase text-amber-700">Incidents</dt><dd>{selectedHotspot.properties.incidentCount}</dd></div>
              <div><dt className="text-xs uppercase text-amber-700">Dominant</dt><dd>{selectedHotspot.properties.dominantCrimeType}</dd></div>
              <div><dt className="text-xs uppercase text-amber-700">Trend</dt><dd>{selectedHotspot.properties.trend}</dd></div>
              <div><dt className="text-xs uppercase text-amber-700">Peak time</dt><dd>{selectedHotspot.properties.peakTimeWindow ?? "Mixed"}</dd></div>
              <div><dt className="text-xs uppercase text-amber-700">Related cases</dt><dd>{selectedHotspot.properties.incidentCount}</dd></div>
              <div><dt className="text-xs uppercase text-amber-700">Confidence</dt><dd>{selectedHotspot.properties.confidence}</dd></div>
            </dl>
            <p className="mt-3 text-sm text-amber-900">{selectedHotspot.properties.explanation}</p>
            <div className="mt-3 rounded-lg border border-amber-200 bg-white/60 p-3 text-xs text-amber-950">
              <div className="font-semibold">Scoring signals</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <span>Frequency: {selectedHotspot.properties.scoringSignals.frequencyScore}</span>
                <span>Severity: {selectedHotspot.properties.scoringSignals.severityScore}</span>
                <span>Growth: {selectedHotspot.properties.scoringSignals.recentGrowthScore}</span>
                <span>Time: {selectedHotspot.properties.scoringSignals.timePatternScore}</span>
                <span className="col-span-2">Repeat pattern: {selectedHotspot.properties.scoringSignals.repeatPatternScore}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-amber-900">Suggested operational review: compare patrol timing, nearby CCTV coverage, and recent FIR similarity.</p>
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-3">
            <Stat label="Total incidents" value={incidents.features.length} />
            <Stat label="Active hotspots" value={hotspots.features.length} />
            <Stat label="Critical alerts" value={alerts.filter((alert) => alert.severity === "critical").length} />
            <Stat label="Top crime type" value={topCrimeType(incidents.features)} />
            <div className="col-span-2">
              <Stat label="Highest risk area" value={highestRisk?.properties.policeStation ?? "None"} />
            </div>
          </section>
        )}

        {detection && (
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Hotspot logic</h3>
            <p className="mt-2 text-xs text-slate-600">{detection.scoringFormula}</p>
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              Human review required. This does not predict individual behavior or determine guilt.
            </div>
          </section>
        )}

        {detection && (
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">District ranking</h3>
            <div className="mt-3 space-y-2">
              {detection.districtRankings.map((item) => (
                <div key={item.name} className="grid grid-cols-[1fr_auto] gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <div>
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.dominantCrimeType} · {item.incidentCount} incidents</div>
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-900">{item.averageRiskScore}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {detection && (
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Police station ranking</h3>
            <div className="mt-3 space-y-2">
              {detection.policeStationRankings.slice(0, 5).map((item) => (
                <div key={item.name} className="grid grid-cols-[1fr_auto] gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <div>
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.hotspotCount} hotspots · {item.highestSeverity}</div>
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-900">{item.averageRiskScore}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {detection && (
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Time-window analysis</h3>
            <div className="mt-3 space-y-2">
              {detection.timeWindows.map((item) => (
                <div key={item.window} className="grid grid-cols-[5rem_1fr_2.5rem] items-center gap-2 text-xs">
                  <span className="capitalize text-slate-600">{item.window}</span>
                  <span className="h-2 rounded-full bg-slate-100">
                    <span className="block h-2 rounded-full bg-teal-700" style={{ width: `${Math.min(100, item.incidentCount * 8)}%` }} />
                  </span>
                  <span className="text-right font-semibold">{item.incidentCount}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {detection && (
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Category-based hotspots</h3>
            <div className="mt-3 space-y-2">
              {detection.categoryHotspots.slice(0, 5).map((item) => (
                <div key={item.crimeType} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <div>
                    <div className="font-semibold text-slate-900">{item.crimeType}</div>
                    <div className="text-xs text-slate-500">{item.incidentCount} incidents · {item.hotspotCount} hotspots</div>
                  </div>
                  <span className="font-semibold text-slate-900">{item.averageRiskScore}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Pattern alerts</h3>
          <div className="mt-3 space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500">No spike observed for the active filters.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900">{alert.title}</span>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                  <p className="mt-1 text-slate-600">{alert.description}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
