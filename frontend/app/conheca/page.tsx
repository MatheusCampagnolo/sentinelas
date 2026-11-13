import Link from "next/link";

const steps = [
  { number: "01", title: "Coleta de dados", text: "O sensor ultrassônico HC-SR04 mede a distância até o conteúdo. O ESP32 reúne amostras e estima a ocupação do dispositivo.", icon: "sensor" },
  { number: "02", title: "Comunicação", text: "A cada dois segundos, o ESP32 envia uma leitura por HTTPS para a API do SENTINELAS.", icon: "signal" },
  { number: "03", title: "Processamento", text: "A leitura passa pela API, é enfileirada para processamento e atualiza o registro do dispositivo e seu histórico.", icon: "data" },
  { number: "04", title: "Monitoramento", text: "O painel consulta os dispositivos periodicamente e classifica a ocupação como normal, atenção ou crítica.", icon: "monitor" },
  { number: "05", title: "Planejamento", text: "O mapa ajuda a localizar os pontos. O planejamento de rota usa coordenadas disponíveis e estimativas do serviço de rotas.", icon: "route" },
] as const;

const team = ["Matheus Messias", "Rafaella Augusto", "Felipe Campos", "Mariana Luckner", "Lyan"];

function LineIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "sensor") return <svg viewBox="0 0 24 24" {...common}><path d="M12 3v3m0 12v3M3 12h3m12 0h3M7.8 7.8l2.1 2.1m4.2 4.2 2.1 2.1m0-8.4-2.1 2.1m-4.2 4.2-2.1 2.1"/><circle cx="12" cy="12" r="3"/></svg>;
  if (name === "signal") return <svg viewBox="0 0 24 24" {...common}><path d="M5 9a10 10 0 0 1 14 0M8 12a6 6 0 0 1 8 0m-5 3a2 2 0 0 1 2 0M12 18h.01"/></svg>;
  if (name === "data") return <svg viewBox="0 0 24 24" {...common}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5m-16 7v7c0 1.7 3.6 3 8 3 2.1 0 4-.3 5.5-.9"/></svg>;
  if (name === "monitor") return <svg viewBox="0 0 24 24" {...common}><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4m-5-8 3-3 2 2 4-5"/></svg>;
  if (name === "route") return <svg viewBox="0 0 24 24" {...common}><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/></svg>;
  return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-1.1 1-1.8 1.3-1.8 2.8m0 3h.01"/></svg>;
}

