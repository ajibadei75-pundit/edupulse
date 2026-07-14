import { type ReactNode } from "react";

export function PageHero({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden gradient-hero text-white -mt-16 pt-16">
      <div className="absolute inset-0 opacity-25 pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 size-[600px] rounded-full border border-white/15 animate-pulse-ring" />
      </div>
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-16 sm:pt-24 pb-14 sm:pb-20 text-center">
        {eyebrow && <p className="font-ui text-[10px] sm:text-xs uppercase tracking-[0.25em] font-bold text-accent mb-3 sm:mb-4">{eyebrow}</p>}
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="mt-4 sm:mt-5 text-base sm:text-lg text-white/80 max-w-2xl mx-auto text-pretty">{subtitle}</p>}
        {children && <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">{children}</div>}
      </div>
    </section>
  );
}
