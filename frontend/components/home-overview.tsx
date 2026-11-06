"use client";

import Link from "next/link";
import { useDevices } from "@/components/devices-provider";

export function HomeOverview() {
  const { devices, loading, error, updatedAt } = useDevices();
  const critical = devices.filter((device) => device.status_atual === "critico");
  const attention = devices.filter((device) => device.status_atual === "atencao");
  const needsAttention = [...critical, ...attention].slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-emerald-200/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-52 w-72 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="relative grid gap-10 px-7 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-14 lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-900">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
              Plataforma de monitoramento urbano
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
              A cidade avisa.<br /><span className="text-emerald-800">A equipe chega antes.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              O Sentinelas acompanha bueiros e lixeiras conectados, destaca pontos que precisam de atenção e ajuda a equipe de manutenção a decidir por onde começar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dispositivos" className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900">
                Acompanhar dispositivos <span aria-hidden="true">→</span>
              </Link>
              <Link href="/mapa" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
                Explorar mapa
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              {error ? "A API está temporariamente indisponível." : loading ? "Conectando aos pontos monitorados…" : `${devices.length} ponto(s) conectado(s)`}
              {updatedAt && !error ? ` · atualização às ${updatedAt.toLocaleTimeString("pt-BR")}` : ""}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-emerald-200/45 via-cyan-100/50 to-transparent blur-xl" />
            <div className="relative rounded-[1.6rem] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div><p className="text-xs text-slate-500">Central de operações</p><h2 className="mt-1 font-semibold text-slate-900">Situação dos pontos</h2></div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-800">Ao vivo</span>
              </div>
              <div className="grid grid-cols-3 gap-3 py-5">
                <div><p className="text-xs text-slate-500">Monitorados</p><p className="mt-1 text-2xl font-semibold text-slate-900">{loading ? "—" : devices.length}</p></div>
                <div><p className="text-xs text-slate-500">Críticos</p><p className="mt-1 text-2xl font-semibold text-red-700">{loading ? "—" : critical.length}</p></div>
                <div><p className="text-xs text-slate-500">Atenção</p><p className="mt-1 text-2xl font-semibold text-amber-700">{loading ? "—" : attention.length}</p></div>
              </div>
              <div className="space-y-2">
                {needsAttention.length ? needsAttention.map((device) => <div key={device.id_dispositivo} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex min-w-0 items-center gap-3"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${device.status_atual === "critico" ? "bg-red-600" : "bg-amber-500"}`} /><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{device.nome || device.id_dispositivo}</p><p className="text-[11px] text-slate-500">{device.id_dispositivo} · {device.tipo || "dispositivo"}</p></div></div>
                  <span className={`shrink-0 text-xs font-medium ${device.status_atual === "critico" ? "text-red-700" : "text-amber-800"}`}>{device.nivel_ocupacao == null ? statusText(device.status_atual) : `${device.nivel_ocupacao}%`}</span>
                </div>) : <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">{loading ? "Recebendo leituras…" : "Nenhum ponto crítico ou em atenção agora."}</p>}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500"><span>Atualização automática</span><span>A cada 5 segundos</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="grid gap-10 py-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">Como funciona</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Da leitura à ação, em um só fluxo.</h2>
          <p className="mt-4 max-w-md leading-7 text-slate-600">Sensores no local enviam medições para a nuvem. A equipe acompanha a situação atual e pode organizar o atendimento dos pontos no mapa.</p>
        </div>
        <ol className="divide-y divide-slate-200 border-y border-slate-200">
          {[
            ["01", "Medir", "O sensor ultrassônico acompanha a distância até o material acumulado."],
            ["02", "Processar", "O ESP32 envia a leitura; a AWS atualiza o estado e mantém o histórico."],
            ["03", "Priorizar", "O painel destaca os pontos críticos e apresenta uma sugestão de deslocamento."],
          ].map(([number, title, description]) => <li key={number} className="grid gap-3 py-5 sm:grid-cols-[3rem_8rem_1fr] sm:items-start"><span className="font-mono text-sm text-emerald-800">{number}</span><h3 className="font-semibold text-slate-950">{title}</h3><p className="text-sm leading-6 text-slate-600">{description}</p></li>)}
        </ol>
      </section>

      <section className="mb-8 flex flex-col gap-5 rounded-3xl bg-emerald-50 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-9">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Operação</p><h2 className="mt-2 text-2xl font-semibold text-slate-950">Veja onde a equipe pode agir primeiro.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Abra o mapa para localizar dispositivos, consultar seus dados e solicitar uma rota a partir da base da equipe na UniMAX Campus I.</p></div>
        <Link href="/mapa" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900">Abrir mapa <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}

function statusText(status?: string | null) {
  return status === "critico" ? "Crítico" : status === "atencao" ? "Atenção" : "Sem leitura";
}
