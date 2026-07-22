"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { LngLatBounds, Map as MapLibreMap, Marker } from "maplibre-gl";

import { mapStyleUrl } from "@/lib/map/config";
import {
  getTrailNavigationBounds,
  type TrailNavigationBounds,
} from "@/lib/map/trail-bounds";
import type { Coordinate, TrailFeature } from "@/types/trail";

const MAP_MIN_ZOOM = 13;
const MAP_MAX_ZOOM = 21;
const HIKER_RECENTER_INTERVAL_MS = 10_000;

const getHikerRecenteringOffset = (): [number, number] => {
  if (
    typeof window === "undefined" ||
    !window.matchMedia("(max-width: 820px) and (orientation: portrait)").matches
  ) {
    return [0, 0];
  }

  const sheetHeight = document
    .querySelector<HTMLElement>(".expedition-sidebar")
    ?.getBoundingClientRect().height;
  return [0, -Math.round((sheetHeight ?? window.innerHeight * 0.46) / 2)];
};

export type MapCheckpoint = {
  id: string;
  name: string;
  coordinate: Coordinate;
};

export type MountainMapHandle = {
  fitTrail: () => void;
  resetCamera: () => void;
};

type MountainMapProps = {
  feature: TrailFeature;
  coordinate: Coordinate;
  progress: number;
  checkpoints: MapCheckpoint[];
  reachedCheckpointIds: string[];
  hikerAvatarUrl: string | null;
  navigationBounds?: TrailNavigationBounds;
  onUnavailable: (reason: string) => void;
};

