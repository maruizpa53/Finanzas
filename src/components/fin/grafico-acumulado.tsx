"use client";

import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCOP, formatCOPCorto } from "@/lib/format";

interface Punto {
  dia: number;
  esteMes: number | null;
  mesAnterior: number;
}

/** Gasto acumulado del mes vs. mes anterior. Una sola escala; leyenda siempre visible. */
export function GraficoAcumulado({ datos, alto = 180 }: { datos: Punto[]; alto?: number }) {
  return (
    <div>
      <div className="text-muted-foreground mb-2 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-chart-1 h-0.5 w-4 rounded-full" />
          Este mes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="border-muted-foreground w-4 border-t-2 border-dashed" />
          Mes anterior
        </span>
      </div>
      <div style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={datos} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="relleno-acumulado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="dia" tickLine={false} axisLine={false} ticks={[1, 8, 15, 22, 29]} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <YAxis width={52} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCOPCorto(v)} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <Tooltip
              cursor={{ stroke: "var(--color-border)" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
                    <p className="mb-1 font-medium">Día {label}</p>
                    {payload.map((p) =>
                      p.value != null ? (
                        <p key={String(p.dataKey)} className="text-muted-foreground flex justify-between gap-4">
                          {p.dataKey === "esteMes" ? "Este mes" : "Mes anterior"}
                          <span className="text-foreground monto font-medium">
                            <span>{formatCOP(Number(p.value))}</span>
                          </span>
                        </p>
                      ) : null,
                    )}
                  </div>
                ) : null
              }
            />
            <Line type="monotone" dataKey="mesAnterior" stroke="var(--color-muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} animationDuration={900} animationEasing="ease-out" />
            <Area
              type="monotone"
              dataKey="esteMes"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#relleno-acumulado)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
              connectNulls={false}
              animationDuration={900} animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
