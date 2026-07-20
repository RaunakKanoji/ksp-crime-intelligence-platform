"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
import { Button, StateNotice, useToast } from "@/components/ui";
import {
  DEFAULT_CRIME_MAP_FILTERS,
  DEFAULT_CRIME_MAP_LAYERS,
  type CrimeIncidentFeature,
  type CrimeIncidentFeatureCollection,
  type CrimeMapFilters as CrimeMapFilterValues,
  type CrimeMapLayerState,
  type HotspotDetectionSummary,
  type HotspotFeature,
  type HotspotFeatureCollection,
  type PatternAlert,
  type PoliceBoundaryFeatureCollection,
} from "@/lib/crime-map/map-types";
import { getCrimeMapBundle } from "@/lib/crime-map/map-api";
import { CrimeMapCanvas } from "./CrimeMapCanvas";
import { CrimeMapFilters } from "./CrimeMapFilters";
import { CrimeMapToolbar } from "./CrimeMapToolbar";
import { CrimeMapIntelPanel } from "./CrimeMapIntelPanel";

type LoadState = "loading" | "refreshing" | "ready" | "empty" | "error";

type MapData = {
  source: "real" | "mock";
  incidents: CrimeIncidentFeatureCollection;
  hotspots: HotspotFeatureCollection;
  alerts: PatternAlert[];
  detection: HotspotDetectionSummary | null;
  boundaries: PoliceBoundaryFeatureCollection;
};

const emptyHotspots: HotspotFeatureCollection = { type: "FeatureCollection", features: [] };
const emptyIncidents: CrimeIncidentFeatureCollection = { type: "FeatureCollection", features: [] };
const emptyBoundaries: PoliceBoundaryFeatureCollection = { type: "FeatureCollection", features: [] };

