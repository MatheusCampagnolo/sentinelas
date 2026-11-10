"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { useDevices } from "@/components/devices-provider";
import { DeviceStatusBadge } from "@/components/device-status";
import { formatNumber, formatTimestamp, isStale } from "@/lib/devices";

const SEEN_STORAGE_KEY = "sentinelas-alerts-seen-v1";
let memorySeenSnapshot = "[]";

function subscribeSeen(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("sentinelas-alerts-seen-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sentinelas-alerts-seen-change", callback);
  };
}

function getSeenSnapshot() {
  try {
    memorySeenSnapshot = localStorage.getItem(SEEN_STORAGE_KEY) ?? "[]";
  } catch { /* Keep the in-memory copy when storage is unavailable. */ }
  return memorySeenSnapshot;
}

function saveSeenSnapshot(next: Set<string>) {
  memorySeenSnapshot = JSON.stringify([...next]);
  try { localStorage.setItem(SEEN_STORAGE_KEY, memorySeenSnapshot); } catch { /* Keep the in-memory copy when storage is unavailable. */ }
  window.dispatchEvent(new Event("sentinelas-alerts-seen-change"));
}

function alertKey(device: { id_dispositivo: string; ultima_leitura?: number | null; status_atual?: string | null }) {
  return `${device.id_dispositivo}:${device.status_atual ?? ""}`;
}

function severityColor(status?: string | null) {
  return status === "critico" ? "border-l-status-critical" : "border-l-status-attention";
}

function SeverityIcon({ critical }: { critical: boolean }) {
  return critical
    ? <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3 2.8 19a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2L12 3Z" /><path strokeLinecap="round" d="M12 9v5m0 3h.01" /></svg>
    : <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 11v5m0-8h.01" /></svg>;
}

