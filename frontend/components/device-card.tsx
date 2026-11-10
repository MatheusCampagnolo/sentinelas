import Link from "next/link";
import { Device, formatNumber, formatTimestamp, occupancy } from "@/lib/devices";
import { DeviceStatusBadge } from "@/components/device-status";

function progressTone(status?: string | null) {
  if (status === "critico") return "bg-status-critical";
  if (status === "atencao") return "bg-status-attention";
  if (status === "ok") return "bg-status-normal";
  return "bg-status-neutral";
}

export function DeviceCard({ device }: { device: Device }) {
  const level = occupancy(device);
  const critical = device.status_atual === "critico";
  return (
    <article className={`surface-panel group flex min-w-0 flex-col rounded-xl p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#3a566d] ${critical ? "border-red-400/25" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#31485f] bg-[#0e1f31] text-[#9fb2c5]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {device.tipo === "lixeira" ? <><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" /></> : <><path d="M3 8h18M5 8l1 12h12l1-12M8 8V5h8v3M8 12h8m-8 4h8" /></>}
            </svg>
          </span>
          <div className="min-w-0"><h2 className="truncate text-[15px] font-semibold text-[#f1f5f9]">{device.nome || device.id_dispositivo}</h2><p className="mt-1 truncate text-xs text-[#8295a8]">{device.id_dispositivo} · {device.tipo || "tipo não informado"}</p></div>
        </div>
        <DeviceStatusBadge status={device.status_atual} />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3"><span className="text-sm text-[#a8b7c7]">Ocupação atual</span><span className={`text-base font-semibold ${critical ? "text-red-200" : device.status_atual === "atencao" ? "text-amber-100" : "text-[#e2e8f0]"}`}>{formatNumber(level, "%", 0)}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#263b50]"><div className={`h-full rounded-full transition-[width] duration-500 ${progressTone(device.status_atual)}`} style={{ width: `${level ?? 0}%` }} /></div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#263b50] pt-4">
        <div><p className="text-xs text-[#8295a8]">Bateria</p><p className="mt-1 text-sm font-medium text-[#e2e8f0]">{device.bateria == null ? "Não monitorada" : formatNumber(device.bateria, "%", 0)}</p>{device.bateria != null && <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#263b50]"><div className="h-full rounded-full bg-[#35b8a0]" style={{ width: `${Math.max(0, Math.min(100, device.bateria))}%` }} /></div>}</div>
        <div><p className="text-xs text-[#8295a8]">Última leitura</p><p className="mt-1 text-sm font-medium text-[#e2e8f0]">{formatTimestamp(device.ultima_leitura)}</p></div>
        <div><p className="text-xs text-[#8295a8]">Distância do sensor</p><p className="mt-1 text-sm font-medium text-[#e2e8f0]">{formatNumber(device.distancia_cm, " cm")}</p></div>
        <div><p className="text-xs text-[#8295a8]">Coordenadas</p><p className="mt-1 truncate text-[13px] text-[#b1bfcc]">{device.lat != null && device.long != null ? `${device.lat}, ${device.long}` : "Não cadastradas"}</p></div>
      </div>

      <Link className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#31485f] bg-[#0e1f31] px-3 text-sm font-medium text-[#dbe5ee] transition hover:border-[#35b8a0]/50 hover:bg-[#142a3e] hover:text-white" href={`/dispositivos/${encodeURIComponent(device.id_dispositivo)}`}>
        Ver detalhes <span aria-hidden="true" className="text-[#55c7b2]">↗</span>
      </Link>
    </article>
  );
}
