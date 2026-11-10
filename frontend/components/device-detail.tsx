"use client";

import Link from "next/link";
import { useDevices } from "@/components/devices-provider";
import { DeviceStatusBadge } from "@/components/device-status";
import { formatNumber, formatTimestamp, isStale, occupancy } from "@/lib/devices";

export function DeviceDetail({ id }: { id: string }) {
  const { devices, loading, error } = useDevices();
  const device = devices.find((item) => item.id_dispositivo === id);

  if (loading && !device) return <p className="text-sm text-[#94a3b8]">Carregando dispositivo…</p>;
  if (!device) return <section className="surface-panel max-w-2xl rounded-xl p-6"><h1 className="text-2xl font-semibold text-[#f1f5f9]">Dispositivo não encontrado</h1><p className="mt-2 text-sm text-[#94a3b8]">Verifique se ele está cadastrado na resposta de GET /dispositivos.</p><Link href="/dispositivos" className="mt-4 inline-flex text-sm font-medium text-[#63cdb8] hover:text-[#94e5d8]">← Voltar à lista</Link></section>;

  const metrics = [
    ["Ocupação", formatNumber(occupancy(device), "%", 0)],
    ["Distância", formatNumber(device.distancia_cm, " cm")],
    ["Bateria", device.bateria == null ? "Não monitorada" : formatNumber(device.bateria, "%", 0)],
    ["Última leitura", formatTimestamp(device.ultima_leitura)],
  ];

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <Link href="/dispositivos" className="inline-flex text-sm font-medium text-[#63cdb8] transition hover:text-[#94e5d8]">← Dispositivos</Link>
      <header className="flex flex-col gap-4 rounded-xl border border-[#263b50] bg-[#122438] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Detalhes do ponto</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#f1f5f9]">{device.nome || device.id_dispositivo}</h1><p className="mt-1 text-sm text-[#94a3b8]">{device.id_dispositivo} · {device.tipo || "tipo não informado"}</p></div><DeviceStatusBadge status={device.status_atual} /></header>
      {error && <p role="alert" className="rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-200">A última consulta falhou; os dados exibidos podem estar desatualizados.</p>}
      {isStale(device) && <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">A última leitura está desatualizada.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <article key={label} className="surface-panel rounded-xl p-5"><p className="text-xs text-[#94a3b8]">{label}</p><p className="mt-3 break-words text-lg font-semibold text-[#e8eef4]">{value}</p></article>)}</div>
      <article className="surface-panel rounded-xl p-5 sm:p-6"><h2 className="text-base font-semibold text-[#e8eef4]">Dados técnicos</h2><dl className="mt-4 grid gap-4 border-t border-[#263b50] pt-4 sm:grid-cols-2"><div><dt className="text-xs text-[#8295a8]">Coordenadas</dt><dd className="mt-1 break-all font-mono text-sm text-[#c4d0dc]">{device.lat != null && device.long != null ? `${device.lat}, ${device.long}` : "Não cadastradas"}</dd></div><div><dt className="text-xs text-[#8295a8]">Tipo</dt><dd className="mt-1 text-sm text-[#c4d0dc]">{device.tipo || "Não informado"}</dd></div><div><dt className="text-xs text-[#8295a8]">Identificador</dt><dd className="mt-1 break-all font-mono text-sm text-[#c4d0dc]">{device.id_dispositivo}</dd></div></dl></article>
    </section>
  );
}
