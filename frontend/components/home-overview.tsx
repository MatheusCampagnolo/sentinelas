"use client";

import Link from "next/link";
import { useDevices } from "@/components/devices-provider";
import { DeviceStatusBadge } from "@/components/device-status";

export function HomeOverview() {
  const { devices, loading, error, updatedAt } = useDevices();
  const critical = devices.filter((device) => device.status_atual === "critico");
  const attention = devices.filter((device) => device.status_atual === "atencao");
  const normal = devices.filter((device) => device.status_atual === "ok");
  const currentAlerts = [...critical, ...attention].slice(0, 5);
  const value = (count: number) => loading ? "—" : count;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#35b8a0]">Visão geral</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#f1f5f9] sm:text-4xl">Painel de operações</h1>
          <p className="mt-2 text-sm text-[#94a3b8]">Acompanhe os pontos monitorados e priorize o atendimento da cidade.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dispositivos" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#31485f] bg-[#122438] px-4 text-sm font-medium text-[#e2e8f0] transition hover:bg-[#1d344b]">Dispositivos</Link>
          <Link href="/mapa" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#35b8a0] px-4 text-sm font-semibold text-[#09201f] transition hover:bg-[#52c9b3]">Abrir mapa <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">A consulta à API falhou. {devices.length ? "Os últimos dados recebidos continuam visíveis." : "Os indicadores serão exibidos quando a conexão for restabelecida."}</p>}

      <section aria-label="Indicadores dos dispositivos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Pontos monitorados", amount: value(devices.length), note: "Total conectado", tone: "text-[#f1f5f9]", dot: "bg-[#35b8a0]" },
          { title: "Em situação normal", amount: value(normal.length), note: "Operando normalmente", tone: "text-status-normal", dot: "bg-status-normal" },
          { title: "Em atenção", amount: value(attention.length), note: "Ocupação elevada", tone: "text-status-attention", dot: "bg-status-attention" },
          { title: "Críticos", amount: value(critical.length), note: "Coleta prioritária", tone: "text-status-critical", dot: "bg-status-critical" },
        ].map((metric) => <article key={metric.title} className={`surface-panel rounded-xl p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#3a566d] ${metric.title === "Críticos" && critical.length > 0 ? "border-red-400/30 bg-[linear-gradient(145deg,rgba(127,29,29,.14),transparent_70%),var(--surface-1)]" : ""}`}>
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-[#a8b7c7]">{metric.title}</p><span className={`h-2.5 w-2.5 rounded-full ${metric.dot}`} /></div>
          <p className={`mt-5 text-4xl font-semibold tracking-tight ${metric.tone}`}>{metric.amount}</p>
          <p className="mt-1 text-xs text-[#71869a]">{metric.note}</p>
        </article>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="surface-panel min-w-0 rounded-xl">
          <div className="flex items-center justify-between gap-3 border-b border-[#263b50] px-5 py-4 sm:px-6">
            <div><p className="text-xs font-medium text-[#94a3b8]">Acompanhamento em tempo real</p><h2 className="mt-1 text-lg font-semibold">Pontos que exigem atenção</h2></div>
            <Link href="/alertas" className="shrink-0 text-sm font-medium text-[#55c7b2] hover:text-[#8be0d1]">Ver alertas <span aria-hidden="true">→</span></Link>
          </div>
          <div className="space-y-2 p-4 sm:p-5">
            {currentAlerts.length ? currentAlerts.map((device) => <Link key={device.id_dispositivo} href={`/dispositivos/${encodeURIComponent(device.id_dispositivo)}`} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[#263b50] bg-[#0e1f31] px-4 py-3 transition hover:border-[#3a566d] hover:bg-[#142a3e]">
              <div className="flex min-w-0 items-center gap-3"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${device.status_atual === "critico" ? "bg-red-400" : "bg-amber-400"}`} /><div className="min-w-0"><p className="truncate text-sm font-medium text-[#e7edf4]">{device.nome || device.id_dispositivo}</p><p className="mt-0.5 truncate text-xs text-[#8295a8]">{device.id_dispositivo} · {device.tipo || "dispositivo"}</p></div></div>
              <div className="flex shrink-0 items-center gap-3"><span className="hidden text-sm text-[#b4c1cd] sm:inline">{device.nivel_ocupacao == null ? "Estado atual" : `${device.nivel_ocupacao}%`}</span><DeviceStatusBadge status={device.status_atual} /></div>
            </Link>) : <div className="rounded-lg border border-dashed border-[#31485f] px-4 py-8 text-center"><p className="text-sm font-medium text-[#d8e1e9]">{loading ? "Recebendo leituras…" : "Nenhum alerta ativo"}</p><p className="mt-1 text-xs text-[#8295a8]">{loading ? "Os dados aparecerão assim que a API responder." : "Os pontos estão sem estados críticos ou de atenção no momento."}</p></div>}
          </div>
        </article>

        <article className="surface-panel rounded-xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-[#94a3b8]">Conectividade</p><h2 className="mt-1 text-lg font-semibold">Sincronização dos dados</h2></div><span className={`mt-1 h-2.5 w-2.5 rounded-full ${error ? "bg-red-400" : loading ? "bg-amber-300" : "bg-[#35b8a0]"}`} /></div>
          <p className="mt-6 text-sm font-medium text-[#e2e8f0]">{error ? "API indisponível" : loading ? "Conectando à API" : "Atualização automática ativa"}</p>
          <p className="mt-2 text-sm leading-6 text-[#94a3b8]">O painel consulta os dispositivos periodicamente e mantém os últimos dados recebidos disponíveis durante falhas temporárias.</p>
          <div className="mt-5 flex items-center justify-between border-t border-[#263b50] pt-4 text-xs text-[#8295a8]"><span>Intervalo de atualização</span><span>5 segundos</span></div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#8295a8]"><span>Última consulta concluída</span><span>{updatedAt ? updatedAt.toLocaleTimeString("pt-BR") : "Aguardando"}</span></div>
        </article>
      </section>
    </div>
  );
}
