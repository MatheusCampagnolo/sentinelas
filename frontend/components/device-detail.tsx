"use client";

import Link from "next/link";
import { useDevices } from "@/components/devices-provider";

export function DeviceDetail({ id }: { id: string }) {
  const { devices, loading, error } = useDevices();
  const device = devices.find((item) => item.id_dispositivo === id);

  if (loading && !device) return <p>Carregando dispositivo…</p>;
  if (!device) return <section><h1 className="text-2xl font-bold">Dispositivo não encontrado</h1><p className="mt-2 text-slate-600">Verifique se ele está cadastrado na resposta de GET /dispositivos.</p><Link href="/dispositivos" className="mt-4 inline-block text-emerald-800 underline">← Voltar à lista</Link></section>;

  return (
    <section className="max-w-3xl">
      <Link href="/dispositivos" className="text-sm text-emerald-900 underline">← Dispositivos</Link>
      <h1 className="mt-5 text-2xl font-semibold">{device.nome || device.id_dispositivo}</h1>
      {error && <p role="alert" className="mt-3 text-sm text-amber-800">A última consulta falhou; os dados exibidos podem estar desatualizados.</p>}
      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-6 text-slate-700">
        {JSON.stringify(device, null, 2)}
      </pre>
    </section>
  );
}
