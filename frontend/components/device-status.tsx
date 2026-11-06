import { DeviceStatus, statusLabel } from "@/lib/devices";

const styles: Record<DeviceStatus, string> = {
  ok: "bg-emerald-100 text-emerald-800",
  atencao: "bg-amber-100 text-amber-900",
  critico: "bg-red-100 text-red-800",
  sem_leitura: "bg-slate-100 text-slate-700",
};

export function DeviceStatusBadge({ status }: { status?: DeviceStatus | string | null }) {
  const key: DeviceStatus = status && status in styles ? (status as DeviceStatus) : "sem_leitura";
  return <span className={`inline-flex border px-2 py-1 text-xs font-semibold ${styles[key]}`}>{statusLabel(key)}</span>;
}
