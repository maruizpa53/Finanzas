"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Recordatorio {
  id: string;
  emoji: string;
  titulo: string;
  texto: string;
  href: string;
  /** Clases del degradado de fondo. */
  tono: "violeta" | "ambar" | "rosa" | "verde" | "azul" | "rojo";
}

const TONOS: Record<Recordatorio["tono"], string> = {
  violeta: "from-indigo-500 to-violet-600",
  ambar: "from-amber-400 to-orange-500",
  rosa: "from-rose-500 to-fuchsia-600",
  verde: "from-emerald-500 to-teal-600",
  azul: "from-sky-500 to-blue-600",
  rojo: "from-red-500 to-rose-600",
};

/** Carrusel de recordatorios que rota solo (se pausa al tocarlo o con el puntero encima). */
export function BannerRecordatorios({ items, intervalo = 5500 }: { items: Recordatorio[]; intervalo?: number }) {
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const toqueX = useRef<number | null>(null);
  const n = items.length;

  useEffect(() => {
    if (n < 2 || pausa) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), intervalo);
    return () => clearInterval(id);
  }, [n, pausa, intervalo]);

  if (!n) return null;
  const actual = items[i % n];

  return (
    <div
      className="relative mb-4 select-none lg:mb-6"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onTouchStart={(e) => {
        toqueX.current = e.touches[0].clientX;
        setPausa(true);
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (toqueX.current ?? 0);
        if (Math.abs(dx) > 40) setI((x) => (x + (dx < 0 ? 1 : -1) + n) % n);
        toqueX.current = null;
        setTimeout(() => setPausa(false), 4000);
      }}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Recordatorios"
    >
      <Link
        key={actual.id}
        href={actual.href}
        className={cn("animate-deslizar relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r px-4 py-3 text-white shadow-md", TONOS[actual.tono])}
      >
        <span className="pointer-events-none absolute -top-8 -right-6 size-24 rounded-full bg-white/15 blur-xl" />
        <span className="animate-latido flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl">{actual.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-sm leading-snug font-semibold">{actual.titulo}</span>
          <span className="block truncate text-xs text-white/85">{actual.texto}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-white/80" />
        {n > 1 && !pausa && (
          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20">
            <span key={`p-${i}`} className="block h-full origin-left bg-white/70" style={{ animation: `llenar ${intervalo}ms linear both` }} />
          </span>
        )}
      </Link>
      {n > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {items.map((it, j) => (
            <button
              key={it.id}
              type="button"
              aria-label={`Recordatorio ${j + 1}`}
              onClick={() => setI(j)}
              className={cn("h-1.5 rounded-full transition-all", j === i % n ? "bg-primary w-5" : "bg-muted-foreground/30 w-1.5")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
