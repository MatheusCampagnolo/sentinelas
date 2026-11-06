"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DevicesProvider, useDevices } from "@/components/devices-provider";

const links = [
  { label: "Início", href: "/", icon: "home" },
  { label: "Dispositivos", href: "/dispositivos", icon: "devices" },
  { label: "Mapa", href: "/mapa", icon: "map" },
  { label: "Alertas", href: "/alertas", icon: "alerts" },
] as const;

function NavIcon({ name }: { name: (typeof links)[number]["icon"] }) {
  const shared = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (name === "home") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></svg>;
  if (name === "devices") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><rect x="4" y="4" width="16" height="7" rx="1" /><rect x="4" y="14" width="16" height="6" rx="1" /><path d="M8 7h.01M8 17h.01" /></svg>;
  if (name === "map") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15m6-12v15" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
}

function TopBar() {
  const { error, loading, updatedAt } = useDevices();
  const connectionLabel = error ? "API indisponível" : loading ? "Conectando" : "Dados sincronizados";
  const connectionColor = error ? "bg-red-400" : loading ? "bg-amber-300" : "bg-emerald-400";

  return (
    <header className="relative z-[1100] h-16 border-b border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="flex h-full items-center justify-between gap-2 px-3 sm:gap-4 sm:px-7">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-sm font-black text-white shadow-sm sm:h-9 sm:w-9">S</span>
          <span>
            <span className="block text-xs font-bold tracking-[0.1em] sm:text-sm sm:tracking-[0.12em]">SENTINELAS</span>
            <span className="hidden text-[11px] text-slate-500 sm:block">Monitoramento urbano</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-2 sm:gap-3 sm:px-4">
          <span className={`h-2 w-2 rounded-full ${connectionColor} ${!error && !loading ? "animate-pulse" : ""}`} />
          <span className="hidden text-xs font-medium text-slate-700 sm:inline">{connectionLabel}</span>
          {updatedAt && <span className="text-[10px] text-slate-500 sm:border-l sm:border-slate-200 sm:pl-3 sm:text-[11px]">{updatedAt.toLocaleTimeString("pt-BR")}</span>}
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  return (
    <DevicesProvider>
      <div className="min-h-screen bg-slate-50">
        <TopBar />

        <div className="flex min-h-[calc(100dvh-4rem)]">
          <aside className={`${expanded ? "w-56" : "w-16"} hidden shrink-0 border-r border-slate-200 bg-slate-50 text-slate-700 transition-[width] md:block`}>
            <div className={`flex px-2 py-3 ${expanded ? "justify-end" : "justify-center"}`}>
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                aria-label={expanded ? "Recolher navegação" : "Expandir navegação"}
                aria-expanded={expanded}
                title={expanded ? "Recolher navegação" : "Expandir navegação"}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-white"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d={expanded ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} /></svg>
              </button>
            </div>
            <nav aria-label="Navegação principal" className="space-y-1 px-2">
              {links.map(({ label, href, icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={expanded ? undefined : label}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm ${active ? "border-emerald-700 bg-emerald-50 font-semibold text-emerald-900" : "border-transparent text-slate-600 hover:bg-white hover:text-slate-950"} ${expanded ? "justify-start" : "justify-center px-0"}`}
                  >
                    <span className="h-5 w-5 shrink-0"><NavIcon name={icon} /></span>
                    {expanded && <span>{label}</span>}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 w-full flex-1 bg-slate-50 px-4 py-5 pb-24 sm:px-8 sm:py-8 sm:pb-24 md:pb-8">{children}</main>
        </div>

        <nav aria-label="Navegação principal" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[1200] grid grid-cols-4 border-t border-slate-200 bg-white/95 text-slate-600 shadow-[0_-4px_16px_rgb(15_23_42/8%)] backdrop-blur md:hidden">
          {links.map(({ label, href, icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium ${active ? "text-emerald-800" : "text-slate-500"}`}
              >
                <span className="h-5 w-5"><NavIcon name={icon} /></span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </DevicesProvider>
  );
}
