"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DevicesProvider, useDevices } from "@/components/devices-provider";

const links = [
  { label: "Início", shortLabel: "Início", href: "/", icon: "home" },
  { label: "Dispositivos", shortLabel: "Dispositivos", href: "/dispositivos", icon: "devices" },
  { label: "Mapa", shortLabel: "Mapa", href: "/mapa", icon: "map" },
  { label: "Alertas", shortLabel: "Alertas", href: "/alertas", icon: "alerts" },
  { label: "Sobre", shortLabel: "Sobre", href: "/conheca", icon: "about" },
] as const;

function NavIcon({ name }: { name: (typeof links)[number]["icon"] }) {
  const shared = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (name === "home") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></svg>;
  if (name === "devices") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><rect x="4" y="4" width="16" height="7" rx="1" /><rect x="4" y="14" width="16" height="6" rx="1" /><path d="M8 7h.01M8 17h.01" /></svg>;
  if (name === "map") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15m6-12v15" /></svg>;
  if (name === "alerts") return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1.1 1-1.9 1.3-1.9 2.8M12 17h.01" /></svg>;
}

function TopBar() {
  const { error, loading, updatedAt } = useDevices();
  const connectionLabel = error ? "API indisponível" : loading ? "Conectando" : "Dados sincronizados";
  const connectionColor = error ? "bg-red-400" : loading ? "bg-amber-300" : "bg-[#35b8a0]";

  return (
    <header className="relative z-[1100] h-16 border-b border-[#263b50] bg-[#0b1725] text-white">
      <div className="flex h-full items-center justify-between gap-2 px-3 sm:gap-4 sm:px-7">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/70 bg-[#e8edf2] text-sm font-black text-[#14243a] sm:h-10 sm:w-10">S</span>
          <span>
            <span className="block text-xs font-bold tracking-[0.1em] sm:text-sm sm:tracking-[0.12em]">SENTINELAS</span>
            <span className="hidden text-[11px] text-slate-200 sm:block">Monitoramento urbano</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-[#263b50] bg-[#122438] px-2.5 py-2 sm:gap-3 sm:px-3">
          <span className={`h-2 w-2 rounded-full ${connectionColor} ${!error && !loading ? "animate-pulse" : ""}`} />
          <span className="hidden text-xs font-medium text-slate-100 sm:inline">{connectionLabel}</span>
          {updatedAt && <span className="text-[10px] text-slate-300 sm:border-l sm:border-slate-700 sm:pl-3 sm:text-[11px]">{updatedAt.toLocaleTimeString("pt-BR")}</span>}
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <DevicesProvider>
      <div className="min-h-screen bg-[#0b1725]">
        <TopBar />

        <div className="relative flex min-h-[calc(100dvh-4rem)]">
          <aside className={`${expanded ? "w-56 shadow-2xl" : "w-[4.5rem]"} absolute inset-y-0 left-0 z-[1050] hidden border-r border-[#263b50] bg-[#0d1b2a] text-white transition-[width] duration-200 md:block`}>
            <div className={`flex px-2 py-3 ${expanded ? "justify-end" : "justify-center"}`}>
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                aria-label={expanded ? "Recolher navegação" : "Expandir navegação"}
                aria-expanded={expanded}
                title={expanded ? "Recolher navegação" : "Expandir navegação"}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-100 transition hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              </button>
            </div>
            <nav aria-label="Navegação principal" className="space-y-1 px-2">
              {links.map(({ label, href, icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    onClick={() => setExpanded(false)}
                    href={href}
                    title={expanded ? undefined : label}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${active ? "bg-[#1d344b] font-semibold text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-[#35b8a0]" : "text-slate-300 hover:bg-white/5 hover:text-white"} ${expanded ? "justify-start" : "justify-center px-0"}`}
                  >
                    <span className="h-5 w-5 shrink-0"><NavIcon name={icon} /></span>
                    {expanded && <span>{label}</span>}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {expanded && <button type="button" aria-label="Fechar menu" onClick={() => setExpanded(false)} className="absolute inset-0 z-[1040] hidden cursor-default bg-black/30 md:block" />}

          <main className="ml-0 min-w-0 w-full flex-1 bg-[#0b1725] px-4 py-5 pb-24 sm:px-8 sm:py-8 sm:pb-24 md:ml-[4.5rem] md:pb-8">{children}</main>
        </div>

        <nav aria-label="Navegação principal móvel" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[1200] grid grid-cols-5 border-t border-[#263b50] bg-[#0d1b2a]/95 text-slate-300 shadow-[0_-4px_16px_rgb(15_23_42/24%)] backdrop-blur md:hidden">
          {links.map(({ href, icon, shortLabel }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium ${active ? "text-white" : "text-slate-400"}`}
              >
                <span className="h-5 w-5"><NavIcon name={icon} /></span>
                <span className="truncate">{shortLabel}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </DevicesProvider>
  );
}
