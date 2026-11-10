"use client";

import { useMemo, useState } from "react";
import { DeviceCard } from "@/components/device-card";
import { useDevices } from "@/components/devices-provider";
import { isStale } from "@/lib/devices";

export function DevicesView() {
  const { devices, loading, error, updatedAt, refresh } = useDevices();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [staleOnly, setStaleOnly] = useState(false);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    return devices.filter((device) => {
      const matchesText = `${device.nome ?? ""} ${device.id_dispositivo} ${device.tipo ?? ""}`.toLocaleLowerCase("pt-BR").includes(term);
      const matchesType = !typeFilter || device.tipo === typeFilter;
      const matchesStatus = !statusFilter || device.status_atual === statusFilter;
      return matchesText && matchesType && matchesStatus && (!staleOnly || isStale(device));
    });
  }, [devices, query, staleOnly, statusFilter, typeFilter]);

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#35b8a0]">Monitoramento</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#f1f5f9]">Dispositivos</h1><p className="mt-2 text-sm text-[#94a3b8]">Estado e telemetria atual dos pontos conectados.</p></div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <input aria-label="Buscar dispositivo" placeholder="Buscar por nome ou ID" value={query} onChange={(event) => setQuery(event.target.value)} className="field-control min-h-10 w-full min-w-0 rounded-lg px-3 text-sm placeholder:text-[#70859a] sm:w-auto" />
          <select aria-label="Filtrar por tipo" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="field-control min-h-10 w-full min-w-0 rounded-lg px-3 text-sm sm:w-auto">
            <option value="">Todos os tipos</option><option value="bueiro">Bueiros</option><option value="lixeira">Lixeiras</option>
          </select>
          <select aria-label="Filtrar por status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field-control min-h-10 w-full min-w-0 rounded-lg px-3 text-sm sm:w-auto">
            <option value="">Todos os status</option><option value="ok">Normal</option><option value="atencao">Atenção</option><option value="critico">Crítico</option><option value="sem_leitura">Sem leitura</option>
          </select>
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[#263b50] bg-[#122438] px-3 py-2 text-sm text-[#b5c3d0]"><input type="checkbox" checked={staleOnly} onChange={(event) => setStaleOnly(event.target.checked)} className="accent-[#35b8a0]" />Leitura antiga</label>
          <button type="button" onClick={() => void refresh()} className="min-h-10 w-full rounded-lg bg-[#1d344b] px-4 py-2 text-sm font-semibold text-[#e2e8f0] transition hover:bg-[#29445d] sm:w-auto">Atualizar</button>
        </div>
      </header>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[#8295a8]"><p>{loading ? "Buscando dados…" : `${filtered.length} ponto(s)`}</p><p>{updatedAt ? `Consultado às ${updatedAt.toLocaleTimeString("pt-BR")}` : "Atualização automática a cada 5 segundos"}</p></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-200">Falha na atualização: {error}. {devices.length ? "Os últimos dados recebidos continuam visíveis." : ""}</p>}
      {!loading && filtered.length === 0 ? <p className="surface-panel rounded-xl border-dashed p-8 text-center text-sm text-[#a8b7c7]">{devices.length ? "Nenhum dispositivo corresponde à busca." : "A API ainda não retornou dispositivos."}</p> :
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((device) => <DeviceCard key={device.id_dispositivo} device={device} />)}</section>}
    </>
  );
}