function CrimeMapIncidentList({
  incidents,
  selectedIncidentId,
  onSelect,
}: {
  incidents: CrimeIncidentFeature[];
  selectedIncidentId: string | null;
  onSelect: (incident: CrimeIncidentFeature) => void;
}) {
  const visibleIncidents = incidents.slice(0, 12);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="map-incident-list-title">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="map-incident-list-title" className="text-sm font-semibold text-slate-950">
            Map incidents list
          </h2>
          <p className="text-sm text-slate-600">
            Keyboard alternative for incidents currently loaded on the map.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Showing {visibleIncidents.length} of {incidents.length}
        </p>
      </div>

      {visibleIncidents.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600">
          No incidents are available for the current map filters.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleIncidents.map((incident) => {
            const active = incident.properties.id === selectedIncidentId;
            return (
              <button
                key={incident.properties.id}
                type="button"
                onClick={() => onSelect(incident)}
                aria-pressed={active}
                className={`rounded-lg border p-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
                  active
                    ? "border-teal-300 bg-teal-50 text-teal-950"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="block font-semibold">{incident.properties.firNumber}</span>
                <span className="mt-1 block text-xs">
                  {incident.properties.crimeType} in {incident.properties.policeStation}
                </span>
                <span className="mt-2 block text-xs">
                  Risk {incident.properties.riskScore}/100, {incident.properties.severity}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CrimeMapContent() {
  const { activeRole } = useAppSession();
  const { notify } = useToast();
  const [draftFilters, setDraftFilters] = useState<Required<CrimeMapFilterValues>>(DEFAULT_CRIME_MAP_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Required<CrimeMapFilterValues>>(DEFAULT_CRIME_MAP_FILTERS);
  const [search, setSearch] = useState("");
  const [layers, setLayers] = useState<CrimeMapLayerState>(DEFAULT_CRIME_MAP_LAYERS);
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<MapData>({
    source: "mock",
    incidents: emptyIncidents,
    hotspots: emptyHotspots,
    alerts: [],
    detection: null,
    boundaries: emptyBoundaries,
  });
  const [selectedIncident, setSelectedIncident] = useState<CrimeIncidentFeature | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotFeature | null>(null);

  const loadData = useCallback(async (filters: CrimeMapFilterValues) => {
    setState((current) => (current === "ready" || current === "empty" ? "refreshing" : "loading"));
    try {
      const bundle = await getCrimeMapBundle(filters, activeRole);
      setData(bundle);
      setState(bundle.incidents.features.length === 0 ? "empty" : "ready");
    } catch {
      setState("error");
      notify({
        tone: "danger",
        title: "Map data could not be refreshed.",
        description: "The current map data remains visible. Try again.",
        persistent: true,
      });
    }
  }, [activeRole, notify]);

  useEffect(() => {
    loadData(appliedFilters);
  }, [appliedFilters, loadData]);

  const applyFilters = useCallback(() => {
    setSelectedIncident(null);
    setSelectedHotspot(null);
    setAppliedFilters({ ...draftFilters, search });
  }, [draftFilters, search]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setDraftFilters(DEFAULT_CRIME_MAP_FILTERS);
    setAppliedFilters(DEFAULT_CRIME_MAP_FILTERS);
    setSelectedIncident(null);
    setSelectedHotspot(null);
  }, []);

  const selectedIncidentId = selectedIncident?.properties.id ?? null;

  const filteredSummary = useMemo(() => ({
    incidents: data.incidents,
    hotspots: data.hotspots,
    alerts: data.alerts,
  }), [data]);

  return (
    <div className="space-y-4">
      <CrimeMapToolbar
        search={search}
        onSearchChange={setSearch}
        onSearch={applyFilters}
        filters={draftFilters}
        onFiltersChange={(filters) => setDraftFilters({ ...draftFilters, ...filters })}
        layers={layers}
        onLayersChange={setLayers}
        source={data.source}
      />

      <StateNotice
        tone={state === "error" ? "error" : state === "refreshing" ? "loading" : state === "empty" ? "empty" : "info"}
        title={
          state === "error"
            ? "Map refresh failed."
            : state === "refreshing"
              ? "Refreshing map layers."
              : state === "empty"
                ? "No incidents in the selected map scope."
                : "Map layers ready."
        }
        description={
          state === "error"
            ? "The current map data remains available. Filters and selected layers were preserved."
            : `Active scope: ${appliedFilters.district === "all" ? "All districts" : appliedFilters.district}, ${appliedFilters.crimeType === "all" ? "all crime types" : appliedFilters.crimeType}, ${appliedFilters.dateFrom} to ${appliedFilters.dateTo}.`
        }
        action={state === "error" ? <Button type="button" onClick={() => void loadData(appliedFilters)}>Retry map refresh</Button> : undefined}
      />

      <div className="grid min-h-0 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)_21rem]">
        <CrimeMapFilters
          filters={draftFilters}
          onChange={setDraftFilters}
          onApply={applyFilters}
          onReset={resetFilters}
        />
        <CrimeMapCanvas
          incidents={data.incidents}
          hotspots={data.hotspots}
          boundaries={data.boundaries}
          layers={layers}
          state={state}
          selectedIncidentId={selectedIncidentId}
          onIncidentSelect={(incident) => {
            setSelectedIncident(incident);
            setSelectedHotspot(null);
          }}
          onHotspotSelect={(hotspot) => {
            setSelectedHotspot(hotspot);
            setSelectedIncident(null);
          }}
        />
        <CrimeMapIntelPanel
          incidents={filteredSummary.incidents}
          hotspots={filteredSummary.hotspots}
          alerts={filteredSummary.alerts}
          detection={data.detection}
          selectedIncident={selectedIncident}
          selectedHotspot={selectedHotspot}
        />
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {selectedIncident
          ? `Selected incident ${selectedIncident.properties.firNumber}, ${selectedIncident.properties.crimeType}.`
          : selectedHotspot
            ? `Selected hotspot ${selectedHotspot.properties.areaName ?? selectedHotspot.properties.h3CellId ?? "identified area"}.`
            : "No map item selected."}
      </div>

      <CrimeMapIncidentList
        incidents={data.incidents.features}
        selectedIncidentId={selectedIncidentId}
        onSelect={(incident) => {
          setSelectedIncident(incident);
          setSelectedHotspot(null);
        }}
      />
    </div>
  );
}

export function CrimeMapPage() {
  return (
    <AppShell
      title="Hotspot Detection"
      description="Score high-crime zones, compare time windows, and review category, district, and station hotspot rankings."
      requiredPermission="page:map"
    >
      <CrimeMapContent />
    </AppShell>
  );
}
