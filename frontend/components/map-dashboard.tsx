"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useDevices } from "@/components/devices-provider";
import { Device } from "@/lib/devices";
import { createMaintenanceRoute, hasCoordinates, MAINTENANCE_BASE, RouteOrigin, RouteResult, UserLocation } from "@/lib/routing";

const DeviceMap = dynamic(() => import("@/components/device-map"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-[#0b1725]" />,
});

const panelStyle = "surface-panel";

function statusMessage(status?: string | null, type?: string | null) {
  const bin = type === "lixeira";
  if (status === "critico") return { title: bin ? "Lixeira cheia - Crítico" : "Dispositivo em estado crítico", description: bin ? "Capacidade máxima atingida. É necessária a coleta e limpeza imediata." : "O ponto atingiu um nível crítico e precisa de atendimento prioritário.", tone: "border-red-400/30 bg-red-400/10 text-red-200" };
  if (status === "atencao") return { title: bin ? "Lixeira em atenção - Moderado" : "Dispositivo em atenção", description: bin ? "Nível de ocupação elevado. A lixeira está próxima de atingir sua capacidade máxima." : "O ponto está próximo do limite de ocupação e deve ser acompanhado.", tone: "border-amber-400/30 bg-amber-400/10 text-amber-100" };
  if (status === "ok") return { title: bin ? "Lixeira limpa - Normal" : "Dispositivo em situação normal", description: bin ? "Lixeira em condições normais. Nenhuma ação de limpeza é necessária no momento." : "O dispositivo está funcionando normalmente. Nenhuma ação é necessária no momento.", tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" };
  return { title: "Sem leitura", description: "Ainda não há uma leitura disponível para este dispositivo.", tone: "border-slate-400/25 bg-slate-400/10 text-slate-200" };
}

function statusName(status?: string | null) {
  const names: Record<string, string> = { ok: "Normal", atencao: "Atenção", critico: "Crítico", sem_leitura: "Sem leitura" };
  return status ? names[status] ?? status : "Sem leitura";
}

function statusStyle(status?: string | null) {
  if (status === "critico") return "border border-red-400/25 bg-red-400/10 text-red-200";
  if (status === "atencao") return "border border-amber-400/25 bg-amber-400/10 text-amber-100";
  if (status === "ok") return "border border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  return "border border-slate-400/20 bg-slate-400/10 text-slate-200";
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
    <section className="relative -mx-4 -my-5 h-[calc(100dvh-8rem-env(safe-area-inset-bottom))] min-h-[420px] overflow-hidden bg-[#0b1725] sm:-mx-8 sm:-my-8 md:h-[calc(100dvh-4rem)] md:min-h-[600px]">
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

      <div className={`${panelStyle} absolute left-4 top-4 z-[1000] w-[min(24rem,calc(100%-2rem))] rounded-xl p-3`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1d344b] text-[#c5d3df]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <label htmlFor="map-device-search" className="sr-only">Buscar dispositivo</label>
            <input
              id="map-device-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar nome, ID ou tipo..."
              className="w-full bg-transparent text-sm text-[#f1f5f9] outline-none placeholder:text-[#8295a8]"
            />
            <p role={locationMessage ? "status" : undefined} className={`mt-0.5 text-[11px] ${locationMessage ? "text-amber-200" : "text-[#94a3b8]"}`}>
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1d344b] text-[#d9e4ed] transition hover:bg-[#29445d] disabled:cursor-wait disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2" /></svg>
          </button>
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca" className="rounded-full px-2 py-1 text-[#94a3b8] transition hover:bg-[#1d344b] hover:text-white">×</button>}
        </div>
        {search.trim() && <ul className="mt-3 max-h-64 overflow-auto border-t border-[#263b50] pt-2">
          {results.length ? results.map((device) => (
            <li key={device.id_dispositivo}>
              <button type="button" onClick={() => { selectDevice(device); setSearch(""); }} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/10">
                <span className="min-w-0"><span className="block truncate text-sm font-medium">{device.nome || device.id_dispositivo}</span><span className="block truncate text-xs text-slate-300">{device.id_dispositivo} · {device.tipo || "sem tipo"}</span></span>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${statusStyle(device.status_atual)}`}>{statusName(device.status_atual)}</span>
              </button>
            </li>
          )) : <li className="px-3 py-3 text-sm text-slate-300">Nenhum dispositivo encontrado.</li>}
        </ul>}
      </div>

      <button
        type="button"
        onClick={focusBase}
        aria-pressed={baseFocused}
        className={`${panelStyle} absolute right-4 top-[5.5rem] z-[900] flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-[#1d344b] sm:top-4 ${baseFocused ? "ring-2 ring-[#35b8a0]/50" : ""}`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#35b8a0]/10 text-[#63cdb8]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.2" /></svg>
          </span>
          <span className="min-w-0"><span className="block text-xs font-semibold">Base da equipe · UniMAX</span><span className="block truncate text-[11px] text-slate-200">Campus I · Av. Nove de Dezembro, 460</span><span className="mt-0.5 block text-[10px] text-slate-300">{baseFocused ? "Origem selecionada" : "Toque para usar como origem"}</span></span>
        </div>
      </button>

      {selected && <aside className="surface-panel absolute right-4 top-[11rem] z-[1000] max-h-[44vh] w-[min(22rem,calc(100%-2rem))] overflow-y-auto rounded-xl p-4 md:top-24 md:max-h-[55vh]" aria-label="Estado do dispositivo selecionado">
        {(() => { const message = statusMessage(selected.status_atual, selected.tipo); return <div className={`rounded-lg border p-4 ${message.tone}`}><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold leading-6">{message.title}</h2><p className="mt-2 text-sm leading-5 text-[#d5e0e9]">{message.description}</p></div><button type="button" onClick={() => setSelectedId(null)} aria-label="Fechar estado" className="rounded-md px-1 text-xl leading-6 text-[#a8b7c7] transition hover:bg-white/10 hover:text-white">×</button></div></div>; })()}
        <Link href={`/dispositivos/${encodeURIComponent(selected.id_dispositivo)}`} className="mt-3 inline-flex text-xs font-semibold text-[#63cdb8] transition hover:text-[#94e5d8]">Abrir detalhes completos <span className="ml-1">↗</span></Link>
      </aside>}

      <div className={`${panelStyle} absolute bottom-16 left-4 z-[900] flex items-center gap-2 rounded-lg px-3 py-2 sm:gap-3 sm:px-4`} aria-label="Legenda do mapa">
        <span className="flex items-center gap-1.5 text-[10px] text-[#c5d1dc] sm:text-[11px]"><i className="h-2 w-2 rounded-full bg-emerald-600" />Normal</span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#c5d1dc] sm:text-[11px]"><i className="h-2 w-2 rounded-full bg-amber-500" />Atenção</span>
        <span className="flex items-center gap-1.5 text-[10px] text-[#c5d1dc] sm:text-[11px]"><i className="h-2 w-2 rounded-full bg-red-600" />Crítico</span>
        <span className="hidden items-center gap-1.5 text-[11px] text-[#c5d1dc] sm:flex"><i className="h-2 w-2 rounded-full bg-slate-400" />Outro</span>
      </div>

      <div className={`${panelStyle} absolute bottom-16 right-3 z-[900] max-h-[38%] w-[min(23rem,calc(100%-1.5rem))] overflow-y-auto rounded-xl p-3 sm:right-4 sm:max-h-none sm:w-[min(23rem,calc(100%-2rem))] sm:p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#63cdb8]">Planejamento</p><h2 className="mt-1 text-sm font-semibold text-[#e8eef4]">Rota de atendimento</h2></div>
          <button type="button" onClick={() => void generateRoute()} disabled={routing || locationStatus === "loading" || withCoordinates === 0} className="shrink-0 rounded-lg bg-[#1d344b] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#29445d] disabled:cursor-not-allowed disabled:opacity-50">
            {routing ? "Calculando..." : "Gerar rota"}
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-300">Origem: {route?.origin.name ?? (baseFocused || !userLocation ? MAINTENANCE_BASE.name : userLocation.name)}. Inclui todos os {withCoordinates} ponto(s) com coordenadas; críticos só são colocados primeiro quando o tempo estimado não aumenta.</p>
        {error && <p className="mt-2 text-xs text-amber-200">Os dados exibidos podem estar desatualizados: falha ao consultar a API.</p>}
        {routeError && <p role="alert" className="mt-2 text-xs text-red-300">{routeError}</p>}
        {route && <div className="mt-3 border-t border-[#263b50] pt-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#c5d1dc]"><span>{(route.distanceMeters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km</span><span>{Math.round(route.durationSeconds / 60)} min estimados</span><span className="font-medium text-[#63cdb8]">{route.criticalFirst ? "Críticos priorizados" : "Menor deslocamento total"}</span></div>
          <ol className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs text-slate-100">
            {route.stops.map((device) => <li key={device.id_dispositivo} className="flex items-center gap-2"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${device.status_atual === "critico" ? "bg-red-500" : device.status_atual === "atencao" ? "bg-amber-400" : "bg-slate-400"}`} /><span className="truncate">{device.nome || device.id_dispositivo}</span><span className="ml-auto text-slate-300">{statusName(device.status_atual)}</span></li>)}
          </ol>
        </div>}
      </div>
    </section>
  );
}
