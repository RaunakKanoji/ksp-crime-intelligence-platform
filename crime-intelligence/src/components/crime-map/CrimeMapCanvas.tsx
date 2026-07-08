"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  CrimeIncidentFeature,
  CrimeIncidentFeatureCollection,
  CrimeMapLayerState,
  HotspotFeature,
  HotspotFeatureCollection,
  PoliceBoundaryFeatureCollection,
} from "@/lib/crime-map/map-types";
import { DEFAULT_MAP_CENTER, getMapStyle } from "@/lib/crime-map/layer-config";
import { MapLegend } from "./MapLegend";

type LoadState = "loading" | "ready" | "empty" | "error";

const sourceIds = {
  incidents: "crime-incidents",
  hotspots: "crime-hotspots",
  boundaries: "police-boundaries",
};

const layerIds = {
  heatmap: "crime-heatmap",
  clusters: "crime-clusters",
  clusterCount: "crime-cluster-count",
  incidents: "crime-unclustered",
  hotspotFill: "hotspot-fill",
  hotspotLine: "hotspot-line",
  boundaryFill: "boundary-fill",
  boundaryLine: "boundary-line",
};

function setVisibility(map: Map, layerId: string, visible: boolean) {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  }
}

function getFeatureId(event: MapLayerMouseEvent): string | null {
  const feature = event.features?.[0];
  const id = feature?.properties?.id;
  return typeof id === "string" ? id : null;
}

