"use client";

import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCOP, formatCOPCorto } from "@/lib/format";

interface Punto {
  dia: number;
  esteMes: number | null;
  mesAnterior: number;
}

/** Gasto acumulado del mes vs. mes anterior. Una sola escala; leyenda siempre visible. */
export function GraficoAcumulado({
  datos,
  alto = 180,
  compacto = false,
  sobreOscuro = false,
}: {
  datos: Punto[];
  alto?: number;
  compacto?: boolean;
  sobreOscuro?: boolean;
}) {
  const colorActual = sobreOscuro ? "oklch(0.85 0.1 270)" : "var(--color-chart-1)";
  const colorAnterior = sobreOscuro ? "oklch(1 0 0 / 35%)" : "var(--color-muted-foreground)";
  return (
    <div>
      {!compacto && (
        <div className="text-muted-foreground mb-2 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: colorActual }} />
            Este mes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: colorAnterior }} />
            Mes anterior
          </span>
        </div>
      )}
      <div style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={datos} margin={{ top: 4, right: 4, bottom: 0, left: compacto ? 4 : 0 }}>
            <defs>
              <linearGradient id={`relleno-${sobreOscuro}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorActual} stopOpacity={0.28} />
                <stop offset="100%" stopColor={colorActual} stopOpacity={0} />
              </linearGradient>
            </defs>
            {!compacto && <CartesianGrid vertical={false} stroke="var(--color-border)" />}
            <XAxis
              dataKey="dia"
              hide={compacto}
              tickLine={false}
              axisLine={false}
              ticks={[1, 8, 15, 22, 29]}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              hide={compacto}
              width={52}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCOPCorto(v)}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
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
            <Line
              type="monotone"
              dataKey="mesAnterior"
              stroke={colorAnterior}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="esteMes"
              stroke={colorActual}
              strokeWidth={2}
              fill={`url(#relleno-${sobreOscuro})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
