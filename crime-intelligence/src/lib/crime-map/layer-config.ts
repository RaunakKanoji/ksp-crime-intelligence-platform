import type { StyleSpecification } from "maplibre-gl";

export const DEFAULT_MAP_CENTER = {
  lat: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_LAT ?? 12.9716),
  lng: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_LNG ?? 77.5946),
  zoom: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM ?? 10),
};

export function getMapStyle(): string | StyleSpecification {
  if (process.env.NEXT_PUBLIC_MAP_STYLE_URL) {
    return process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  }

  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
      },
    ],
  };
}
