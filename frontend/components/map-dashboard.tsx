"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useDevices } from "@/components/devices-provider";
import { Device } from "@/lib/devices";
import { createMaintenanceRoute, hasCoordinates, MAINTENANCE_BASE, RouteOrigin, RouteResult, UserLocation } from "@/lib/routing";

const DeviceMap = dynamic(() => import("@/components/device-map"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-slate-100" />,
});

const panelStyle = "border border-slate-200/90 bg-white/90 text-slate-900 shadow-xl shadow-slate-900/10 backdrop-blur-xl";

function statusName(status?: string | null) {
  const names: Record<string, string> = { ok: "Normal", atencao: "Atenção", critico: "Crítico", sem_leitura: "Sem leitura" };
  return status ? names[status] ?? status : "Sem leitura";
}

function statusStyle(status?: string | null) {
  if (status === "critico") return "bg-red-50 text-red-800 ring-1 ring-red-200";
  if (status === "atencao") return "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
  if (status === "ok") return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200";
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

export function MapDashboard() {
  const { devices, loading, error } = useDevices();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [baseFocused, setBaseFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const results = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return [];
    return devices.filter((device) =>
      `${device.nome ?? ""} ${device.id_dispositivo} ${device.tipo ?? ""}`.toLocaleLowerCase("pt-BR").includes(term),
    ).slice(0, 6);
  }, [devices, search]);

  const withCoordinates = devices.filter(hasCoordinates).length;
  const selected = selectedId ? devices.find((device) => device.id_dispositivo === selectedId) ?? null : null;

  function locateUser() {
    setUserLocation(null);
    setLocationFocused(false);
    setLocationMessage(null);
    setBaseFocused(false);
    setSelectedId(null);
    setRoute(null);
    setRouteError(null);

    if (!window.isSecureContext) {
      setLocationStatus("error");
      setLocationMessage("A localização do navegador exige HTTPS ou localhost.");
      return;
    }
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationMessage("Este navegador não oferece acesso à localização.");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation: UserLocation = {
          name: "Sua localização",
          lat: coords.latitude,
          long: coords.longitude,
          accuracy: coords.accuracy,
        };
        if (!hasCoordinates(nextLocation) || !Number.isFinite(nextLocation.accuracy) || nextLocation.accuracy < 0) {
          setLocationStatus("error");
          setLocationMessage("O navegador retornou coordenadas inválidas.");
          return;
        }
        setUserLocation(nextLocation);
        setLocationStatus("ready");
        setBaseFocused(false);
        setLocationFocused(true);
        setSelectedId(null);
        setRoute(null);
        setRouteError(null);
      },
      (cause) => {
        setLocationStatus("error");
        setLocationMessage(cause.code === cause.PERMISSION_DENIED
          ? "A permissão foi negada. Altere-a nas permissões do site e tente novamente."
          : cause.code === cause.POSITION_UNAVAILABLE
            ? "O navegador não conseguiu determinar sua posição."
            : "A solicitação de localização expirou. Tente novamente.");
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  function focusBase() {
    setBaseFocused(true);
    setLocationFocused(false);
    setSelectedId(null);
    setRoute(null);
    setRouteError(null);
  }

  async function generateRoute() {
    setRouting(true);
    setRouteError(null);
    setRoute(null);
    try {
      const origin: RouteOrigin = !baseFocused && userLocation
        ? { name: userLocation.name, lat: userLocation.lat, long: userLocation.long }
        : MAINTENANCE_BASE;
      const result = await createMaintenanceRoute(devices, origin);
      setRoute(result);
      setSelectedId(null);
    } catch (cause) {
      setRouteError(cause instanceof Error ? cause.message : "Não foi possível gerar a rota.");
    } finally {
      setRouting(false);
    }
  }

  function selectDevice(device: Device) {
    setSelectedId(device.id_dispositivo);
    setBaseFocused(false);
    setLocationFocused(false);
    setRoute(null);
    setRouteError(null);
  }

  return (
    <section className="relative -mx-4 -my-5 h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] min-h-[320px] overflow-hidden bg-slate-100 sm:-mx-8 sm:-my-8 md:h-[calc(100vh-4rem)] md:min-h-[560px]">
      <DeviceMap
        devices={devices}
        selected={selected}
        focus={selected}
        focusBase={baseFocused}
        focusLocation={locationFocused}
        userLocation={userLocation}
        route={route}
        onSelect={selectDevice}
        onFocusBase={focusBase}
      />

      <div className={`${panelStyle} absolute left-4 top-4 z-[1000] w-[min(24rem,calc(100%-2rem))] rounded-2xl p-3`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <label htmlFor="map-device-search" className="sr-only">Buscar dispositivo</label>
            <input
              id="map-device-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar nome, ID ou tipo..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
            />
            <p role={locationMessage ? "status" : undefined} className={`mt-0.5 text-[11px] ${locationMessage ? "text-amber-800" : "text-slate-500"}`}>
              {locationMessage || (locationStatus === "loading"
                ? "Solicitando sua localização…"
                : userLocation
                  ? `${withCoordinates} pontos · você no mapa (±${Math.round(userLocation.accuracy)} m)`
                  : loading ? "Buscando pontos…" : `${withCoordinates} pontos · use o alvo para mostrar sua localização`)}
            </p>
          </div>
          <button
            type="button"
            onClick={locateUser}
            disabled={locationStatus === "loading"}
            aria-label={userLocation ? "Atualizar minha localização" : "Mostrar minha localização"}
            title={userLocation ? "Atualizar minha localização" : "Mostrar minha localização"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:cursor-wait disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2" /></svg>
          </button>
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca" className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900">×</button>}
        </div>
        {search.trim() && <ul className="mt-3 max-h-64 overflow-auto border-t border-slate-200 pt-2">
          {results.length ? results.map((device) => (
            <li key={device.id_dispositivo}>
              <button type="button" onClick={() => { selectDevice(device); setSearch(""); }} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-100">
                <span className="min-w-0"><span className="block truncate text-sm font-medium">{device.nome || device.id_dispositivo}</span><span className="block truncate text-xs text-slate-500">{device.id_dispositivo} · {device.tipo || "sem tipo"}</span></span>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${statusStyle(device.status_atual)}`}>{statusName(device.status_atual)}</span>
              </button>
            </li>
          )) : <li className="px-3 py-3 text-sm text-slate-500">Nenhum dispositivo encontrado.</li>}
        </ul>}
      </div>

      <button
        type="button"
        onClick={focusBase}
        aria-pressed={baseFocused}
        className={`${panelStyle} absolute right-4 top-[5.5rem] z-[900] flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-white sm:top-4 ${baseFocused ? "ring-2 ring-emerald-700/30" : ""}`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-800">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.2" /></svg>
          </span>
          <span className="min-w-0"><span className="block text-xs font-semibold">Base da equipe · UniMAX</span><span className="block truncate text-[11px] text-slate-600">Campus I · Av. Nove de Dezembro, 460</span><span className="mt-0.5 block text-[10px] text-slate-500">{baseFocused ? "Origem selecionada" : "Toque para usar como origem"}</span></span>
        </div>
      </button>

      {selected && <aside className={`${panelStyle} absolute right-4 top-[11rem] z-[1000] max-h-[35vh] w-[min(22rem,calc(100%-2rem))] overflow-y-auto rounded-2xl p-4 md:top-[7.5rem] md:max-h-[42vh]`} aria-label="Detalhes do dispositivo selecionado">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">Ponto monitorado</p><h2 className="mt-1 truncate text-lg font-semibold">{selected.nome || selected.id_dispositivo}</h2><p className="mt-0.5 text-xs text-slate-500">{selected.id_dispositivo} · {selected.tipo || "tipo não informado"}</p></div>
          <button type="button" onClick={() => setSelectedId(null)} aria-label="Fechar detalhes" className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900">×</button>
        </div>
        <div className="mt-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(selected.status_atual)}`}>{statusName(selected.status_atual)}</span></div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <div><dt className="text-slate-500">Ocupação</dt><dd className="mt-1 text-sm font-semibold">{selected.nivel_ocupacao ?? "—"}{selected.nivel_ocupacao == null ? "" : "%"}</dd></div>
          <div><dt className="text-slate-500">Distância</dt><dd className="mt-1 text-sm font-semibold">{selected.distancia_cm ?? "—"}{selected.distancia_cm == null ? "" : " cm"}</dd></div>
          <div><dt className="text-slate-500">Bateria</dt><dd className="mt-1 text-sm font-semibold">{selected.bateria == null ? "Não monitorada" : `${selected.bateria}%`}</dd></div>
          <div><dt className="text-slate-500">Última leitura</dt><dd className="mt-1 text-sm font-semibold">{selected.ultima_leitura ? new Date(selected.ultima_leitura).toLocaleString("pt-BR") : "Sem leitura"}</dd></div>
          <div className="col-span-2"><dt className="text-slate-500">Coordenadas</dt><dd className="mt-1 text-sm font-medium">{hasCoordinates(selected) ? `${selected.lat}, ${selected.long}` : "Não cadastradas"}</dd></div>
        </dl>
        {!hasCoordinates(selected) && <p className="mt-3 text-xs text-amber-800">Sem coordenadas válidas: este ponto não aparece no mapa nem entra na rota.</p>}
        <Link href={`/dispositivos/${encodeURIComponent(selected.id_dispositivo)}`} className="mt-4 inline-flex text-xs font-semibold text-emerald-800 hover:text-emerald-950">Abrir dados completos <span className="ml-1">↗</span></Link>
      </aside>}

      <div className={`${panelStyle} absolute bottom-4 left-20 z-[900] hidden items-center gap-3 rounded-full px-4 py-2.5 2xl:flex`} aria-label="Legenda do mapa">
        <span className="flex items-center gap-1.5 text-[11px]"><i className="h-2.5 w-2.5 rounded-full bg-emerald-600" />Normal</span>
        <span className="flex items-center gap-1.5 text-[11px]"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" />Atenção</span>
        <span className="flex items-center gap-1.5 text-[11px]"><i className="h-2.5 w-2.5 rounded-full bg-red-600" />Crítico</span>
        <span className="flex items-center gap-1.5 text-[11px]"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" />Outro</span>
      </div>

      <div className={`${panelStyle} absolute bottom-3 right-3 z-[900] max-h-[38%] w-[min(23rem,calc(100%-1.5rem))] overflow-y-auto rounded-2xl p-3 sm:bottom-4 sm:right-4 sm:max-h-none sm:w-[min(23rem,calc(100%-2rem))] sm:p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">Planejamento</p><h2 className="mt-1 text-sm font-semibold">Rota de atendimento</h2></div>
          <button type="button" onClick={() => void generateRoute()} disabled={routing || locationStatus === "loading" || withCoordinates === 0} className="shrink-0 rounded-full bg-emerald-800 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">
            {routing ? "Calculando..." : "Gerar rota"}
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-600">Origem: {route?.origin.name ?? (baseFocused || !userLocation ? MAINTENANCE_BASE.name : userLocation.name)}. Inclui todos os {withCoordinates} ponto(s) com coordenadas; críticos só são colocados primeiro quando o tempo estimado não aumenta.</p>
        {error && <p className="mt-2 text-xs text-amber-800">Os dados exibidos podem estar desatualizados: falha ao consultar a API.</p>}
        {routeError && <p role="alert" className="mt-2 text-xs text-red-700">{routeError}</p>}
        {route && <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs"><span>{(route.distanceMeters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km</span><span>{Math.round(route.durationSeconds / 60)} min estimados</span><span className="font-medium text-emerald-800">{route.criticalFirst ? "Críticos priorizados" : "Menor deslocamento total"}</span></div>
          <ol className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs text-slate-700">
            {route.stops.map((device) => <li key={device.id_dispositivo} className="flex items-center gap-2"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${device.status_atual === "critico" ? "bg-red-600" : device.status_atual === "atencao" ? "bg-amber-500" : "bg-slate-400"}`} /><span className="truncate">{device.nome || device.id_dispositivo}</span><span className="ml-auto text-slate-500">{statusName(device.status_atual)}</span></li>)}
          </ol>
        </div>}
      </div>
    </section>
  );
}
