"use client";

import { useEffect } from "react";
import L from "leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { setWorkerUrl } from "maplibre-gl";
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, Tooltip, useMap, ZoomControl } from "react-leaflet";
import { Device } from "@/lib/devices";
import { MAINTENANCE_BASE, RouteResult, UserLocation } from "@/lib/routing";

if (typeof window !== "undefined") {
  setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());
}

const INITIAL_CENTER: [number, number] = [MAINTENANCE_BASE.lat, MAINTENANCE_BASE.long];

function MapController({
  focus,
  focusBase,
  focusLocation,
  userLocation,
  route,
}: {
  focus: Device | null;
  focusBase: boolean;
  focusLocation: boolean;
  userLocation: UserLocation | null;
  route: RouteResult | null;
}) {
  const map = useMap();
  const focusId = focus?.id_dispositivo;
  const focusLat = focus?.lat;
  const focusLong = focus?.long;
  const userLat = userLocation?.lat;
  const userLong = userLocation?.long;

  useEffect(() => {
    if (route?.positions.length) {
      map.fitBounds(route.positions, { padding: [35, 35] });
      return;
    }
    if (focusBase) {
      map.flyTo(INITIAL_CENTER, 16, { duration: 0.7 });
      return;
    }
    if (focusLocation && typeof userLat === "number" && typeof userLong === "number") {
      map.flyTo([userLat, userLong], 16, { duration: 0.7 });
      return;
    }
    if (typeof focusLat === "number" && typeof focusLong === "number") {
      map.flyTo([focusLat, focusLong], 16, { duration: 0.7 });
    }
  }, [map, focusId, focusLat, focusLong, focusBase, focusLocation, userLat, userLong, route]);

  return null;
}

function pinColor(status?: string | null) {
  if (status === "critico") return "#ff3838";
  if (status === "atencao") return "#ffb800";
  if (status === "ok") return "#00d84a";
  return "#8da2b8";
}

function devicePin(status: string | null | undefined, selected: boolean) {
  const color = pinColor(status);
  const statusClass = status === "ok" ? "ok" : status === "atencao" ? "atencao" : status === "critico" ? "critico" : "sem-leitura";
  return L.divIcon({
    className: "device-pin-icon",
    html: `<span class="device-pin-dot device-pin-dot--${statusClass}${selected ? " device-pin-dot--selected" : ""}" style="--pin-color:${color}" aria-hidden="true"></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    tooltipAnchor: [0, -16],
  });
}

function OpenFreeMapLayer() {
  const map = useMap();

  useEffect(() => {
    const layer = maplibreGL({
      style: "https://tiles.openfreemap.org/styles/fiord",
      interactive: false,
      maxPitch: 0,
    });
    layer.addTo(map);
    return () => { layer.remove(); };
  }, [map]);

  return null;
}

export default function DeviceMap({
  devices,
  selected,
  focus,
  focusBase,
  focusLocation,
  userLocation,
  route,
  onSelect,
  onFocusBase,
}: {
  devices: Device[];
  selected: Device | null;
  focus: Device | null;
  focusBase: boolean;
  focusLocation: boolean;
  userLocation: UserLocation | null;
  route: RouteResult | null;
  onSelect: (device: Device) => void;
  onFocusBase: () => void;
}) {
  const mappedDevices = devices.filter(
    (device) => typeof device.lat === "number" && Number.isFinite(device.lat) && device.lat >= -90 && device.lat <= 90 &&
      typeof device.long === "number" && Number.isFinite(device.long) && device.long >= -180 && device.long <= 180,
  );

  return (
    <MapContainer center={INITIAL_CENTER} zoom={14} scrollWheelZoom zoomControl={false} className="map-dark h-full min-h-0 w-full">
      <OpenFreeMapLayer />
      <ZoomControl position="bottomleft" />
      {route && route.positions.length > 1 && <>
        <Polyline positions={route.positions} pathOptions={{ color: "#fff", weight: 9, opacity: 0.9 }} />
        <Polyline positions={route.positions} pathOptions={{ color: "#35b8a0", weight: 5, opacity: 0.95 }} />
      </>}

      <CircleMarker
        center={INITIAL_CENTER}
        radius={focusBase ? 11 : 9}
        pathOptions={{ color: "#dce9f3", weight: 3, fillColor: focusBase ? "#35b8a0" : "#16445a", fillOpacity: 1 }}
        eventHandlers={{ click: onFocusBase }}
      >
        <Tooltip direction="top" permanent>Base · UniMAX Campus I{focusBase ? " · origem selecionada" : ""}</Tooltip>
      </CircleMarker>

      {userLocation && <>
        {userLocation.accuracy > 0 && <Circle
          center={[userLocation.lat, userLocation.long]}
          radius={userLocation.accuracy}
          pathOptions={{ color: "#2563eb", weight: 1, fillColor: "#3b82f6", fillOpacity: 0.12 }}
        />}
        <CircleMarker
          center={[userLocation.lat, userLocation.long]}
          radius={8}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
        >
          <Tooltip direction="top">Sua localização · precisão ±{Math.round(userLocation.accuracy)} m</Tooltip>
        </CircleMarker>
      </>}

      {mappedDevices.map((device) => {
        const isSelected = selected?.id_dispositivo === device.id_dispositivo;
        return (
          <Marker
            key={device.id_dispositivo}
            position={[device.lat!, device.long!]}
            icon={devicePin(device.status_atual, isSelected)}
            title={device.nome || device.id_dispositivo}
            riseOnHover
            eventHandlers={{ click: () => onSelect(device) }}
          >
            <Tooltip>{device.nome || device.id_dispositivo} · {device.status_atual || "sem_leitura"}</Tooltip>
            <Popup className="sentinelas-device-popup" closeButton>
              <div className="device-popup-card">
                <div className={`device-popup-status device-popup-status--${device.status_atual ?? "sem-leitura"}`}>
                  <span className="device-popup-status-dot" />{device.status_atual === "ok" ? "Normal" : device.status_atual === "atencao" ? "Atenção" : device.status_atual === "critico" ? "Crítico" : "Sem leitura"}
                </div>
                <h2>{device.nome || device.id_dispositivo}</h2>
                <p className="device-popup-id">{device.id_dispositivo} · {device.tipo || "tipo não informado"}</p>
                <dl>
                  <div><dt>Ocupação</dt><dd>{device.nivel_ocupacao == null ? "—" : `${device.nivel_ocupacao}%`}</dd></div>
                  <div><dt>Bateria</dt><dd>{device.bateria == null ? "Não monitorada" : `${device.bateria}%`}</dd></div>
                </dl>
              </div>
            </Popup>
          </Marker>
        );
      })}

      <MapController focus={focus} focusBase={focusBase} focusLocation={focusLocation} userLocation={userLocation} route={route} />
    </MapContainer>
  );
}
