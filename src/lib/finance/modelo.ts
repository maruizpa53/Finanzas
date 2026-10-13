// Tipos del dominio (subconjuntos de las filas de la base) usados por el motor y las vistas.
import type { Enums } from "@/lib/supabase/database.types";

export type Bolsa = Enums<"bolsa">;
export type Beneficiario = Enums<"beneficiario">;
export type TipoMovimiento = Enums<"tipo_movimiento">;
export type Frecuencia = Enums<"frecuencia">;

export interface Cuenta {
  id: string;
  nombre: string;
  institucion: string | null;
  tipo: Enums<"tipo_cuenta">;
  ultimos4: string | null;
  cupo: number | null;
  dia_corte: number | null;
  dia_pago: number | null;
  saldo_inicial: number;
  saldo_inicial_fecha: string;
  color: string | null;
  orden: number;
  activa: boolean;
}

export interface Categoria {
  id: string;
  parent_id: string | null;
  nombre: string;
  tipo: Enums<"tipo_categoria">;
  color: string | null;
  icono: string | null;
  es_fijo: boolean;
  bolsa_default: Bolsa | null;
  beneficiario_default: Beneficiario | null;
  orden: number;
  activa: boolean;
}

export interface Movimiento {
  id: string;
  fecha: string;
  descripcion: string;
  comercio: string | null;
  monto: number;
  tipo: TipoMovimiento;
  cuenta_id: string;
  cuenta_destino_id: string | null;
  categoria_id: string | null;
  bolsa: Bolsa;
  beneficiario: Beneficiario | null;
  origen: Enums<"origen_movimiento">;
  notas: string | null;
  reembolso_estado: Enums<"estado_reembolso"> | null;
  lemon_settlement_id: string | null;
  recurring_item_id: string | null;
  revisado: boolean;
  /** Movimientos creados juntos (reparto de un ingreso). */
  grupo_id: string | null;
  moneda_original: string | null;
  monto_original: number | null;
  /** Ids de etiquetas. */
  etiquetas: string[];
}

export interface Etiqueta {
  id: string;
  nombre: string;
  /** Grupo de la etiqueta: "Para quién", "Actividad", "Tipo de gasto"… */
  grupo: string;
  descripcion: string | null;
  emoji: string | null;
  color: string | null;
  orden: number;
  activa: boolean;
}

export interface Proyecto {
  id: string;
  nombre: string;
  emoji: string | null;
  tag_id: string | null;
  presupuesto: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  moneda: string | null;
  tasa_cambio: number | null;
  notas: string | null;
  activo: boolean;
}

export interface Recurrente {
  id: string;
  nombre: string;
  tipo: Enums<"tipo_categoria">;
  categoria_id: string | null;
  cuenta_id: string | null;
  monto_esperado: number | null;
  es_variable: boolean;
  frecuencia: Frecuencia;
  dia_pago: number | null;
  bolsa: Bolsa;
  beneficiario: Beneficiario | null;
  activo: boolean;
  notas: string | null;
}

export interface Presupuesto {
  id: string;
  categoria_id: string;
  mes: string | null;
  monto: number;
  monto_diario_habil: number;
}

export interface Deuda {
  id: string;
  acreedor: string;
  monto_original: number | null;
  saldo_inicial: number | null;
  saldo_fecha: string;
  cuota: number | null;
  tasa_mensual: number | null;
  interes_mensual: number | null;
  solo_intereses: boolean;
  dia_pago: number | null;
  categoria_id: string | null;
  estado: string;
  notas: string | null;
}

export interface PagoDeuda {
  id: string;
  debt_id: string;
  fecha: string;
  monto_total: number;
  capital: number;
  interes: number;
}

export interface CorteLemonFila {
  id: string;
  fecha_corte: string;
  periodo_desde: string | null;
  periodo_hasta: string | null;
  monto_presentado: number | null;
  monto_reembolsado: number;
  fecha_reembolso: string | null;
  estado: Enums<"estado_corte">;
  notas: string | null;
}

export interface FuenteIngreso {
  id: string;
  nombre: string;
  tipo: string;
  monto_esperado: number | null;
  es_variable: boolean;
  frecuencia: Frecuencia;
  dia_pago: number | null;
  activa: boolean;
}

export interface Ahorro {
  id: string;
  nombre: string;
  tipo: string;
  aporte_mensual: number | null;
  meta_monto: number | null;
  acumulado_inicial: number;
  fecha_inicio: string | null;
  fecha_entrega: string | null;
  dia_aporte: number | null;
  organizador: string | null;
  categoria_id: string | null;
  notas: string | null;
}

export interface AporteAhorro {
  id: string;
  saving_id: string;
  fecha: string;
  monto: number;
}

/** Todo lo que el portal necesita para calcular un mes. */
export interface Datos {
  hoy: string;
  cuentas: Cuenta[];
  categorias: Categoria[];
  /** Movimientos de los últimos meses (incluye el mes actual y el anterior). */
  movimientos: Movimiento[];
  recurrentes: Recurrente[];
  presupuestos: Presupuesto[];
  deudas: Deuda[];
  pagosDeuda: PagoDeuda[];
  cortes: CorteLemonFila[];
  ingresos: FuenteIngreso[];
  ahorros: Ahorro[];
  aportes: AporteAhorro[];
  /** Movimientos Lemon de cualquier fecha (para "Lemon me debe"). */
  gastosLemon: Movimiento[];
  /** Saldo actual por cuenta (vista account_balances). */
  saldos: Record<string, number>;
  etiquetas: Etiqueta[];
  proyectos: Proyecto[];
  /** Movimientos de cualquier fecha con la etiqueta de algún proyecto. */
  movimientosProyectos: Movimiento[];
}
