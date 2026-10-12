"use client";

import { Bar, BarChart, CartesianGrid, Layer, Rectangle, ResponsiveContainer, Sankey, Tooltip, XAxis, YAxis } from "recharts";
import { formatCOP, formatCOPCorto } from "@/lib/format";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function GraficoTendencia({ datos }: { datos: { anio: number; mes: number; ingresos: number; gastos: number }[] }) {
  const filas = datos.map((d) => ({ ...d, etiqueta: MESES[d.mes - 1] }));
  return (
    <div>
      <div className="text-muted-foreground mb-2 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-chart-3 size-2.5 rounded-sm" />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-chart-1 size-2.5 rounded-sm" />
          Gastos
        </span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filas} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <YAxis width={52} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCOPCorto(v)} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
            <Tooltip
              cursor={{ fill: "var(--color-accent)", opacity: 0.4 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="bg-popover rounded-lg border px-3 py-2 text-xs shadow-md">
                    <p className="mb-1 font-medium capitalize">{label}</p>
                    {payload.map((p) => (
                      <p key={String(p.dataKey)} className="text-muted-foreground flex justify-between gap-4">
                        {p.dataKey === "ingresos" ? "Ingresos" : "Gastos"}
                        <span className="text-foreground monto font-medium">
                          <span>{formatCOP(Number(p.value))}</span>
                        </span>
                      </p>
                    ))}
                  </div>
                ) : null
              }
            />
            <Bar dataKey="ingresos" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={900} animationEasing="ease-out" />
            <Bar dataKey="gastos" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={900} animationEasing="ease-out" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface NodoSankey {
  name: string;
}

export function FlujoSankey({ nodos, enlaces }: { nodos: NodoSankey[]; enlaces: { source: number; target: number; value: number }[] }) {
  if (!enlaces.length) return <p className="text-muted-foreground py-8 text-center text-sm">Aún no hay movimientos este mes.</p>;
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={{ nodes: nodos, links: enlaces }}
          nodePadding={14}
          nodeWidth={10}
          margin={{ top: 8, right: 140, bottom: 8, left: 8 }}
          link={{ stroke: "var(--color-chart-2)", strokeOpacity: 0.35 }}
          node={({ x, y, width, height, index, payload }: { x: number; y: number; width: number; height: number; index: number; payload: { name: string; value: number } }) => (
            <Layer key={`n-${index}`}>
              <Rectangle x={x} y={y} width={width} height={height} fill="var(--color-chart-1)" radius={2} />
              <text x={x + width + 6} y={y + height / 2} dy={4} fontSize={11} fill="var(--color-foreground)">
                {payload.name} · {formatCOPCorto(payload.value)}
              </text>
            </Layer>
          )}
        >
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="bg-popover rounded-lg border px-3 py-2 text-xs shadow-md">
                  {String(payload[0].name)}: <span className="monto font-medium"><span>{formatCOP(Number(payload[0].value))}</span></span>
                </div>
              ) : null
            }
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
