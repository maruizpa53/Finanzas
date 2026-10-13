// Motor del mes: ocurrencias de recurrentes, plan del mes, "disponible para gastar",
// presupuestos, series y agregados. Funciones puras: todo se prueba sin base de datos.

import { estadoPresupuesto, equivalenteMensual, presupuestoDelMes, type EstadoPresupuesto } from "./calculos";
import { diasDelMes, esDiaHabil } from "./dias-habiles";
import type { Categoria, Datos, Movimiento, Recurrente } from "./modelo";

// ---------------------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------------------

export function partesFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return { anio, mes, dia };
}

export function claveMes(anio: number, mes: number) {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

export function mesAnterior(anio: number, mes: number) {
  return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}

export function sumarMeses(anio: number, mes: number, n: number) {
  const total = anio * 12 + (mes - 1) + n;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
}

export function rangoMes(anio: number, mes: number) {
  const ultimo = diasDelMes(anio, mes);
  return { desde: `${claveMes(anio, mes)}-01`, hasta: `${claveMes(anio, mes)}-${String(ultimo).padStart(2, "0")}` };
}

export function fechaDelMes(anio: number, mes: number, dia: number) {
  const d = Math.min(Math.max(dia, 1), diasDelMes(anio, mes));
  return `${claveMes(anio, mes)}-${String(d).padStart(2, "0")}`;
}

function aUTC(fecha: string) {
  const [a, m, d] = fecha.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

export function sumarDias(fecha: string, n: number) {
  return new Date(aUTC(fecha) + n * 86_400_000).toISOString().slice(0, 10);
}

export function diasEntre(desde: string, hasta: string) {
  return Math.round((aUTC(hasta) - aUTC(desde)) / 86_400_000);
}

export function movimientosDelMes(movs: Movimiento[], anio: number, mes: number) {
  const pref = claveMes(anio, mes);
  return movs.filter((m) => m.fecha.startsWith(pref));
}

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

export function indexarCategorias(categorias: Categoria[]) {
  const porId = new Map(categorias.map((c) => [c.id, c]));
  const grupoDe = (id: string | null): Categoria | undefined => {
    if (!id) return undefined;
    const c = porId.get(id);
    if (!c) return undefined;
    return c.parent_id ? porId.get(c.parent_id) : c;
  };
  return { porId, grupoDe };
}

/** Clasificación de un recurrente para el plan del mes. */
export type ClaseFijo = "fijos" | "ahorro" | "deudas";

export function claseDeRecurrente(r: Recurrente, categorias: Categoria[]): ClaseFijo {
  const { porId, grupoDe } = indexarCategorias(categorias);
  const cat = r.categoria_id ? porId.get(r.categoria_id) : undefined;
  const grupo = grupoDe(r.categoria_id)?.nombre;
  if (cat?.nombre.toLowerCase().startsWith("cadena") || grupo === "Ahorro e inversión") return "ahorro";
  if (grupo === "Deudas" || grupo === "Deudas y ahorro") return "deudas";
  return "fijos";
}

// ---------------------------------------------------------------------------
// Ocurrencias de recurrentes (pagos del mes)
// ---------------------------------------------------------------------------

export interface Ocurrencia {
  recurrente: Recurrente;
  /** Fecha de vencimiento, o null si el recurrente no tiene día de pago. */
  fecha: string | null;
  montoEsperado: number | null;
  pagado: boolean;
  montoPagado: number;
  movimientoIds: string[];
  clase: ClaseFijo;
}

/** Promedio de los últimos 3 pagos de un recurrente variable (para estimar su monto). */
export function promedioPagos(r: Recurrente, movs: Movimiento[], antesDe: string): number | null {
  const pagos = movs
    .filter((m) => m.tipo === "gasto" && m.fecha < antesDe && (m.recurring_item_id === r.id || (!m.recurring_item_id && r.categoria_id && m.categoria_id === r.categoria_id)))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  // Agrupar por mes y tomar los 3 meses más recientes.
  const porMes = new Map<string, number>();
  for (const p of pagos) porMes.set(p.fecha.slice(0, 7), (porMes.get(p.fecha.slice(0, 7)) ?? 0) + p.monto);
  const ultimos = [...porMes.values()].slice(0, 3);
  if (!ultimos.length) return null;
  return Math.round(ultimos.reduce((s, v) => s + v, 0) / ultimos.length);
}

/**
 * Ocurrencias de gastos recurrentes en el mes. Las de frecuencia "diaria hábil" (onces) no generan
 * pagos: se manejan como presupuesto. Un pago cuenta si el movimiento está vinculado al recurrente o,
 * para categorías fijas, si es un gasto de la misma categoría en el mes.
 */
export function ocurrenciasDelMes(datos: Pick<Datos, "recurrentes" | "movimientos" | "categorias">, anio: number, mes: number): Ocurrencia[] {
  const delMes = movimientosDelMes(datos.movimientos, anio, mes).filter((m) => m.tipo === "gasto");
  const catPorId = new Map(datos.categorias.map((c) => [c.id, c]));
  const inicioMes = rangoMes(anio, mes).desde;
  const usados = new Set<string>();
  const resultado: Ocurrencia[] = [];

  const recurrentes = datos.recurrentes.filter((r) => r.activo && r.tipo === "gasto" && r.frecuencia !== "diaria_habil");

  // Primero los pagos vinculados explícitamente.
  const vinculados = new Map<string, Movimiento[]>();
  for (const m of delMes) {
    if (m.recurring_item_id) {
      vinculados.set(m.recurring_item_id, [...(vinculados.get(m.recurring_item_id) ?? []), m]);
      usados.add(m.id);
    }
  }

  for (const r of recurrentes) {
    const veces = vecesEnMes(r.frecuencia, anio, mes);
    if (veces === 0) continue;
    const esperado = r.monto_esperado ?? (r.es_variable ? promedioPagos(r, datos.movimientos, inicioMes) : null);
    let pagos = vinculados.get(r.id) ?? [];
    const cat = r.categoria_id ? catPorId.get(r.categoria_id) : undefined;
    if (pagos.length < veces && cat?.es_fijo) {
      const extra = delMes.filter((m) => !usados.has(m.id) && m.categoria_id === r.categoria_id && !m.recurring_item_id);
      for (const m of extra.slice(0, veces - pagos.length)) usados.add(m.id);
      pagos = [...pagos, ...extra.slice(0, veces - pagos.length)];
    }
    const fechas = fechasEnMes(r, anio, mes, veces);
    for (let i = 0; i < veces; i++) {
      const pago = pagos[i];
      resultado.push({
        recurrente: r,
        fecha: fechas[i],
        montoEsperado: esperado,
        pagado: Boolean(pago),
        montoPagado: pago?.monto ?? 0,
        movimientoIds: pago ? [pago.id] : [],
        clase: claseDeRecurrente(r, datos.categorias),
      });
    }
  }

  return resultado.sort((a, b) => (a.fecha ?? "9999") < (b.fecha ?? "9999") ? -1 : 1);
}

function vecesEnMes(f: Recurrente["frecuencia"], _anio: number, mes: number): number {
  switch (f) {
    case "quincenal":
      return 2;
    case "semanal":
      return 4;
    case "mensual":
      return 1;
    case "bimestral":
      return mes % 2 === 0 ? 1 : 0; // por defecto meses pares; ajustable cuando se confirme
    case "anual":
      return 0; // los anuales se manejan con su fecha propia (pendiente de confirmar)
    default:
      return 0;
  }
}

function fechasEnMes(r: Recurrente, anio: number, mes: number, veces: number): (string | null)[] {
  if (!r.dia_pago) return Array.from({ length: veces }, () => null);
  if (r.frecuencia === "quincenal") {
    const primero = r.dia_pago <= 15 ? r.dia_pago : r.dia_pago - 15;
    return [fechaDelMes(anio, mes, primero), fechaDelMes(anio, mes, primero + 15)];
  }
  if (r.frecuencia === "semanal") return [0, 7, 14, 21].map((d) => fechaDelMes(anio, mes, r.dia_pago! + d));
  return [fechaDelMes(anio, mes, r.dia_pago)];
}

// ---------------------------------------------------------------------------
// Plan del mes y "disponible para gastar"
// ---------------------------------------------------------------------------

export interface PlanMes {
  anio: number;
  mes: number;
  ingresoEsperado: number;
  ingresoReal: number;
  /** Ingreso usado para el plan: el mayor entre el esperado y el real. */
  ingreso: number;
  /** Gasto del mes de bolsa personal + freelance (Lemon y transferencias excluidas). */
  gastado: number;
  segmentos: { fijos: number; ahorro: number; deudas: number; variable: number; disponible: number };
  fijosPagados: number;
  fijosPendientes: number;
  pendientesSinMonto: number;
  disponible: number;
  diasRestantes: number;
  porDia: number;
  /** Fracción del mes transcurrida (día / días del mes). */
  ritmo: number;
  /** Gasto variable proyectado al cierre según el ritmo actual. */
  variableProyectado: number;
  /** (ingreso − fijos − deudas − variable proyectado) / ingreso. La Cadena cuenta como ahorro. */
  tasaAhorroProyectada: number | null;
}

/**
 * Disponible = ingreso − gastado − fijos pendientes.
 * Los fijos ya pagados están dentro de "gastado", así que no se cuentan dos veces.
 */
export function planDelMes(datos: Datos, anio: number, mes: number): PlanMes {
  const { dia, anio: aHoy, mes: mHoy } = partesFecha(datos.hoy);
  const esMesActual = aHoy === anio && mHoy === mes;
  const total = diasDelMes(anio, mes);
  const diaRef = esMesActual ? dia : aHoy * 12 + mHoy > anio * 12 + mes ? total : 0;

  const ingresoEsperado = datos.ingresos
    .filter((i) => i.activa && i.monto_esperado)
    .reduce((s, i) => s + equivalenteMensual(i.monto_esperado!, i.frecuencia, anio, mes), 0);

  const delMes = movimientosDelMes(datos.movimientos, anio, mes);
  const ingresoReal = delMes.filter((m) => m.tipo === "ingreso" && m.bolsa !== "lemon").reduce((s, m) => s + m.monto, 0);
  const gastado = delMes.filter((m) => m.tipo === "gasto" && m.bolsa !== "lemon").reduce((s, m) => s + m.monto, 0);

  const ocurrencias = ocurrenciasDelMes(datos, anio, mes).filter((o) => o.recurrente.bolsa !== "lemon");
  const seg = { fijos: 0, ahorro: 0, deudas: 0 };
  let fijosPagados = 0;
  let fijosPendientes = 0;
  let pendientesSinMonto = 0;
  for (const o of ocurrencias) {
    const valor = o.pagado ? o.montoPagado : (o.montoEsperado ?? 0);
    seg[o.clase] += valor;
    if (o.pagado) fijosPagados += o.montoPagado;
    else if (o.montoEsperado) fijosPendientes += o.montoEsperado;
    else pendientesSinMonto++;
  }

  const ingreso = Math.max(ingresoEsperado, ingresoReal);
  const variable = Math.max(gastado - fijosPagados, 0);
  const disponible = ingreso - gastado - fijosPendientes;
  const diasRestantes = Math.max(total - diaRef + (esMesActual ? 1 : 0), 0);

  const variableProyectado = diaRef > 0 ? Math.round((variable / diaRef) * total) : variable;
  const tasaAhorroProyectada = ingreso > 0 ? (ingreso - seg.fijos - seg.deudas - variableProyectado) / ingreso : null;

  return {
    anio,
    mes,
    variableProyectado,
    tasaAhorroProyectada,
    ingresoEsperado,
    ingresoReal,
    ingreso,
    gastado,
    segmentos: { ...seg, variable, disponible: Math.max(disponible, 0) },
    fijosPagados,
    fijosPendientes,
    pendientesSinMonto,
    disponible,
    diasRestantes,
    porDia: diasRestantes > 0 ? Math.floor(Math.max(disponible, 0) / diasRestantes) : 0,
    ritmo: total ? diaRef / total : 0,
  };
}

// ---------------------------------------------------------------------------
// Presupuestos
// ---------------------------------------------------------------------------

export interface EstadoPresupuestoCategoria extends EstadoPresupuesto {
  categoria: Categoria;
  grupo: Categoria | undefined;
  proyeccion: number;
  porEncimaDelRitmo: boolean;
}

/** Presupuesto vigente para la categoría en el mes: el específico del mes o el de por defecto. */
export function presupuestosDelMes(datos: Datos, anio: number, mes: number): EstadoPresupuestoCategoria[] {
  const clave = `${claveMes(anio, mes)}-01`;
  const { porId, grupoDe } = indexarCategorias(datos.categorias);
  const vigentes = new Map<string, Datos["presupuestos"][number]>();
  for (const p of datos.presupuestos) if (p.mes === null && !vigentes.has(p.categoria_id)) vigentes.set(p.categoria_id, p);
  for (const p of datos.presupuestos) if (p.mes === clave) vigentes.set(p.categoria_id, p);

  const delMes = movimientosDelMes(datos.movimientos, anio, mes).filter((m) => m.tipo === "gasto" && m.bolsa !== "lemon");
  const plan = planDelMes(datos, anio, mes);
  const total = diasDelMes(anio, mes);
  const diaRef = Math.max(Math.round(plan.ritmo * total), 1);

  const resultado: EstadoPresupuestoCategoria[] = [];
  for (const [catId, p] of vigentes) {
    const categoria = porId.get(catId);
    if (!categoria) continue;
    const esGrupo = !categoria.parent_id;
    const gastado = delMes
      .filter((m) => m.categoria_id === catId || (esGrupo && m.categoria_id && porId.get(m.categoria_id)?.parent_id === catId))
      .reduce((s, m) => s + m.monto, 0);
    const monto = presupuestoDelMes(p, anio, mes);
    const estado = estadoPresupuesto(monto, gastado);
    resultado.push({
      ...estado,
      categoria,
      grupo: grupoDe(catId),
      proyeccion: Math.round((gastado / diaRef) * total),
      porEncimaDelRitmo: estado.consumido > plan.ritmo + 0.05,
    });
  }
  return resultado.sort((a, b) => b.consumido - a.consumido);
}

// ---------------------------------------------------------------------------
// Series y agregados
// ---------------------------------------------------------------------------

/** Gasto personal acumulado por día del mes (null después de hoy en el mes actual). */
export function acumuladoDiario(datos: Datos, anio: number, mes: number) {
  const total = diasDelMes(anio, mes);
  const { anio: aH, mes: mH, dia: dH } = partesFecha(datos.hoy);
  const corte = aH === anio && mH === mes ? dH : total;
  const ant = mesAnterior(anio, mes);
  const totalAnt = diasDelMes(ant.anio, ant.mes);
  const porDia = (a: number, m: number) => {
    const arr = new Array(32).fill(0);
    for (const mv of movimientosDelMes(datos.movimientos, a, m)) {
      if (mv.tipo === "gasto" && mv.bolsa !== "lemon") arr[partesFecha(mv.fecha).dia] += mv.monto;
    }
    return arr;
  };
  const actual = porDia(anio, mes);
  const previo = porDia(ant.anio, ant.mes);
  let accA = 0;
  let accP = 0;
  return Array.from({ length: total }, (_, i) => {
    const d = i + 1;
    accA += actual[d];
    if (d <= totalAnt) accP += previo[d];
    return { dia: d, esteMes: d <= corte ? accA : null, mesAnterior: accP };
  });
}

/** Gasto personal hasta el mismo día del mes anterior (para comparar justo). */
export function comparacionMesAnterior(datos: Datos, anio: number, mes: number) {
  const serie = acumuladoDiario(datos, anio, mes);
  const { anio: aH, mes: mH, dia } = partesFecha(datos.hoy);
  const idx = (aH === anio && mH === mes ? dia : serie.length) - 1;
  const actual = serie[idx]?.esteMes ?? 0;
  const previo = serie[idx]?.mesAnterior ?? 0;
  return { actual, previo, variacion: previo > 0 ? actual / previo - 1 : null };
}

export function totalesPor<K extends string>(movs: Movimiento[], clave: (m: Movimiento) => K | null) {
  const mapa = new Map<K, number>();
  for (const m of movs) {
    const k = clave(m);
    if (k === null) continue;
    mapa.set(k, (mapa.get(k) ?? 0) + m.monto);
  }
  return [...mapa.entries()].map(([k, v]) => ({ clave: k, total: v })).sort((a, b) => b.total - a.total);
}

/** Ingresos y gastos (personal + freelance) de los últimos n meses, terminando en (anio, mes). */
export function tendencia(datos: Datos, anio: number, mes: number, n = 6) {
  return Array.from({ length: n }, (_, i) => {
    const { anio: a, mes: m } = sumarMeses(anio, mes, i - n + 1);
    const movs = movimientosDelMes(datos.movimientos, a, m);
    return {
      clave: claveMes(a, m),
      anio: a,
      mes: m,
      ingresos: movs.filter((x) => x.tipo === "ingreso" && x.bolsa !== "lemon").reduce((s, x) => s + x.monto, 0),
      gastos: movs.filter((x) => x.tipo === "gasto" && x.bolsa !== "lemon").reduce((s, x) => s + x.monto, 0),
    };
  });
}

/** Días hábiles restantes del mes desde hoy (incluido). */
export function diasHabilesRestantes(hoy: string) {
  const { anio, mes, dia } = partesFecha(hoy);
  let n = 0;
  for (let d = dia; d <= diasDelMes(anio, mes); d++) if (esDiaHabil(fechaDelMes(anio, mes, d))) n++;
  return n;
}

// ---------------------------------------------------------------------------
// Próximos pagos (recurrentes pendientes + cortes y pagos de tarjetas)
// ---------------------------------------------------------------------------

export interface PagoProximo {
  id: string;
  nombre: string;
  fecha: string;
  dias: number;
  monto: number | null;
  emoji: string;
  tipo: "fijo" | "ahorro" | "deuda" | "corte" | "pago_tarjeta";
  recurrenteId?: string;
}

export function proximosPagos(datos: Datos, ventana = 7): PagoProximo[] {
  const { anio, mes } = partesFecha(datos.hoy);
  const sig = sumarMeses(anio, mes, 1);
  const catPorId = new Map(datos.categorias.map((c) => [c.id, c]));
  const lista: PagoProximo[] = [];
  for (const { anio: a, mes: m } of [{ anio, mes }, sig]) {
    for (const o of ocurrenciasDelMes(datos, a, m)) {
      if (o.pagado || !o.fecha) continue;
      const dias = diasEntre(datos.hoy, o.fecha);
      if (dias < 0 || dias > ventana) continue;
      lista.push({
        id: `${o.recurrente.id}-${o.fecha}`,
        nombre: o.recurrente.nombre,
        fecha: o.fecha,
        dias,
        monto: o.montoEsperado,
        emoji: (o.recurrente.categoria_id && catPorId.get(o.recurrente.categoria_id)?.icono) || "📌",
        tipo: o.clase === "ahorro" ? "ahorro" : o.clase === "deudas" ? "deuda" : "fijo",
        recurrenteId: o.recurrente.id,
      });
    }
    for (const c of datos.cuentas.filter((x) => x.tipo === "credito" && x.activa)) {
      const nombre = `${c.nombre}${c.ultimos4 ? ` ···${c.ultimos4}` : ""}`;
      for (const [dia, tipo] of [
        [c.dia_corte, "corte"],
        [c.dia_pago, "pago_tarjeta"],
      ] as const) {
        if (!dia) continue;
        const fecha = fechaDelMes(a, m, dia);
        const dias = diasEntre(datos.hoy, fecha);
        if (dias < 0 || dias > ventana) continue;
        lista.push({ id: `${c.id}-${tipo}-${fecha}`, nombre: `${tipo === "corte" ? "Corte" : "Pago"} ${nombre}`, fecha, dias, monto: null, emoji: "💳", tipo });
      }
    }
  }
  return lista.sort((x, y) => (x.fecha < y.fecha ? -1 : x.fecha > y.fecha ? 1 : 0));
}
