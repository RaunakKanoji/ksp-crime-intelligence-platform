"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell, useAppSession } from "@/components/layout/AppShell";
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
import { MOCK_CRIME_INCIDENTS, MOCK_POLICE_BOUNDARIES } from "@/lib/crime-map/mock-crime-data";
import { CrimeMapCanvas } from "./CrimeMapCanvas";
import { CrimeMapFilters } from "./CrimeMapFilters";
import { CrimeMapToolbar } from "./CrimeMapToolbar";
import { CrimeMapIntelPanel } from "./CrimeMapIntelPanel";

type LoadState = "loading" | "ready" | "empty" | "error";

type MapData = {
  source: "real" | "mock";
  incidents: CrimeIncidentFeatureCollection;
  hotspots: HotspotFeatureCollection;
  alerts: PatternAlert[];
  detection: HotspotDetectionSummary | null;
  boundaries: PoliceBoundaryFeatureCollection;
};

const emptyHotspots: HotspotFeatureCollection = { type: "FeatureCollection", features: [] };

function CrimeMapContent() {
  const { activeRole } = useAppSession();
  const [draftFilters, setDraftFilters] = useState<Required<CrimeMapFilterValues>>(DEFAULT_CRIME_MAP_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Required<CrimeMapFilterValues>>(DEFAULT_CRIME_MAP_FILTERS);
  const [search, setSearch] = useState("");
  const [layers, setLayers] = useState<CrimeMapLayerState>(DEFAULT_CRIME_MAP_LAYERS);
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<MapData>({
    source: "mock",
    incidents: MOCK_CRIME_INCIDENTS,
    hotspots: emptyHotspots,
    alerts: [],
    detection: null,
    boundaries: MOCK_POLICE_BOUNDARIES,
  });
  const [selectedIncident, setSelectedIncident] = useState<CrimeIncidentFeature | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotFeature | null>(null);

  const loadData = useCallback(async (filters: CrimeMapFilterValues) => {
    setState("loading");
    try {
      const bundle = await getCrimeMapBundle(filters, activeRole);
      setData(bundle);
      setState(bundle.incidents.features.length === 0 ? "empty" : "ready");
    } catch {
      setState("error");
    }
  }, [activeRole]);

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