export default function AlertsPage() {
  const { devices, loading, error, updatedAt } = useDevices();
  const seenSnapshot = useSyncExternalStore(subscribeSeen, getSeenSnapshot, () => "[]");
  const seen = useMemo(() => {
    try { return new Set(JSON.parse(seenSnapshot) as string[]); } catch { return new Set<string>(); }
  }, [seenSnapshot]);
  const alerts = useMemo(() => devices.filter((device) => device.status_atual === "critico" || device.status_atual === "atencao")
    .sort((a, b) => Number(b.status_atual === "critico") - Number(a.status_atual === "critico") || Number(b.ultima_leitura ?? 0) - Number(a.ultima_leitura ?? 0)), [devices]);
  const criticalCount = alerts.filter((device) => device.status_atual === "critico").length;
  const attentionCount = alerts.filter((device) => device.status_atual === "atencao").length;
  const unreadCount = alerts.filter((device) => !seen.has(alertKey(device))).length;

  function saveSeen(next: Set<string>) {
    saveSeenSnapshot(next);
  }

  function toggleSeen(key: string) {
    const next = new Set(seen);
    if (next.has(key)) next.delete(key); else next.add(key);
    saveSeen(next);
  }

  function markAllSeen() {
    saveSeen(new Set([...seen, ...alerts.map(alertKey)]));
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#35b8a0]">Acompanhamento operacional</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#f1f5f9] sm:text-4xl">Central de notificações</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#94a3b8]">Alertas derivados do estado atual dos dispositivos. A API fornece a situação mais recente, sem histórico de eventos.</p></div>
        {alerts.length > 0 && <button type="button" onClick={markAllSeen} disabled={unreadCount === 0} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-[#31485f] bg-[#122438] px-4 text-sm font-medium text-[#dbe5ee] transition hover:bg-[#1d344b] disabled:cursor-not-allowed disabled:opacity-50">Marcar todas como vistas</button>}
      </header>

      {error && <p role="alert" className="rounded-lg border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-200">A consulta falhou: {error}. {devices.length ? "Os últimos dados recebidos continuam exibidos." : ""}</p>}

      <section aria-label="Resumo das notificações" className="grid gap-3 sm:grid-cols-3">
        <article className={`surface-panel rounded-xl p-4 sm:p-5 ${criticalCount ? "border-status-critical/25" : ""}`}><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-critical/10 text-status-critical"><SeverityIcon critical /></span><div><p className="text-sm text-[#a8b7c7]">Críticos</p><p className="mt-0.5 text-2xl font-semibold text-status-critical">{loading && devices.length === 0 ? "—" : criticalCount}</p></div></div></article>
        <article className="surface-panel rounded-xl p-4 sm:p-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-attention/10 text-status-attention"><SeverityIcon critical={false} /></span><div><p className="text-sm text-[#a8b7c7]">Em atenção</p><p className="mt-0.5 text-2xl font-semibold text-status-attention">{loading && devices.length === 0 ? "—" : attentionCount}</p></div></div></article>
        <article className="surface-panel rounded-xl p-4 sm:p-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#35b8a0]/10 text-[#6bd2bf]"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" /></svg></span><div><p className="text-sm text-[#a8b7c7]">Não visualizadas</p><p className="mt-0.5 text-2xl font-semibold text-[#e2e8f0]">{unreadCount}</p></div></div></article>
      </section>

      <section aria-label="Alertas atuais" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold text-[#e8eef4]">Alertas ativos <span className="ml-1 text-sm font-normal text-[#8295a8]">{loading && devices.length === 0 ? "" : `(${alerts.length})`}</span></h2><span className="text-sm text-[#8295a8]">Última consulta: {updatedAt ? updatedAt.toLocaleTimeString("pt-BR") : "Aguardando dados"}</span></div>
        {loading && devices.length === 0 ? <div className="surface-panel rounded-xl p-8 text-center text-sm text-[#94a3b8]">Carregando alertas…</div> : alerts.length === 0 ? <div className="surface-panel rounded-xl border-dashed px-6 py-12 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#35b8a0]/10 text-[#62cdb8]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" /></svg></span><h3 className="mt-4 text-base font-semibold text-[#e2e8f0]">Tudo em ordem</h3><p className="mt-1 text-sm text-[#94a3b8]">Nenhum ponto está em estado crítico ou de atenção agora.</p></div> : alerts.map((device) => {
          const key = alertKey(device);
          const isSeen = seen.has(key);
          const critical = device.status_atual === "critico";
          return <article key={key} className={`surface-panel rounded-xl border-l-[3px] ${severityColor(device.status_atual)} ${critical ? "bg-[linear-gradient(100deg,rgba(127,29,29,.12),transparent_45%),var(--surface-1)]" : ""} p-4 transition duration-200 hover:border-[#3a566d] sm:p-5`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${critical ? "bg-red-400/10 text-red-300" : "bg-amber-400/10 text-amber-200"}`}><SeverityIcon critical={critical} /></span>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><DeviceStatusBadge status={device.status_atual} />{!isSeen && <span className="rounded-full border border-[#35b8a0]/25 bg-[#35b8a0]/10 px-2.5 py-1 text-xs font-medium text-[#75d7c5]">Nova</span>}{isSeen && <span className="text-xs text-[#8295a8]">Visualizada</span>}</div><h3 className="mt-2 truncate text-base font-semibold text-[#f1f5f9]">{device.nome || device.id_dispositivo}</h3><p className="mt-1 text-sm leading-5 text-[#a8b7c7]">{critical ? "Nível crítico: atendimento de coleta deve ser priorizado." : "Ocupação elevada: o dispositivo está próximo do limite."}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#8295a8]"><span>ID {device.id_dispositivo}</span><span>{device.tipo || "Tipo não informado"}</span><span>Ocupação {formatNumber(device.nivel_ocupacao, "%")}</span><span>{formatTimestamp(device.ultima_leitura)}{isStale(device) ? " · leitura desatualizada" : ""}</span></div></div>
              </div>
              <div className="flex shrink-0 items-center gap-2 pl-[3.25rem] sm:pl-0"><button type="button" aria-pressed={isSeen} onClick={() => toggleSeen(key)} className="min-h-10 rounded-lg border border-[#31485f] px-3 text-sm font-medium text-[#c3d0dc] transition hover:bg-[#1d344b]">{isSeen ? "Marcar como nova" : "Marcar como vista"}</button><Link href={`/dispositivos/${encodeURIComponent(device.id_dispositivo)}`} className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-[#1d344b] px-3 text-sm font-semibold text-white transition hover:bg-[#29445d]">Abrir dispositivo <span aria-hidden="true">↗</span></Link></div>
            </div>
          </article>;
        })}
      </section>
    </section>
  );
}
