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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm text-emerald-800">Monitoramento</p><h1 className="text-3xl font-bold">Dispositivos</h1></div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input aria-label="Buscar dispositivo" placeholder="Buscar por nome ou ID" value={query} onChange={(event) => setQuery(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <select aria-label="Filtrar por tipo" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">Todos os tipos</option><option value="bueiro">Bueiros</option><option value="lixeira">Lixeiras</option>
          </select>
          <select aria-label="Filtrar por status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">Todos os status</option><option value="ok">Normal</option><option value="atencao">Atenção</option><option value="critico">Crítico</option><option value="sem_leitura">Sem leitura</option>
          </select>
          <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><input type="checkbox" checked={staleOnly} onChange={(event) => setStaleOnly(event.target.checked)} />Leitura antiga</label>
          <button onClick={() => void refresh()} className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900">Atualizar</button>
        </div>
      </div>
      <p className="mb-4 text-sm text-slate-500">{loading ? "Buscando dados…" : `${filtered.length} ponto(s)`}{updatedAt ? ` · Consultado às ${updatedAt.toLocaleTimeString("pt-BR")}` : ""}</p>
      {error && <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">Falha na atualização: {error}. {devices.length ? "Os últimos dados recebidos continuam visíveis." : ""}</p>}
      {!loading && filtered.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">{devices.length ? "Nenhum dispositivo corresponde à busca." : "A API ainda não retornou dispositivos."}</p> :
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((device) => <DeviceCard key={device.id_dispositivo} device={device} />)}</section>}
    </>
  );
}
