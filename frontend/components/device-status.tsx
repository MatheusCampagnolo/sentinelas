import { DeviceStatus, statusLabel } from "@/lib/devices";

const styles: Record<DeviceStatus, string> = {
  ok: "border-status-normal/25 bg-status-normal/10 text-status-normal",
  atencao: "border-status-attention/25 bg-status-attention/10 text-status-attention",
  critico: "border-status-critical/25 bg-status-critical/10 text-status-critical",
  sem_leitura: "border-status-neutral/20 bg-status-neutral/10 text-status-neutral",
};

export function DeviceStatusBadge({ status }: { status?: DeviceStatus | string | null }) {
  const key: DeviceStatus = status && status in styles ? (status as DeviceStatus) : "sem_leitura";
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[key]}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{statusLabel(key)}</span>;
}
