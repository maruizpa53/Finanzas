// Proyectos y viajes (estilo TravelSpend): presupuesto, fechas y gasto por etiqueta.
import type { Categoria, Movimiento, Proyecto } from "./modelo";
import { diasEntre } from "./mes";

export interface ResumenProyecto {
  gastado: number;
  presupuesto: number | null;
  restante: number | null;
  porcentaje: number | null;
  /** Días que faltan para empezar (null si no hay fecha o ya empezó). */
  diasParaEmpezar: number | null;
  duracion: number | null;
  /** Día actual del viaje (1 = primer día) si está en curso. */
  diaActual: number | null;
  estado: "sin_fechas" | "planeando" | "en_curso" | "terminado";
  /** Lo que se puede gastar por día desde hoy hasta el final sin pasarse. */
  porDiaDisponible: number | null;
  /** Gasto hecho dentro de las fechas del viaje dividido por los días transcurridos. */
  promedioDiario: number | null;
  porCategoria: { categoriaId: string | null; nombre: string; icono: string | null; total: number }[];
  movimientos: Movimiento[];
  /** Gastado expresado en la moneda del proyecto (si hay tasa). */
  gastadoMonedaLocal: number | null;
}

/** Gasto neto de una lista: gastos suman, ingresos (reintegros) restan, transferencias no cuentan. */
function neto(movs: Movimiento[]) {
  return movs.reduce((s, m) => s + (m.tipo === "gasto" ? m.monto : m.tipo === "ingreso" ? -m.monto : 0), 0);
}

export function resumenProyecto(p: Proyecto, todos: Movimiento[], categorias: Categoria[], hoy: string): ResumenProyecto {
  const movimientos = p.tag_id ? todos.filter((m) => m.etiquetas.includes(p.tag_id!) && m.tipo !== "transferencia" && m.tipo !== "pago_tarjeta") : [];
  const gastado = neto(movimientos);
  const presupuesto = p.presupuesto;
  const restante = presupuesto === null ? null : presupuesto - gastado;
  const porcentaje = presupuesto ? gastado / presupuesto : null;

  let estado: ResumenProyecto["estado"] = "sin_fechas";
  let diasParaEmpezar: number | null = null;
  let duracion: number | null = null;
  let diaActual: number | null = null;
  let porDiaDisponible: number | null = null;
  let promedioDiario: number | null = null;

  if (p.fecha_inicio) {
    const fin = p.fecha_fin ?? p.fecha_inicio;
    duracion = diasEntre(p.fecha_inicio, fin) + 1;
    if (hoy < p.fecha_inicio) {
      estado = "planeando";
      diasParaEmpezar = diasEntre(hoy, p.fecha_inicio);
      if (restante !== null) porDiaDisponible = Math.floor(Math.max(restante, 0) / duracion);
    } else if (hoy <= fin) {
      estado = "en_curso";
      diaActual = diasEntre(p.fecha_inicio, hoy) + 1;
      const quedan = duracion - diaActual + 1;
      if (restante !== null) porDiaDisponible = Math.floor(Math.max(restante, 0) / quedan);
    } else {
      estado = "terminado";
      diaActual = duracion;
    }
    if (diaActual) {
      const durante = movimientos.filter((m) => m.fecha >= p.fecha_inicio! && m.fecha <= fin);
      promedioDiario = Math.round(neto(durante) / diaActual);
    }
  }

  const porId = new Map(categorias.map((c) => [c.id, c]));
  const acum = new Map<string | null, number>();
  for (const m of movimientos) acum.set(m.categoria_id, (acum.get(m.categoria_id) ?? 0) + (m.tipo === "gasto" ? m.monto : -m.monto));
  const porCategoria = [...acum.entries()]
    .map(([categoriaId, total]) => ({
      categoriaId,
      nombre: (categoriaId && porId.get(categoriaId)?.nombre) || "Sin categoría",
      icono: (categoriaId && porId.get(categoriaId)?.icono) || null,
      total,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    gastado,
    presupuesto,
    restante,
    porcentaje,
    diasParaEmpezar,
    duracion,
    diaActual,
    estado,
    porDiaDisponible,
    promedioDiario,
    porCategoria,
    movimientos,
    gastadoMonedaLocal: p.tasa_cambio ? Math.round(gastado / p.tasa_cambio) : null,
  };
}

/** Total gastado por etiqueta en una lista de movimientos (para reportes). */
export function totalesPorEtiqueta(movs: Movimiento[]) {
  const t = new Map<string, number>();
  for (const m of movs) {
    if (m.tipo !== "gasto") continue;
    for (const e of m.etiquetas) t.set(e, (t.get(e) ?? 0) + m.monto);
  }
  return t;
}
