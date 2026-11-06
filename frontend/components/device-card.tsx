import Link from "next/link";
import { Device, formatNumber, formatTimestamp } from "@/lib/devices";
import { DeviceStatusBadge } from "@/components/device-status";

export function DeviceCard({ device }: { device: Device }) {
  return (
    <article className="border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-slate-900">{device.nome || device.id_dispositivo}</h2>
          <p className="mt-1 truncate text-xs text-slate-500">{device.id_dispositivo} · {device.tipo || "tipo não informado"}</p>
        </div>
        <DeviceStatusBadge status={device.status_atual} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <div><dt className="text-xs text-slate-500">Ocupação</dt><dd className="mt-1 font-medium">{formatNumber(device.nivel_ocupacao, "%")}</dd></div>
        <div><dt className="text-xs text-slate-500">Distância</dt><dd className="mt-1 font-medium">{formatNumber(device.distancia_cm, " cm")}</dd></div>
        <div><dt className="text-xs text-slate-500">Bateria</dt><dd className="mt-1 font-medium">{device.bateria == null ? "Não monitorada" : formatNumber(device.bateria, "%", 0)}</dd></div>
        <div><dt className="text-xs text-slate-500">Última leitura</dt><dd className="mt-1 font-medium">{formatTimestamp(device.ultima_leitura)}</dd></div>
        <div className="col-span-2"><dt className="text-xs text-slate-500">Coordenadas</dt><dd className="mt-1 font-medium">{device.lat != null && device.long != null ? `${device.lat}, ${device.long}` : "Não cadastradas"}</dd></div>
      </dl>

      <Link className="mt-5 inline-block text-sm font-medium text-emerald-800 hover:underline" href={`/dispositivos/${encodeURIComponent(device.id_dispositivo)}`}>
        Ver detalhes →
      </Link>
    </article>
  );
}
