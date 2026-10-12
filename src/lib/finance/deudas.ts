// Deudas: saldo actual, plan de pago (avalancha vs. bola de nieve) y costo de intereses.

import type { CorteLemonFila, Deuda, PagoDeuda } from "./modelo";
import { diasEntre } from "./mes";

export function saldoActualDeuda(d: Deuda, pagos: PagoDeuda[]): number | null {
  if (d.saldo_inicial === null) return null;
  const capital = pagos.filter((p) => p.debt_id === d.id && p.fecha >= d.saldo_fecha).reduce((s, p) => s + p.capital, 0);
  return Math.max(d.saldo_inicial - capital, 0);
}

/** Tasa mensual efectiva: la registrada o, si es solo intereses, interés / saldo. */
export function tasaMensual(d: Deuda, saldo: number | null): number {
  if (d.tasa_mensual !== null) return Number(d.tasa_mensual);
  if (d.interes_mensual && saldo) return d.interes_mensual / saldo;
  return 0;
}

export type MetodoPago = "avalancha" | "bola_de_nieve";

export interface ResultadoPlan {
  metodo: MetodoPago;
  meses: number | null;
  interesesTotales: number;
  orden: { acreedor: string; mesLiquidada: number | null }[];
}

interface DeudaSim {
  acreedor: string;
  saldo: number;
  tasa: number;
  cuota: number;
  soloIntereses: boolean;
  liquidada: number | null;
}

/**
 * Simula mes a mes: se cobra el interés, se paga la cuota mínima de cada deuda y el excedente
 * (aporte extra + cuotas liberadas de deudas ya pagadas) va a la deuda prioritaria.
 * Avalancha = mayor tasa primero; bola de nieve = menor saldo primero.
 */
export function simularPlan(
  deudas: { acreedor: string; saldo: number; tasaMensual: number; cuota: number; soloIntereses: boolean }[],
  extraMensual: number,
  metodo: MetodoPago,
  maxMeses = 360,
): ResultadoPlan {
  const sim: DeudaSim[] = deudas
    .filter((d) => d.saldo > 0)
    .map((d) => ({ acreedor: d.acreedor, saldo: d.saldo, tasa: d.tasaMensual, cuota: d.cuota, soloIntereses: d.soloIntereses, liquidada: null }));
  const presupuesto = sim.reduce((s, d) => s + d.cuota, 0) + extraMensual;
  let intereses = 0;
  let mes = 0;

  while (sim.some((d) => d.saldo > 0) && mes < maxMeses) {
    mes++;
    for (const d of sim) {
      if (d.saldo <= 0) continue;
      const i = Math.round(d.saldo * d.tasa);
      d.saldo += i;
      intereses += i;
    }
    let disponible = presupuesto;
    // Pagos mínimos.
    for (const d of sim) {
      if (d.saldo <= 0) continue;
      const minimo = Math.min(d.cuota, d.saldo, disponible);
      d.saldo -= minimo;
      disponible -= minimo;
    }
    // Excedente a la prioritaria.
    const activas = sim.filter((d) => d.saldo > 0);
    activas.sort((a, b) => (metodo === "avalancha" ? b.tasa - a.tasa || a.saldo - b.saldo : a.saldo - b.saldo));
    for (const d of activas) {
      if (disponible <= 0) break;
      const abono = Math.min(d.saldo, disponible);
      d.saldo -= abono;
      disponible -= abono;
    }
    for (const d of sim) if (d.saldo <= 0 && d.liquidada === null) d.liquidada = mes;
    if (disponible === presupuesto) break; // sin capacidad de pago: no converge
  }

  const todas = sim.every((d) => d.saldo <= 0);
  return {
    metodo,
    meses: todas ? Math.max(0, ...sim.map((d) => d.liquidada ?? 0)) : null,
    interesesTotales: intereses,
    orden: [...sim]
      .sort((a, b) => (a.liquidada ?? Infinity) - (b.liquidada ?? Infinity))
      .map((d) => ({ acreedor: d.acreedor, mesLiquidada: d.liquidada })),
  };
}

/** Días promedio entre el corte y el reembolso de Lemon (solo cortes reembolsados con fecha). */
export function diasPromedioReembolso(cortes: CorteLemonFila[]): number | null {
  const pagados = cortes.filter((c) => c.fecha_reembolso && c.estado === "reembolsado");
  if (!pagados.length) return null;
  return Math.round(pagados.reduce((s, c) => s + diasEntre(c.fecha_corte, c.fecha_reembolso!), 0) / pagados.length);
}
