"use client";

import { useMemo, useState } from "react";
import { Monto } from "@/components/app/monto";
import { cn } from "@/lib/utils";
import { simularPlan, type MetodoPago } from "@/lib/finance/deudas";

interface Entrada {
  acreedor: string;
  saldo: number;
  tasaMensual: number;
  cuota: number;
  soloIntereses: boolean;
}

function meses(n: number | null) {
  if (n === null) return "No se termina de pagar";
  const a = Math.floor(n / 12);
  const m = n % 12;
  return [a ? `${a} año${a > 1 ? "s" : ""}` : "", m ? `${m} mes${m > 1 ? "es" : ""}` : ""].filter(Boolean).join(" y ") || "Este mes";
}

export function PlanDeudas({ deudas }: { deudas: Entrada[] }) {
  const [extra, setExtra] = useState(300_000);
  const resultados = useMemo(
    () => (["avalancha", "bola_de_nieve"] as MetodoPago[]).map((m) => simularPlan(deudas, extra, m)),
    [deudas, extra],
  );
  const mejor = resultados[0].interesesTotales <= resultados[1].interesesTotales ? 0 : 1;

  return (
    <div>
      <p className="text-muted-foreground mb-2 text-xs font-medium">Aporte extra al mes, además de las cuotas</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {[0, 200_000, 300_000, 500_000, 1_000_000].map((v) => (
          <button
            key={v}
            onClick={() => setExtra(v)}
            className={cn("rounded-full border px-3 py-1.5 text-sm", extra === v ? "bg-primary text-primary-foreground border-primary" : "bg-card")}
          >
            {v === 0 ? "Nada" : v >= 1_000_000 ? `+$${v / 1_000_000} M` : `+$${v / 1000} mil`}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {resultados.map((r, i) => (
          <div key={r.metodo} className={cn("rounded-xl border p-4", i === mejor && "border-positive bg-positive-soft/40")}>
            <p className="flex items-center justify-between text-sm font-semibold">
              {r.metodo === "avalancha" ? "Avalancha" : "Bola de nieve"}
              {i === mejor && <span className="bg-positive rounded-full px-2 py-0.5 text-[10px] text-white">Recomendado</span>}
            </p>
            <p className="text-muted-foreground mb-3 text-xs">
              {r.metodo === "avalancha" ? "Primero la de mayor interés (ahorra más)" : "Primero la de menor saldo (motiva más)"}
            </p>
            <p className="text-sm">
              Libre de deudas en <strong>{meses(r.meses)}</strong>
            </p>
            <p className="text-sm">
              Intereses totales: <Monto valor={r.interesesTotales} className="font-semibold" />
            </p>
            <ol className="text-muted-foreground mt-2 list-decimal pl-4 text-xs">
              {r.orden.map((o) => (
                <li key={o.acreedor}>
                  {o.acreedor}: {o.mesLiquidada ? `mes ${o.mesLiquidada}` : "—"}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