export default function ConhecaPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 pb-8 sm:space-y-24">
      <section className="relative isolate overflow-hidden rounded-3xl border border-[#263b50] bg-[#102337] px-6 py-9 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div aria-hidden="true" className="absolute -right-24 -top-28 -z-10 h-96 w-96 rounded-full border border-[#35b8a0]/15 bg-[radial-gradient(circle_at_center,rgba(53,184,160,0.16),transparent_68%)]" />
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#67d2bd]"><span className="h-px w-7 bg-[#35b8a0]"/>Apresentação do projeto</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#f1f5f9] sm:text-6xl">SENTINELAS</h1>
            <p className="mt-3 text-xl font-medium text-[#9eb2c5] sm:text-2xl">Monitoramento urbano inteligente.</p>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#b2c1ce] sm:text-base">Um sistema conectado para acompanhar lixeiras e bueiros, reconhecer pontos que pedem atenção e apoiar o planejamento da manutenção urbana. O SENTINELAS transforma medições em informação acessível para decisões mais preventivas.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/mapa" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#35b8a0] px-4 text-sm font-semibold text-[#08201f] transition hover:bg-[#55ceb7]">Explorar o mapa <span aria-hidden="true">↗</span></Link><Link href="/dispositivos" className="inline-flex min-h-11 items-center rounded-lg border border-[#37526a] px-4 text-sm font-medium text-[#d7e2eb] transition hover:bg-white/5">Ver dispositivos</Link></div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-5 rounded-full border border-dashed border-[#35b8a0]/25"/><div className="absolute inset-12 rounded-full border border-[#35b8a0]/15"/>
            <div className="relative grid aspect-square place-items-center rounded-full bg-[#0b1725]/50">
              <div className="absolute left-[17%] top-[24%] h-3 w-3 rounded-full bg-[#35b8a0] shadow-[0_0_22px_6px_rgba(53,184,160,.5)]"/><div className="absolute right-[20%] top-[34%] h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_22px_6px_rgba(251,191,36,.35)]"/><div className="absolute bottom-[24%] right-[28%] h-3 w-3 rounded-full bg-red-400 shadow-[0_0_22px_6px_rgba(248,113,113,.35)]"/>
              <svg viewBox="0 0 320 320" className="absolute inset-0 h-full w-full text-[#35b8a0]/40" fill="none" aria-hidden="true"><path d="M48 99h81l35 38 67-5 39 39-26 67h-66l-45 35-58-26 5-55-49-42z" stroke="currentColor" strokeWidth="2"/><path d="m48 99 67 91-30 57m44-148 40 38-22 67 75 24 49-67m-102-24 58 50-14 67" stroke="currentColor" strokeWidth="1.5"/><circle cx="164" cy="137" r="6" fill="#35b8a0"/><circle cx="231" cy="132" r="5" fill="#fbbf24"/><circle cx="218" cy="229" r="5" fill="#f87171"/></svg>
              <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-2xl border border-[#35b8a0]/35 bg-[#122438]/95 shadow-2xl shadow-black/30"><span className="text-3xl font-bold text-[#e6f2f4]">S</span><span className="text-[8px] font-semibold tracking-[.2em] text-[#69cbb9]">URBANO</span></div>
            </div>
            <div className="absolute -bottom-1 left-0 rounded-lg border border-[#263b50] bg-[#122438] px-3 py-2 text-[11px] text-[#aebdca]"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#35b8a0]"/>Dados conectados à cidade</div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-7 max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#35b8a0]">O desafio urbano</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f1f5f9] sm:text-3xl">Cuidar melhor começa por saber onde agir.</h2><p className="mt-3 text-[15px] leading-7 text-[#a8b7c7]">Sem visibilidade contínua, o acúmulo de resíduos e os pontos que precisam de acompanhamento preventivo podem passar despercebidos. Priorizar atendimentos também se torna mais difícil quando a informação está dispersa.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{n:"01",t:"Acúmulo de resíduos",d:"A ocupação muda ao longo do tempo e requer acompanhamento."},{n:"02",t:"Pontos de coleta",d:"Lixeiras precisam de visibilidade para apoiar a manutenção."},{n:"03",t:"Prevenção urbana",d:"Bueiros também pedem atenção preventiva e acompanhamento."},{n:"04",t:"Prioridades claras",d:"Dados centralizados ajudam a identificar locais que exigem atenção."}].map((item)=><article key={item.n} className="surface-panel group rounded-xl p-5 transition duration-200 hover:-translate-y-1 hover:border-[#35b8a0]/40"><span className="text-xs font-semibold tracking-widest text-[#55c9b4]">{item.n}</span><h3 className="mt-5 text-base font-semibold text-[#e8eef4]">{item.t}</h3><p className="mt-2 text-sm leading-6 text-[#94a3b8]">{item.d}</p></article>)}</div>
        <div className="mt-4 flex gap-3 rounded-xl border border-[#35b8a0]/20 bg-[#35b8a0]/[.06] p-4 sm:p-5"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#35b8a0]/10 text-[#65d4bf]"><LineIcon name="about"/></span><p className="text-sm leading-6 text-[#b7c7d3]">O SENTINELAS reúne a telemetria dos dispositivos em um painel centralizado, oferecendo uma leitura mais clara dos pontos monitorados para apoiar a gestão e a manutenção urbana.</p></div>
      </section>

      <section>
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#35b8a0]">Do sensor à informação</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f1f5f9] sm:text-3xl">Como funciona</h2></div><p className="max-w-md text-sm leading-6 text-[#94a3b8]">Uma cadeia conectada que atualiza o estado dos dispositivos e o apresenta no dashboard.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{steps.map((step)=><article key={step.number} className="surface-panel relative rounded-xl p-5 transition duration-200 hover:border-[#35b8a0]/40"><div className="flex items-center justify-between"><span className="text-xs font-semibold tracking-widest text-[#55c9b4]">{step.number}</span><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#35b8a0]/10 text-[#62cbb7]"><span className="h-5 w-5"><LineIcon name={step.icon}/></span></span></div><h3 className="mt-5 text-base font-semibold text-[#e8eef4]">{step.title}</h3><p className="mt-2 text-sm leading-6 text-[#a8b7c7]">{step.text}</p></article>)}</div>
        <p className="mt-3 text-sm leading-6 text-[#8295a8]">Os status refletem a ocupação estimada. O planejamento de rota é uma ferramenta de apoio e usa as coordenadas disponíveis e estimativas de trajeto; não representa despacho automático nem considera condições de trânsito em tempo real.</p>
      </section>

      <section>
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#35b8a0]">Quem desenvolve</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f1f5f9] sm:text-3xl">Conheça nossa equipe</h2>
          {/* <p className="mt-3 max-w-2xl text-sm leading-6 text-[#94a3b8]">Cinco integrantes, unidos pelo desenvolvimento de uma proposta de tecnologia aplicada à cidade.</p> */}
          </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{team.map((name,index)=>{const initials=name.split(" ").map((part)=>part[0]).join("").slice(0,2).toUpperCase();return <article key={name} className="surface-panel group rounded-xl p-4 transition duration-200 hover:-translate-y-1 hover:border-[#35b8a0]/40 sm:p-5"><div className="relative grid aspect-[4/4.5] place-items-center overflow-hidden rounded-lg border border-[#2a4357] bg-[radial-gradient(circle_at_50%_30%,rgba(53,184,160,.16),transparent_58%),#0d1b2a]"><span className="text-4xl font-semibold tracking-tight text-[#d7ebe8]">{initials}</span><span className="absolute bottom-3 right-3 grid h-6 w-6 place-items-center rounded-full border border-[#35b8a0]/35 bg-[#122438] text-[10px] font-semibold text-[#6bd2bf]">{String(index+1).padStart(2,"0")}</span></div><h3 className="mt-4 text-base font-semibold text-[#e8eef4]">{name}</h3><p className="mt-1 text-xs text-[#8295a8]">Equipe de desenvolvimento</p></article>})}</div>
        {/* <p className="mt-3 text-sm text-[#8295a8]">Os avatares tipográficos podem ser substituídos por fotografias da equipe futuramente.</p> */}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#2b4c5b] bg-[linear-gradient(115deg,#102337,#12333b_58%,#102337)] p-6 sm:p-9"><div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71d8c3]">Tecnologia a serviço do cuidado</p><h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-[#f1f5f9] sm:text-3xl">Dados que ajudam a orientar a manutenção urbana.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#b2c1ce]">O propósito do SENTINELAS é apoiar o monitoramento inteligente, a prevenção e a organização do atendimento — usando conectividade e informação para contribuir com a sustentabilidade e a qualidade de vida urbana.</p></div><Link href="/mapa" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#5dcbb6]/40 bg-[#35b8a0]/10 px-4 text-sm font-semibold text-[#b6f1e5] transition hover:bg-[#35b8a0]/20">Voltar ao mapa <span aria-hidden="true">↗</span></Link></div></section>
    </div>
  );
}