export function CrimeMapCanvas({
  incidents,
  hotspots,
  boundaries,
  layers,
  state,
  selectedIncidentId,
  onIncidentSelect,
  onHotspotSelect,
}: {
  incidents: CrimeIncidentFeatureCollection;
  hotspots: HotspotFeatureCollection;
  boundaries: PoliceBoundaryFeatureCollection;
  layers: CrimeMapLayerState;
  state: LoadState;
  selectedIncidentId: string | null;
  onIncidentSelect: (incident: CrimeIncidentFeature) => void;
  onHotspotSelect: (hotspot: HotspotFeature) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const incidentSelectRef = useRef(onIncidentSelect);
  const hotspotSelectRef = useRef(onHotspotSelect);
  const incidentsRef = useRef(incidents);
  const hotspotsRef = useRef(hotspots);
  const [loaded, setLoaded] = useState(false);

  incidentSelectRef.current = onIncidentSelect;
  hotspotSelectRef.current = onHotspotSelect;
  incidentsRef.current = incidents;
  hotspotsRef.current = hotspots;

  const selectedFeatureCollection = useMemo<CrimeIncidentFeatureCollection>(() => {
    const feature = incidents.features.find((item) => item.properties.id === selectedIncidentId);
    return { type: "FeatureCollection", features: feature ? [feature] : [] };
  }, [incidents, selectedIncidentId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyle(),
      center: [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat],
      zoom: DEFAULT_MAP_CENTER.zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      map.addSource(sourceIds.incidents, {
        type: "geojson",
        data: incidentsRef.current,
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: 14,
      });

      map.addSource("selected-incident", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addSource(sourceIds.hotspots, {
        type: "geojson",
        data: hotspotsRef.current,
      });

      map.addSource(sourceIds.boundaries, {
        type: "geojson",
        data: boundaries,
      });

      map.addLayer({
        id: layerIds.heatmap,
        type: "heatmap",
        source: sourceIds.incidents,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "riskScore"], 0, 0.2, 100, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 13, 1.8],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 8, 18, 13, 36],
          "heatmap-opacity": 0.72,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(14,116,144,0)",
            0.2,
            "rgba(14,116,144,0.45)",
            0.5,
            "rgba(245,158,11,0.55)",
            0.8,
            "rgba(239,68,68,0.72)",
          ],
        },
      });

      map.addLayer({
        id: layerIds.hotspotFill,
        type: "fill",
        source: sourceIds.hotspots,
        paint: {
          "fill-color": ["case", [">=", ["get", "riskScore"], 81], "#dc2626", [">=", ["get", "riskScore"], 61], "#f59e0b", "#0e7490"],
          "fill-opacity": 0.22,
        },
      });

      map.addLayer({
        id: layerIds.hotspotLine,
        type: "line",
        source: sourceIds.hotspots,
        paint: {
          "line-color": ["case", [">=", ["get", "riskScore"], 81], "#b91c1c", [">=", ["get", "riskScore"], 61], "#b45309", "#0f766e"],
          "line-width": 1.4,
        },
      });

      map.addLayer({
        id: layerIds.boundaryFill,
        type: "fill",
        source: sourceIds.boundaries,
        paint: { "fill-color": "#0e7490", "fill-opacity": 0.06 },
      });

      map.addLayer({
        id: layerIds.boundaryLine,
        type: "line",
        source: sourceIds.boundaries,
        paint: { "line-color": "#0e7490", "line-width": 1.2, "line-dasharray": [2, 1.2] },
      });

      map.addLayer({
        id: layerIds.clusters,
        type: "circle",
        source: sourceIds.incidents,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#0e7490", 4, "#f59e0b", 8, "#dc2626"],
          "circle-radius": ["step", ["get", "point_count"], 17, 4, 22, 8, 28],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addLayer({
        id: layerIds.clusterCount,
        type: "symbol",
        source: sourceIds.incidents,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
        },
        paint: { "text-color": "#ffffff" },
      });

      map.addLayer({
        id: layerIds.incidents,
        type: "circle",
        source: sourceIds.incidents,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["case", [">=", ["get", "riskScore"], 81], "#dc2626", [">=", ["get", "riskScore"], 61], "#f59e0b", "#0f766e"],
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 5, 14, 8],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });

      map.addLayer({
        id: "selected-incident-ring",
        type: "circle",
        source: "selected-incident",
        paint: {
          "circle-radius": 12,
          "circle-color": "rgba(15,118,110,0)",
          "circle-stroke-color": "#0f766e",
          "circle-stroke-width": 3,
        },
      });

      map.on("click", layerIds.clusters, (event) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom: map.getZoom() + 2 });
      });

      map.on("click", layerIds.incidents, (event) => {
        const id = getFeatureId(event);
        const incident = incidentsRef.current.features.find((item) => item.properties.id === id);
        if (incident) incidentSelectRef.current(incident);
      });

      map.on("click", layerIds.hotspotFill, (event) => {
        const id = getFeatureId(event);
        const hotspot = hotspotsRef.current.features.find((item) => item.properties.id === id);
        if (hotspot) hotspotSelectRef.current(hotspot);
      });

      [layerIds.clusters, layerIds.incidents, layerIds.hotspotFill].forEach((layerId) => {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      });

      // Ensure the canvas matches the container once layout has settled.
      map.resize();
      setLoaded(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setLoaded(false);
    };
  }, [boundaries]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const source = mapRef.current.getSource(sourceIds.incidents) as GeoJSONSource | undefined;
    source?.setData(incidents);
  }, [incidents, loaded]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const source = mapRef.current.getSource(sourceIds.hotspots) as GeoJSONSource | undefined;
    source?.setData(hotspots);
  }, [hotspots, loaded]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const source = mapRef.current.getSource("selected-incident") as GeoJSONSource | undefined;
    source?.setData(selectedFeatureCollection);
  }, [selectedFeatureCollection, loaded]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    setVisibility(mapRef.current, layerIds.incidents, layers.incidents);
    setVisibility(mapRef.current, layerIds.clusters, layers.clusters);
    setVisibility(mapRef.current, layerIds.clusterCount, layers.clusters);
    setVisibility(mapRef.current, layerIds.heatmap, layers.heatmap);
    setVisibility(mapRef.current, layerIds.hotspotFill, layers.hotspots);
    setVisibility(mapRef.current, layerIds.hotspotLine, layers.hotspots);
    setVisibility(mapRef.current, layerIds.boundaryFill, layers.boundaries);
    setVisibility(mapRef.current, layerIds.boundaryLine, layers.boundaries);
  }, [layers, loaded]);

  return (
    <section className="relative h-[34rem] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-14.5rem)]">
      {/* maplibre-gl.css forces `.maplibregl-map { position: relative }`, which
          overrides Tailwind's `absolute`; size the container with h/w instead. */}
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
        Bengaluru/Karnataka operational map
      </div>
      <div className="absolute bottom-3 left-3">
        <MapLegend />
      </div>
      {state === "loading" && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-white/60 text-sm font-semibold text-slate-700">
          Loading crime map data...
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-white/75 text-sm font-semibold text-red-700">
          Unable to load map data. Demo data fallback is available after retry.
        </div>
      )}
      {state === "empty" && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-white/75 text-sm font-semibold text-slate-700">
          No incidents match the selected filters.
        </div>
      )}
    </section>
  );
}
