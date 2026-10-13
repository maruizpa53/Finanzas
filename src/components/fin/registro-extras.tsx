"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/format";
import { calcularReparto, type DestinoReparto, type LineaReparto } from "@/lib/finance/reparto";
import type { Ahorro, Cuenta, Deuda, Etiqueta, Proyecto } from "@/lib/finance/modelo";
import { agruparEtiquetas, nombreCuenta } from "@/lib/finance/etiquetas";

/** Grupos que se ven siempre al registrar; el resto queda en "Más etiquetas". */
const GRUPOS_PRINCIPALES = ["Para quién", "Actividad"];

/** Chips de etiquetas agrupadas (varias a la vez, estilo Monarch). */
export function SelectorEtiquetas({ etiquetas, valor, onChange }: { etiquetas: Etiqueta[]; valor: string[]; onChange: (v: string[]) => void }) {
  const [verMas, setVerMas] = useState(false);
  if (!etiquetas.length) return null;
  const alternar = (id: string) => onChange(valor.includes(id) ? valor.filter((x) => x !== id) : [...valor, id]);
  const grupos = agruparEtiquetas(etiquetas);
  const visibles = grupos.filter(([g, es]) => verMas || GRUPOS_PRINCIPALES.includes(g) || es.some((e) => valor.includes(e.id)));
  const ocultas = grupos.length - visibles.length;
  return (
    <div className="grid gap-3">
      {visibles.map(([grupo, es]) => (
        <div key={grupo}>
          <p className="text-muted-foreground mb-1.5 text-xs font-medium">{grupo}</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {es.map((e) => {
              const on = valor.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={on}
                  title={e.descripcion ?? undefined}
                  onClick={() => alternar(e.id)}
                  style={on && e.color ? { backgroundColor: e.color, borderColor: e.color } : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-all active:scale-95",
                    on ? "text-white shadow-sm" : "bg-card",
                  )}
                >
                  <span>{e.emoji}</span>
                  {e.nombre}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {(ocultas > 0 || verMas) && (
        <button type="button" onClick={() => setVerMas((v) => !v)} className="text-primary flex items-center gap-1 justify-self-start text-xs font-medium">
          {verMas ? "Menos etiquetas" : `Más etiquetas (${grupos.filter(([g]) => !GRUPOS_PRINCIPALES.includes(g)).map(([g]) => g.toLowerCase()).join(", ")})`}
          <ChevronDown className={cn("size-3.5 transition-transform", verMas && "rotate-180")} />
        </button>
      )}
    </div>
  );
}

/** Tarjeta grande para marcar un gasto como parte de un viaje/proyecto, con conversión de moneda. */
export function ToggleProyecto({
  proyecto,
  activo,
  onToggle,
  montoExtranjero,
  onMontoExtranjero,
  onCalcularPesos,
}: {
  proyecto: Proyecto;
  activo: boolean;
  onToggle: () => void;
  montoExtranjero: string;
  onMontoExtranjero: (v: string) => void;
  onCalcularPesos: (pesos: number) => void;
}) {
  const moneda = proyecto.moneda && proyecto.moneda !== "COP" ? proyecto.moneda : null;
  const valorExt = Number(montoExtranjero.replace(/[^\d.]/g, "")) || 0;
  const pesos = moneda && proyecto.tasa_cambio && valorExt ? Math.round(valorExt * proyecto.tasa_cambio) : null;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-all",
        activo ? "border-transparent bg-gradient-to-br from-rose-500 to-indigo-600 text-white shadow-lg shadow-rose-500/20" : "bg-card",
      )}
    >
      <button type="button" onClick={onToggle} aria-pressed={activo} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className={cn("text-2xl transition-transform", activo && "scale-110")}>{proyecto.emoji ?? "✈️"}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Gasto de {proyecto.nombre}</span>
          <span className={cn("block text-xs", activo ? "text-white/80" : "text-muted-foreground")}>
            {activo ? "Se suma al presupuesto del viaje" : "Tóquelo si este gasto es del viaje"}
          </span>
        </span>
        <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", activo ? "bg-white/30" : "bg-muted")}>
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", activo ? "left-[22px]" : "left-0.5")} />
        </span>
      </button>
      {activo && moneda && (
        <div className="flex items-center gap-2 border-t border-white/20 px-4 py-3">
          <label htmlFor="monto-ext" className="text-xs whitespace-nowrap text-white/80">
            Monto en {moneda}
          </label>
          <input
            id="monto-ext"
            inputMode="decimal"
            value={montoExtranjero}
            onChange={(e) => onMontoExtranjero(e.target.value.replace(/[^\d.,]/g, "").replace(",", "."))}
            placeholder="Opcional"
            className="min-w-0 flex-1 rounded-lg bg-white/15 px-2 py-1.5 text-sm text-white placeholder:text-white/60 outline-none"
          />
          {pesos !== null && (
            <button type="button" onClick={() => onCalcularPesos(pesos)} className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-rose-600">
              = {formatCOP(pesos)}
            </button>
          )}
        </div>
      )}
      {activo && moneda && !proyecto.tasa_cambio && (
        <p className="px-4 pb-3 text-xs text-white/80">Ponga la tasa de cambio en el proyecto para convertir automáticamente.</p>
      )}
    </div>
  );
}

const DESTINOS: { valor: DestinoReparto; nombre: string; emoji: string }[] = [
  { valor: "cuenta", nombre: "Cuenta", emoji: "🏦" },
  { valor: "deuda", nombre: "Deuda", emoji: "🤝" },
  { valor: "ahorro", nombre: "Ahorro", emoji: "🐷" },
  { valor: "prestamo", nombre: "Prestar", emoji: "🤲" },
];

/** Reparto del ingreso en partes (cuentas propias, deudas, ahorros, préstamos). */
export function EditorReparto({
  ingreso,
  cuentaOrigen,
  lineas,
  onChange,
  cuentas,
  deudas,
  ahorros,
  recordar,
  onRecordar,
}: {
  ingreso: number;
  cuentaOrigen: Cuenta | undefined;
  lineas: LineaReparto[];
  onChange: (l: LineaReparto[]) => void;
  cuentas: Cuenta[];
  deudas: Deuda[];
  ahorros: Ahorro[];
  recordar: boolean;
  onRecordar: (v: boolean) => void;
}) {
  const r = calcularReparto(ingreso, lineas);
  const cambiar = (i: number, cambio: Partial<LineaReparto>) => onChange(lineas.map((l, j) => (j === i ? { ...l, ...cambio } : l)));
  const opciones = (d: DestinoReparto) =>
    d === "cuenta"
      ? cuentas.filter((c) => c.activa && c.id !== cuentaOrigen?.id).map((c) => ({ id: c.id, nombre: nombreCuenta(c) }))
      : d === "deuda"
        ? deudas.filter((x) => x.estado === "activa").map((x) => ({ id: x.id, nombre: x.acreedor }))
        : d === "ahorro"
          ? ahorros.map((x) => ({ id: x.id, nombre: x.nombre }))
          : [];
  const pct = ingreso ? Math.min(r.asignado / ingreso, 1) : 0;

  return (
    <div className="bg-surface grid gap-3 rounded-2xl p-3">
      <div>
        <p className="text-sm font-semibold">¿A dónde se va esta plata?</p>
        <p className="text-muted-foreground text-xs">Reparta el ingreso de una vez: se crean las transferencias, pagos y aportes.</p>
      </div>

      {lineas.map((l, i) => {
        const ops = opciones(l.destino);
        const calc = r.lineas[i]?.monto ?? 0;
        return (
          <div key={i} className="bg-card animate-entrada grid gap-2 rounded-xl p-2.5 shadow-xs">
            <div className="flex gap-1">
              {DESTINOS.map((d) => (
                <button
                  key={d.valor}
                  type="button"
                  onClick={() => cambiar(i, { destino: d.valor, id: null, nombre: undefined })}
                  className={cn("flex-1 rounded-lg px-1 py-1.5 text-[11px] font-medium", l.destino === d.valor ? "bg-primary text-primary-foreground" : "bg-muted")}
                >
                  {d.emoji} {d.nombre}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {l.destino === "prestamo" ? (
                <input
                  value={l.nombre ?? ""}
                  onChange={(e) => cambiar(i, { nombre: e.target.value })}
                  placeholder="¿A quién?"
                  className="border-input h-9 min-w-0 flex-1 rounded-md border bg-transparent px-2 text-sm"
                />
              ) : (
                <select
                  value={l.id ?? ""}
                  onChange={(e) => cambiar(i, { id: e.target.value || null })}
                  className="border-input h-9 min-w-0 flex-1 rounded-md border bg-transparent px-2 text-sm"
                  aria-label="Destino"
                >
                  <option value="">Elegir…</option>
                  {ops.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex overflow-hidden rounded-md border text-xs">
                {(["monto", "porcentaje"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => cambiar(i, { modo: m, valor: 0 })}
                    className={cn("px-2 py-2", l.modo === m ? "bg-primary text-primary-foreground" : "bg-card")}
                  >
                    {m === "monto" ? "$" : "%"}
                  </button>
                ))}
              </div>
              <input
                inputMode="numeric"
                aria-label="Valor"
                value={l.valor ? (l.modo === "monto" ? formatCOP(l.valor) : String(l.valor)) : ""}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(l.modo === "monto" ? /\D/g : /[^\d.]/g, "")) || 0;
                  cambiar(i, { valor: l.modo === "porcentaje" ? Math.min(n, 100) : n });
                }}
                placeholder={l.modo === "monto" ? "$0" : "0"}
                className="border-input h-9 w-24 rounded-md border bg-transparent px-2 text-right text-sm tabular"
              />
              <button type="button" onClick={() => onChange(lineas.filter((_, j) => j !== i))} className="text-muted-foreground p-1" aria-label="Quitar">
                <Trash2 className="size-4" />
              </button>
            </div>
            {l.modo === "porcentaje" && calc > 0 && <p className="text-muted-foreground text-right text-xs">= {formatCOP(calc)}</p>}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => onChange([...lineas, { destino: "cuenta", id: null, modo: "monto", valor: 0 }])}
        className="text-primary flex items-center justify-center gap-1 rounded-xl border border-dashed py-2 text-sm font-medium"
      >
        <Plus className="size-4" /> Agregar parte
      </button>

      {ingreso > 0 && (
        <div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div className={cn("h-full rounded-full transition-all duration-500", r.excede ? "bg-negative" : "bg-primary")} style={{ width: `${pct * 100}%` }} />
          </div>
          <p className={cn("mt-1.5 text-xs", r.excede ? "text-negative font-medium" : "text-muted-foreground")}>
            {r.excede
              ? `Se pasa por ${formatCOP(-r.queda)}`
              : `Repartido ${formatCOP(r.asignado)} · queda ${formatCOP(r.queda)} en ${cuentaOrigen ? nombreCuenta(cuentaOrigen) : "la cuenta"}`}
          </p>
        </div>
      )}

      {lineas.length > 0 && (
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={recordar} onChange={(e) => onRecordar(e.target.checked)} className="accent-primary size-4" />
          Recordar este reparto para el próximo ingreso
        </label>
      )}
    </div>
  );
}
