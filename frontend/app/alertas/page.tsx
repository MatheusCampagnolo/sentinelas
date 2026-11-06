"use client";

import Link from "next/link";
import { useDevices } from "@/components/devices-provider";
import { DeviceStatusBadge } from "@/components/device-status";
import { formatNumber, formatTimestamp, isStale } from "@/lib/devices";

export default function AlertsPage() {
  const { devices, loading, error } = useDevices();
  const alerts = devices.filter((device) => device.status_atual === "critico" || device.status_atual === "atencao")
    .sort((a, b) => Number(b.status_atual === "critico") - Number(a.status_atual === "critico"));

  return (
    <section>
      <p className="text-sm text-emerald-800">Acompanhamento atual</p>
      <h1 className="mt-1 text-3xl font-bold">Alertas</h1>
      <p className="mt-2 text-sm text-slate-600">A API fornece o estado atual dos pontos. Esta tela ainda não é um histórico de eventos.</p>
      {error && <p role="alert" className="mt-4 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">A consulta falhou: {error}. Os últimos dados recebidos continuam exibidos.</p>}
      {loading && devices.length === 0 ? <p className="mt-6">Carregando alertas…</p> : alerts.length === 0 ? <p className="mt-6 border-t border-slate-300 py-5">Nenhum ponto está em atenção ou crítico agora.</p> :
        <ul className="mt-6 divide-y divide-slate-300 border-y border-slate-300">{alerts.map((device) => <li key={device.id_dispositivo} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex flex-wrap items-center gap-3"><h2 className="font-semibold">{device.nome || device.id_dispositivo}</h2><DeviceStatusBadge status={device.status_atual} /></div><p className="mt-1 text-sm text-slate-500">{device.id_dispositivo} · Ocupação {formatNumber(device.nivel_ocupacao, "%")} · {formatTimestamp(device.ultima_leitura)}{isStale(device) ? " · Leitura desatualizada" : ""}</p></div>
          <Link href={`/dispositivos/${encodeURIComponent(device.id_dispositivo)}`} className="text-sm font-semibold text-emerald-800 hover:underline">Abrir dispositivo →</Link>
        </li>)}</ul>}
    </section>
  );
}
