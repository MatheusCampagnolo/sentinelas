import { Device } from "@/lib/devices";

export const MAINTENANCE_BASE = {
  name: "UniMAX — Campus I",
  address: "Av. Nove de Dezembro, 460, Jardim Pedroso, Indaiatuba - SP",
  lat: -23.0944791,
  long: -47.2092089,
};

export type RouteOrigin = { name: string; lat: number; long: number };
export type UserLocation = RouteOrigin & { accuracy: number };

export type RouteResult = {
  origin: RouteOrigin;
  stops: Device[];
  positions: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  criticalFirst: boolean;
};

export function hasCoordinates(point: { lat?: number | null; long?: number | null }) {
  return typeof point.lat === "number" && Number.isFinite(point.lat) && point.lat >= -90 && point.lat <= 90 &&
    typeof point.long === "number" && Number.isFinite(point.long) && point.long >= -180 && point.long <= 180;
}

type OsrmTableResponse = {
  code: string;
  durations?: (number | null)[][];
};

type OsrmRouteResponse = {
  code: string;
  routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
};

export async function createMaintenanceRoute(
  devices: Device[],
  origin: RouteOrigin = MAINTENANCE_BASE,
): Promise<RouteResult> {
  if (!hasCoordinates(origin)) throw new Error("A origem da rota não tem coordenadas válidas.");
  const stops = devices.filter(hasCoordinates);
  if (stops.length === 0) throw new Error("Nenhum dispositivo tem coordenadas válidas para entrar na rota.");

  const locations = [origin, ...stops].map((point) => `${point.long},${point.lat}`).join(";");
  const tableUrl = `https://router.project-osrm.org/table/v1/driving/${locations}?annotations=duration`;
  const tableResponse = await fetch(tableUrl, { cache: "no-store" });
  if (!tableResponse.ok) throw new Error(`OSRM Table respondeu HTTP ${tableResponse.status}.`);

  const table = (await tableResponse.json()) as OsrmTableResponse;
  if (table.code !== "Ok" || !table.durations) throw new Error("OSRM não conseguiu calcular os tempos entre os pontos.");

  const stopIndex = new Map(stops.map((device, index) => [device.id_dispositivo, index + 1]));
  const duration = (from: number, to: number) => table.durations?.[from]?.[to] ?? null;

  function nearestNeighbor(group: Device[], startAt: number) {
    const remaining = [...group];
    const ordered: Device[] = [];
    let current = startAt;

    while (remaining.length > 0) {
      let nearest = -1;
      let shortest = Number.POSITIVE_INFINITY;
      remaining.forEach((device, index) => {
        const travelTime = duration(current, stopIndex.get(device.id_dispositivo)!);
        if (travelTime !== null && travelTime < shortest) {
          nearest = index;
          shortest = travelTime;
        }
      });
      if (nearest < 0) throw new Error("OSRM não encontrou ligação viária para todos os dispositivos selecionados.");
      const [next] = remaining.splice(nearest, 1);
      ordered.push(next);
      current = stopIndex.get(next.id_dispositivo)!;
    }
    return ordered;
  }

  function routeDuration(order: Device[], startAt: number) {
    let current = startAt;
    let total = 0;
    for (const device of order) {
      const next = stopIndex.get(device.id_dispositivo)!;
      const travelTime = duration(current, next);
      if (travelTime === null) return Number.POSITIVE_INFINITY;
      total += travelTime;
      current = next;
    }
    return total;
  }

  function improveWithTwoOpt(initialOrder: Device[], startAt: number) {
    let order = [...initialOrder];
    let improved = true;
    while (improved) {
      improved = false;
      const currentDuration = routeDuration(order, startAt);
      for (let first = 0; first < order.length - 1 && !improved; first++) {
        for (let last = first + 1; last < order.length; last++) {
          const candidate = [...order.slice(0, first), ...order.slice(first, last + 1).reverse(), ...order.slice(last + 1)];
          if (routeDuration(candidate, startAt) < currentDuration) {
            order = candidate;
            improved = true;
            break;
          }
        }
      }
    }
    return order;
  }

  // Rota base: menor deslocamento estimado, sem ordem fixa por status.
  const shortestOrder = improveWithTwoOpt(nearestNeighbor(stops, 0), 0);

  // Alternativa: visita críticos antes dos demais, otimizando a ordem dentro de cada grupo.
  const priorityGroups = [
    stops.filter((device) => device.status_atual === "critico"),
    stops.filter((device) => device.status_atual === "atencao"),
    stops.filter((device) => device.status_atual === "ok"),
    stops.filter((device) => device.status_atual === "sem_leitura"),
    stops.filter((device) => !["critico", "atencao", "ok", "sem_leitura"].includes(device.status_atual ?? "")),
  ].filter((group) => group.length > 0);

  const priorityOrder: Device[] = [];
  let current = 0;
  for (const group of priorityGroups) {
    const groupOrder = improveWithTwoOpt(nearestNeighbor(group, current), current);
    priorityOrder.push(...groupOrder);
    current = stopIndex.get(groupOrder[groupOrder.length - 1].id_dispositivo)!;
  }

  const criticalFirst =
    stops.some((device) => device.status_atual === "critico") &&
    routeDuration(priorityOrder, 0) <= routeDuration(shortestOrder, 0);
  const ordered = criticalFirst ? priorityOrder : shortestOrder;

  const orderedLocations = [origin, ...ordered].map((point) => `${point.long},${point.lat}`).join(";");
  const routeUrl = `https://router.project-osrm.org/route/v1/driving/${orderedLocations}?overview=full&geometries=geojson&steps=false`;
  const routeResponse = await fetch(routeUrl, { cache: "no-store" });
  if (!routeResponse.ok) throw new Error(`OSRM Route respondeu HTTP ${routeResponse.status}.`);

  const routeData = (await routeResponse.json()) as OsrmRouteResponse;
  const route = routeData.code === "Ok" ? routeData.routes?.[0] : undefined;
  if (!route) throw new Error("OSRM não retornou a geometria da rota.");

  return {
    origin,
    stops: ordered,
    positions: route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    criticalFirst,
  };
}
