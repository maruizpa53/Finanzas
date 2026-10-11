// Cálculos de dinero. Funciones puras (sin base de datos) para poder probarlas.
// Todos los montos son pesos enteros.

import type { Enums } from "@/lib/supabase/database.types";
import { diasDelMes, diasHabilesDelMes } from "./dias-habiles";

type TipoMovimiento = Enums<"tipo_movimiento">;
type Bolsa = Enums<"bolsa">;

// ---------------------------------------------------------------------------
// Saldos de cuentas
// ---------------------------------------------------------------------------

export interface MovimientoSaldo {
  monto: number;
  tipo: TipoMovimiento;
  cuenta_id: string;
  cuenta_destino_id: string | null;
}

/**
 * Efecto de un movimiento sobre el saldo de una cuenta.
 * Gasto resta, ingreso suma; transferencia y pago de tarjeta restan en el origen
 * y suman en el destino (así un pago de tarjeta no se cuenta como gasto nuevo).
 * Debe coincidir con la vista public.account_balances.
 */
export function efectoEnCuenta(mov: MovimientoSaldo, cuentaId: string): number {
  if (mov.cuenta_id === cuentaId) {
    return mov.tipo === "ingreso" ? mov.monto : -mov.monto;
  }
  if (mov.cuenta_destino_id === cuentaId) {
    return mov.monto;
  }
  return 0;
}

export function saldoCuenta(
  saldoInicial: number,
  movimientos: MovimientoSaldo[],
  cuentaId: string,
): number {
  return movimientos.reduce((s, m) => s + efectoEnCuenta(m, cuentaId), saldoInicial);
}

/** Porcentaje del cupo usado en una tarjeta de crédito (saldo negativo = deuda). */
export function usoDeCupo(saldo: number, cupo: number | null): number | null {
  if (!cupo || cupo <= 0) return null;
  return Math.max(0, -saldo) / cupo;
}

// ---------------------------------------------------------------------------
// Resumen del mes (ingresos, gasto personal, flujo, tasa de ahorro)
// ---------------------------------------------------------------------------

export interface MovimientoResumen {
  monto: number;
  tipo: TipoMovimiento;
  bolsa: Bolsa;
}

export interface ResumenMes {
  ingresos: number;
  gastoPersonal: number;
  gastoLemon: number;
  gastoFreelance: number;
  flujoNeto: number;
  /** Fracción (0.25 = 25 %). null si no hubo ingresos. */
  tasaAhorro: number | null;
}

/**
 * - Ingresos: ingresos de bolsa personal y freelance (los reembolsos de Lemon no son ingreso).
 * - Gasto personal: gastos de bolsa personal (Lemon y freelance van aparte).
 * - Transferencias y pagos de tarjeta no son ni ingreso ni gasto.
 * - Flujo neto = ingresos − gasto personal − gasto freelance.
 */
export function resumenMes(movimientos: MovimientoResumen[]): ResumenMes {
  let ingresos = 0;
  let gastoPersonal = 0;
  let gastoLemon = 0;
  let gastoFreelance = 0;

  for (const m of movimientos) {
    if (m.tipo === "ingreso" && m.bolsa !== "lemon") ingresos += m.monto;
    if (m.tipo === "gasto") {
      if (m.bolsa === "personal") gastoPersonal += m.monto;
      else if (m.bolsa === "lemon") gastoLemon += m.monto;
      else gastoFreelance += m.monto;
    }
  }

  const flujoNeto = ingresos - gastoPersonal - gastoFreelance;
  return {
    ingresos,
    gastoPersonal,
    gastoLemon,
    gastoFreelance,
    flujoNeto,
    tasaAhorro: ingresos > 0 ? flujoNeto / ingresos : null,
  };
}

// ---------------------------------------------------------------------------
// Presupuestos
// ---------------------------------------------------------------------------

export interface PresupuestoBase {
  monto: number;
  monto_diario_habil: number;
}

/** Presupuesto del mes = monto fijo + monto por día hábil × días hábiles del mes. */
export function presupuestoDelMes(p: PresupuestoBase, anio: number, mes: number): number {
  return p.monto + p.monto_diario_habil * diasHabilesDelMes(anio, mes);
}

