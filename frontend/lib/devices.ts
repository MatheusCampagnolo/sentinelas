export type DeviceStatus = "ok" | "atencao" | "critico" | "sem_leitura";

export type Device = {
  id_dispositivo: string;
  nome?: string;
  tipo?: string;
  lat?: number | null;
  long?: number | null;
  nivel_ocupacao?: number | null;
  distancia_cm?: number | null;
  bateria?: number | null;
  status_atual?: DeviceStatus | string | null;
  ultima_leitura?: number | null;
};

export const STATUS_LABEL: Record<DeviceStatus, string> = {
  ok: "Normal",
  atencao: "Atenção",
  critico: "Crítico",
  sem_leitura: "Sem leitura",
};

export function statusLabel(status?: Device["status_atual"]) {
  if (status && status in STATUS_LABEL) return STATUS_LABEL[status as DeviceStatus];
  return "Sem leitura";
}

export function occupancy(device: Device) {
  const value = Number(device.nivel_ocupacao);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
}

export function formatNumber(value: number | null | undefined, suffix = "", decimals = 1) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: decimals })}${suffix}`;
}

export function formatTimestamp(value?: number | null) {
  if (!value || !Number.isFinite(Number(value))) return "Sem leitura";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(value)));
}

export function isStale(device: Device, maxAgeMs = 15_000) {
  return !device.ultima_leitura || Date.now() - Number(device.ultima_leitura) > maxAgeMs;
}

export async function fetchDevices(): Promise<Device[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("Configure NEXT_PUBLIC_API_BASE_URL no arquivo frontend/.env.local.");

  const response = await fetch(`${baseUrl}/dispositivos`, { cache: "no-store" });
  if (!response.ok) throw new Error(`A API respondeu HTTP ${response.status}.`);

  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("A API não retornou uma lista de dispositivos.");

  return data.filter(
    (item): item is Device =>
      typeof item === "object" && item !== null && typeof (item as Device).id_dispositivo === "string",
  );
}