export const MountainMap = forwardRef<MountainMapHandle, MountainMapProps>(
  function MountainMap(
    {
      feature,
      coordinate,
      progress,
      checkpoints,
      reachedCheckpointIds,
      hikerAvatarUrl,
      navigationBounds,
      onUnavailable,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const boundsRef = useRef<LngLatBounds | null>(null);
    const hikerMarkerRef = useRef<Marker | null>(null);
    const hikerElementRef = useRef<HTMLDivElement | null>(null);
    const staticMarkersRef = useRef<Marker[]>([]);
    const checkpointElementsRef = useRef(new Map<string, HTMLDivElement>());
    const onUnavailableRef = useRef(onUnavailable);
    const initialCoordinateRef = useRef(coordinate);
    const coordinateRef = useRef(coordinate);
    const progressRef = useRef(progress);
    const reachedCheckpointIdsRef = useRef(reachedCheckpointIds);
    const hikerAvatarUrlRef = useRef(hikerAvatarUrl);
    progressRef.current = progress;
    coordinateRef.current = coordinate;
    reachedCheckpointIdsRef.current = reachedCheckpointIds;
    hikerAvatarUrlRef.current = hikerAvatarUrl;

    useEffect(() => {
      onUnavailableRef.current = onUnavailable;
    }, [onUnavailable]);

    useImperativeHandle(ref, () => ({
      fitTrail: () => {
        if (mapRef.current && boundsRef.current) {
          mapRef.current.fitBounds(boundsRef.current, {
            padding: 80,
            duration: 650,
          });
        }
      },
      resetCamera: () => {
        if (mapRef.current && boundsRef.current) {
          mapRef.current.fitBounds(boundsRef.current, {
            padding: 80,
            bearing: 0,
            pitch: 0,
            duration: 650,
          });
        }
      },
    }));

    useEffect(() => {
      let disposed = false;
      const checkpointElements = checkpointElementsRef.current;

      void import("maplibre-gl")
        .then(({ default: maplibregl }) => {
          if (disposed || !containerRef.current) return;

          const start = feature.geometry.coordinates[0] as Coordinate;
          const end = feature.geometry.coordinates.at(-1) as Coordinate;
          const bounds = feature.geometry.coordinates.reduce(
            (currentBounds, point) => currentBounds.extend(point as Coordinate),
            new maplibregl.LngLatBounds(start, start),
          );
          const constrainedBounds =
            navigationBounds ??
            getTrailNavigationBounds(
              feature.geometry.coordinates as Coordinate[],
            );
          boundsRef.current = bounds;

          const map = new maplibregl.Map({
            container: containerRef.current,
            style: mapStyleUrl,
            bounds,
            maxBounds: constrainedBounds,
            minZoom: MAP_MIN_ZOOM,
            maxZoom: MAP_MAX_ZOOM,
            renderWorldCopies: false,
            fitBoundsOptions: { padding: 80 },
            attributionControl: false,
          });
          mapRef.current = map;
          map.addControl(
            new maplibregl.NavigationControl({ showCompass: false }),
            "top-right",
          );

          map.once("load", () => {
            if (disposed) return;
            map.addSource("summitodoro-trail", {
              type: "geojson",
              data: feature,
              lineMetrics: true,
            });
            map.addLayer({
              id: "trail-shadow",
              type: "line",
              source: "summitodoro-trail",
              paint: {
                "line-color": "#153c2a",
                "line-width": 9,
                "line-opacity": 0.18,
              },
            });
            map.addLayer({
              id: "trail-remaining",
              type: "line",
              source: "summitodoro-trail",
              paint: {
                "line-color": "#a8b0aa",
                "line-width": 5,
                "line-opacity": 0.9,
                "line-dasharray": [1.5, 1],
              },
            });
            map.addLayer({
              id: "trail-completed",
              type: "line",
              source: "summitodoro-trail",
              paint: {
                "line-width": 6,
                "line-opacity": 1,
                "line-gradient": [
                  "step",
                  ["line-progress"],
                  "#0aa256",
                  Math.max(0.0001, progressRef.current),
                  "rgba(10, 162, 86, 0)",
                ],
              },
            });
            // Keep the summit as a map-native feature rather than an HTML
            // marker. MapLibre reprojects this source with the trail on every
            // camera change, so it cannot drift from Pulag's endpoint when the
            // route is fitted or the user zooms out.
            map.addSource("summitodoro-summit", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Point",
                  coordinates: end,
                },
              },
            });
            map.addLayer({
              id: "summit-marker-base",
              type: "circle",
              source: "summitodoro-summit",
              paint: {
                "circle-radius": 15,
                "circle-color": "#0aa256",
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 3,
                "circle-opacity": 1,
              },
            });
            map.addLayer({
              id: "summit-marker-icon",
              type: "symbol",
              source: "summitodoro-summit",
              layout: {
                "text-field": "▲",
                "text-size": 10,
                "text-anchor": "center",
              },
              paint: {
                "text-color": "#ffffff",
              },
            });
            map.addLayer({
              id: "summit-marker-label",
              type: "symbol",
              source: "summitodoro-summit",
              layout: {
                "text-field": "SUMMIT",
                "text-size": 6,
                "text-letter-spacing": 0.05,
                "text-offset": [0, 3.5],
                "text-anchor": "top",
              },
              paint: {
                "text-color": "#515952",
                "text-halo-color": "rgba(255, 255, 253, 0.94)",
                "text-halo-width": 3,
              },
            });

            const addStaticMarker = (
              markerCoordinate: Coordinate,
              kind: "trailhead" | "checkpoint" | "summit",
              label: string,
              id?: string,
            ) => {
              const element = document.createElement("div");
              element.className = `trail-map-marker ${kind}`;
              if (id && reachedCheckpointIdsRef.current.includes(id)) {
                element.classList.add("reached");
              }
              element.setAttribute("aria-label", label);
              if (id) element.dataset.checkpointId = id;
              const icon = document.createElement("span");
              icon.textContent =
                kind === "trailhead" ? "●" : kind === "summit" ? "▲" : "◆";
              const caption = document.createElement("small");
              caption.textContent = label;
              element.append(icon, caption);
              if (id) checkpointElements.set(id, element);
              staticMarkersRef.current.push(
                new maplibregl.Marker({ element, anchor: "center" })
                  .setLngLat(markerCoordinate)
                  .addTo(map),
              );
            };

            addStaticMarker(start, "trailhead", "Trailhead");
            checkpoints.forEach((checkpoint) =>
              addStaticMarker(
                checkpoint.coordinate,
                "checkpoint",
                checkpoint.name,
                checkpoint.id,
              ),
            );
            const hikerElement = document.createElement("div");
            hikerElement.className = "map-hiker-marker";
            hikerElement.setAttribute("aria-label", "Virtual hiker position");
            hikerElement.classList.toggle(
              "has-avatar",
              Boolean(hikerAvatarUrlRef.current),
            );
            hikerElement.style.backgroundImage = hikerAvatarUrlRef.current
              ? `url("${hikerAvatarUrlRef.current}")`
              : "";
            hikerElement.textContent = hikerAvatarUrlRef.current ? "" : "🥾";
            hikerElementRef.current = hikerElement;
            hikerMarkerRef.current = new maplibregl.Marker({
              element: hikerElement,
            })
              .setLngLat(initialCoordinateRef.current)
              .addTo(map);

            window.requestAnimationFrame(() => {
              if (disposed) return;
              map.easeTo({
                center: coordinateRef.current,
                offset: getHikerRecenteringOffset(),
                duration: 0,
                essential: true,
              });
            });
          });

          map.on("error", (event) => {
            if (!map.loaded()) {
              onUnavailableRef.current(
                event.error?.message ?? "The map could not load.",
              );
            }
          });
        })
        .catch((error: unknown) =>
          onUnavailableRef.current(
            error instanceof Error
              ? error.message
              : "The map library could not be loaded.",
          ),
        );

      return () => {
        disposed = true;
        hikerMarkerRef.current?.remove();
        staticMarkersRef.current.forEach((marker) => marker.remove());
        mapRef.current?.remove();
        hikerMarkerRef.current = null;
        hikerElementRef.current = null;
        staticMarkersRef.current = [];
        checkpointElements.clear();
        mapRef.current = null;
        boundsRef.current = null;
      };
    }, [checkpoints, feature, navigationBounds]);

    useEffect(() => {
      hikerMarkerRef.current?.setLngLat(coordinate);
    }, [coordinate]);

    useEffect(() => {
      const hikerElement = hikerElementRef.current;
      if (!hikerElement) return;

      hikerElement.classList.toggle("has-avatar", Boolean(hikerAvatarUrl));
      hikerElement.style.backgroundImage = hikerAvatarUrl
        ? `url("${hikerAvatarUrl}")`
        : "";
      hikerElement.textContent = hikerAvatarUrl ? "" : "🥾";
    }, [hikerAvatarUrl]);

    useEffect(() => {
      const interval = window.setInterval(() => {
        const map = mapRef.current;
        if (!map?.isStyleLoaded()) return;

        map.easeTo({
          center: coordinateRef.current,
          offset: getHikerRecenteringOffset(),
          duration: 800,
          essential: true,
        });
      }, HIKER_RECENTER_INTERVAL_MS);

      return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
      const map = mapRef.current;
      if (map?.getLayer("trail-completed")) {
        map.setPaintProperty("trail-completed", "line-gradient", [
          "step",
          ["line-progress"],
          "#0aa256",
          Math.max(0.0001, progress),
          "rgba(10, 162, 86, 0)",
        ]);
      }
    }, [progress]);

    useEffect(() => {
      const reached = new Set(reachedCheckpointIds);
      checkpointElementsRef.current.forEach((element, id) => {
        element.classList.toggle("reached", reached.has(id));
      });
    }, [reachedCheckpointIds]);

    return (
      <div
        ref={containerRef}
        className="map-canvas"
        aria-label="Map showing the virtual trail"
      />
    );
  },
);
