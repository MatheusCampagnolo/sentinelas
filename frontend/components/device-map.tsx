"use client";

import { useEffect } from "react";
import L from "leaflet";
import { Circle, CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, ZoomControl } from "react-leaflet";
import { Device } from "@/lib/devices";
import { MAINTENANCE_BASE, RouteResult, UserLocation } from "@/lib/routing";

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
  if (status === "critico") return "#dc2626";
  if (status === "atencao") return "#d97706";
  if (status === "ok") return "#15803d";
  return "#64748b";
}

function devicePin(status: string | null | undefined, selected: boolean) {
  const color = pinColor(status);

  return L.divIcon({
    className: "device-pin-icon",
    html: `<span class="device-pin${selected ? " device-pin--selected" : ""}"><svg viewBox="0 0 40 48" aria-hidden="true"><path d="M20 2C10 2 2 10 2 20c0 12 18 26 18 26s18-14 18-26C38 10 30 2 20 2Z" fill="${color}" stroke="#fff" stroke-width="3"/><circle cx="20" cy="19" r="8" fill="#fff"/><circle cx="20" cy="19" r="4" fill="${color}"/></svg></span>`,
    iconSize: [40, 48],
    iconAnchor: [20, 46],
    tooltipAnchor: [0, -38],
  });
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
    <MapContainer center={INITIAL_CENTER} zoom={14} scrollWheelZoom zoomControl={false} className="map-light h-full min-h-[520px] w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomleft" />
      {route && route.positions.length > 1 && <>
        <Polyline positions={route.positions} pathOptions={{ color: "#fff", weight: 9, opacity: 0.9 }} />
        <Polyline positions={route.positions} pathOptions={{ color: "#047857", weight: 5, opacity: 0.95 }} />
      </>}

      <CircleMarker
        center={INITIAL_CENTER}
        radius={focusBase ? 11 : 9}
        pathOptions={{ color: "#fff", weight: 3, fillColor: focusBase ? "#047857" : "#f59e0b", fillOpacity: 1 }}
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
          </Marker>
        );
      })}

      <MapController focus={focus} focusBase={focusBase} focusLocation={focusLocation} userLocation={userLocation} route={route} />
    </MapContainer>
  );
}
