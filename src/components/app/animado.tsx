"use client";

import { useEffect, useRef, useState } from "react";
import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/utils";

const reducido = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Anima un número de 0 al valor final (ease-out). En servidor y en el primer render muestra el valor real. */
function useConteo(valor: number, duracion = 900) {
  const [actual, setActual] = useState(valor);
  const previo = useRef(0);
  useEffect(() => {
    if (reducido()) {
      setActual(valor);
      return;
    }
    const desde = previo.current;
    previo.current = valor;
    const inicio = performance.now();
    let id = 0;
    const paso = (t: number) => {
      const p = Math.min((t - inicio) / duracion, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setActual(Math.round(desde + (valor - desde) * e));
      if (p < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [valor, duracion]);
  return actual;
}

/** Monto que "cuenta" hasta su valor al aparecer. Respeta el modo discreto (.monto). */
export function MontoAnimado({ valor, signo = false, className }: { valor: number; signo?: boolean; className?: string }) {
  const v = useConteo(valor);
  const texto = signo && valor > 0 ? `+${formatCOP(v)}` : formatCOP(v);
  return (
    <span className={cn("monto whitespace-nowrap", className)}>
      <span>{texto}</span>
    </span>
  );
}

export function NumeroAnimado({ valor, sufijo = "", className }: { valor: number; sufijo?: string; className?: string }) {
  const v = useConteo(valor, 700);
  return (
    <span className={cn("tabular", className)}>
      {v.toLocaleString("es-CO")}
      {sufijo}
    </span>
  );
}

/** Anillo de progreso con trazo animado. `valor` entre 0 y 1 (se recorta a 1 para dibujar). */
export function AnilloProgreso({
  valor,
  tamano = 132,
  grosor = 12,
  color = "var(--color-primary)",
  pista = "var(--color-muted)",
  children,
}: {
  valor: number;
  tamano?: number;
  grosor?: number;
  color?: string;
  pista?: string;
  children?: React.ReactNode;
}) {
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const r = (tamano - grosor) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(valor, 1));
  return (
    <div className="relative shrink-0" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} className="-rotate-90">
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke={pista} strokeWidth={grosor} />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={montado ? c * (1 - p) : c}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