export type NivelPresupuesto = "ok" | "alerta" | "excedido";

export interface EstadoPresupuesto {
  presupuesto: number;
  gastado: number;
  disponible: number;
  /** Fracción consumida (1 = 100 %). */
  consumido: number;
  nivel: NivelPresupuesto;
}

/** Alerta al 80 % y excedido al 100 %. */
export function estadoPresupuesto(presupuesto: number, gastado: number): EstadoPresupuesto {
  const consumido = presupuesto > 0 ? gastado / presupuesto : gastado > 0 ? Infinity : 0;
  const nivel: NivelPresupuesto =
    consumido >= 1 && gastado > 0 ? "excedido" : consumido >= 0.8 ? "alerta" : "ok";
  return { presupuesto, gastado, disponible: presupuesto - gastado, consumido, nivel };
}

/** Proyección lineal del gasto al cierre del mes según el ritmo actual. */
export function proyeccionCierreMes(gastado: number, anio: number, mes: number, diaActual: number): number {
  const total = diasDelMes(anio, mes);
  const transcurridos = Math.min(Math.max(diaActual, 1), total);
  return Math.round((gastado / transcurridos) * total);
}

// ---------------------------------------------------------------------------
// Lemon me debe
// ---------------------------------------------------------------------------

export interface GastoLemon {
  monto: number;
  reembolso_estado: Enums<"estado_reembolso">;
  lemon_settlement_id: string | null;
}

export interface CorteLemon {
  id: string;
  monto_presentado: number | null;
  monto_reembolsado: number;
  estado: Enums<"estado_corte">;
}

export interface LemonMeDebe {
  /** Gastos Lemon aún no incluidos en ningún corte. */
  pendienteSinCorte: number;
  /** Lo presentado en cortes que Lemon aún no ha pagado (descontando abonos parciales). */
  presentadoSinPagar: number;
  total: number;
}

/**
 * "Lemon me debe" = gastos Lemon sin corte + (lo presentado en cada corte − lo reembolsado).
 * El monto presentado de un corte es el registrado en el corte o, si no se registró,
 * la suma de los gastos asociados a él.
 */
export function calcularLemonMeDebe(gastos: GastoLemon[], cortes: CorteLemon[]): LemonMeDebe {
  const pendienteSinCorte = gastos
    .filter((g) => g.reembolso_estado === "pendiente" && g.lemon_settlement_id === null)
    .reduce((s, g) => s + g.monto, 0);

  let presentadoSinPagar = 0;
  for (const corte of cortes) {
    if (corte.estado === "reembolsado") continue;
    const sumaGastos = gastos
      .filter((g) => g.lemon_settlement_id === corte.id)
      .reduce((s, g) => s + g.monto, 0);
    const presentado = corte.monto_presentado ?? sumaGastos;
    presentadoSinPagar += Math.max(presentado - corte.monto_reembolsado, 0);
  }

  return {
    pendienteSinCorte,
    presentadoSinPagar,
    total: pendienteSinCorte + presentadoSinPagar,
  };
}

// ---------------------------------------------------------------------------
// Deudas
// ---------------------------------------------------------------------------

/** Relación cuotas de deuda / ingresos (fracción). null si no hay ingresos. */
export function relacionDeudaIngresos(cuotasMensuales: number, ingresosMensuales: number): number | null {
  if (ingresosMensuales <= 0) return null;
  return cuotasMensuales / ingresosMensuales;
}

// ---------------------------------------------------------------------------
// Recurrentes
// ---------------------------------------------------------------------------

/** Equivalente mensual de un monto recurrente (diaria hábil usa los días hábiles del mes). */
export function equivalenteMensual(
  monto: number,
  frecuencia: Enums<"frecuencia">,
  anio: number,
  mes: number,
): number {
  switch (frecuencia) {
    case "diaria_habil":
      return monto * diasHabilesDelMes(anio, mes);
    case "semanal":
      return Math.round((monto * 52) / 12);
    case "quincenal":
      return monto * 2;
    case "mensual":
      return monto;
    case "bimestral":
      return Math.round(monto / 2);
    case "anual":
      return Math.round(monto / 12);
  }
}
