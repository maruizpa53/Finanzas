import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/format";
import type { Datos } from "@/lib/finance/modelo";
import { partesFecha, rangoMes, sumarMeses } from "@/lib/finance/mes";

const COLS_MOV =
  "id, fecha, descripcion, comercio, monto, tipo, cuenta_id, cuenta_destino_id, categoria_id, bolsa, beneficiario, origen, notas, reembolso_estado, lemon_settlement_id, recurring_item_id, revisado";

/** Carga todo lo necesario para las vistas. `meses` = historial de movimientos hacia atrás. */
export async function cargarDatos(meses = 7): Promise<Datos> {
  const supabase = await createClient();
  const hoy = hoyBogota();
  const { anio, mes } = partesFecha(hoy);
  const inicio = sumarMeses(anio, mes, -(meses - 1));
  const desde = rangoMes(inicio.anio, inicio.mes).desde;

  const [saldos, cuentas, categorias, movimientos, recurrentes, presupuestos, deudas, pagosDeuda, cortes, ingresos, ahorros, aportes, gastosLemon] =
    await Promise.all([
      supabase.from("account_balances").select("id, saldo"),
      supabase.from("accounts").select("id, nombre, institucion, tipo, ultimos4, cupo, dia_corte, dia_pago, saldo_inicial, saldo_inicial_fecha, color, orden, activa").order("orden"),
      supabase.from("categories").select("id, parent_id, nombre, tipo, color, icono, es_fijo, bolsa_default, beneficiario_default, orden, activa").order("orden"),
      supabase.from("transactions").select(COLS_MOV).gte("fecha", desde).order("fecha", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("recurring_items").select("id, nombre, tipo, categoria_id, cuenta_id, monto_esperado, es_variable, frecuencia, dia_pago, bolsa, beneficiario, activo, notas").order("nombre"),
      supabase.from("budgets").select("id, categoria_id, mes, monto, monto_diario_habil"),
      supabase.from("debts").select("id, acreedor, monto_original, saldo_inicial, saldo_fecha, cuota, tasa_mensual, interes_mensual, solo_intereses, dia_pago, categoria_id, estado, notas").order("acreedor"),
      supabase.from("debt_payments").select("id, debt_id, fecha, monto_total, capital, interes"),
      supabase.from("lemon_settlements").select("id, fecha_corte, periodo_desde, periodo_hasta, monto_presentado, monto_reembolsado, fecha_reembolso, estado, notas").order("fecha_corte", { ascending: false }),
      supabase.from("income_sources").select("id, nombre, tipo, monto_esperado, es_variable, frecuencia, dia_pago, activa"),
      supabase.from("savings").select("id, nombre, tipo, aporte_mensual, meta_monto, acumulado_inicial, fecha_inicio, fecha_entrega, dia_aporte, organizador, categoria_id, notas"),
      supabase.from("savings_contributions").select("id, saving_id, fecha, monto"),
      supabase.from("transactions").select(COLS_MOV).eq("bolsa", "lemon").order("fecha", { ascending: false }),
    ]);

  const error = [saldos, cuentas, categorias, movimientos, recurrentes, presupuestos, deudas, pagosDeuda, cortes, ingresos, ahorros, aportes, gastosLemon].find((r) => r.error)?.error;
  if (error) throw new Error(`No se pudieron cargar los datos: ${error.message}`);

  return {
    hoy,
    cuentas: cuentas.data ?? [],
    categorias: categorias.data ?? [],
    movimientos: movimientos.data ?? [],
    recurrentes: recurrentes.data ?? [],
    presupuestos: presupuestos.data ?? [],
    deudas: (deudas.data ?? []).map((x) => ({ ...x, tasa_mensual: x.tasa_mensual === null ? null : Number(x.tasa_mensual) })),
    pagosDeuda: pagosDeuda.data ?? [],
    cortes: cortes.data ?? [],
    ingresos: ingresos.data ?? [],
    ahorros: ahorros.data ?? [],
    aportes: aportes.data ?? [],
    gastosLemon: gastosLemon.data ?? [],
    saldos: Object.fromEntries((saldos.data ?? []).filter((s) => s.id).map((s) => [s.id!, s.saldo ?? 0])),
  };
}

export async function cargarPreferencias() {
  const supabase = await createClient();
  const { data } = await supabase.from("user_settings").select("cuenta_default_id, bolsa_default").maybeSingle();
  return { cuentaDefault: data?.cuenta_default_id ?? null, bolsaDefault: data?.bolsa_default ?? "personal" };
}
