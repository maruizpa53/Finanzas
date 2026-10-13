import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/format";
import type { Datos, Movimiento } from "@/lib/finance/modelo";
import { partesFecha, rangoMes, sumarMeses } from "@/lib/finance/mes";
import { leerReparto } from "@/lib/finance/reparto";

const COLS_MOV =
  "id, fecha, descripcion, comercio, monto, tipo, cuenta_id, cuenta_destino_id, categoria_id, bolsa, beneficiario, origen, notas, reembolso_estado, lemon_settlement_id, recurring_item_id, revisado, grupo_id, moneda_original, monto_original, transaction_tags(tag_id)";

type FilaMov = Omit<Movimiento, "etiquetas" | "monto_original"> & { monto_original: number | string | null; transaction_tags: { tag_id: string }[] | null };

function aMovimiento({ transaction_tags, monto_original, ...m }: FilaMov): Movimiento {
  return { ...m, monto_original: monto_original === null ? null : Number(monto_original), etiquetas: (transaction_tags ?? []).map((t) => t.tag_id) };
}

/** PostgREST devuelve máximo 1000 filas por consulta: se pide por páginas hasta traer todo. */
async function todasLasFilas<T>(pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const TAM = 1000;
  const filas: T[] = [];
  for (let i = 0; ; i += TAM) {
    const { data, error } = await pagina(i, i + TAM - 1);
    if (error) return { data: null, error };
    filas.push(...(data ?? []));
    if (!data || data.length < TAM) return { data: filas, error: null };
  }
}

/** Carga todo lo necesario para las vistas. `meses` = historial de movimientos hacia atrás. */
export async function cargarDatos(meses = 13): Promise<Datos> {
  const supabase = await createClient();
  const hoy = hoyBogota();
  const { anio, mes } = partesFecha(hoy);
  const inicio = sumarMeses(anio, mes, -(meses - 1));
  const desde = rangoMes(inicio.anio, inicio.mes).desde;

  const [saldos, cuentas, categorias, movimientos, recurrentes, presupuestos, deudas, pagosDeuda, cortes, ingresos, ahorros, aportes, gastosLemon, etiquetas, proyectos] =
    await Promise.all([
      supabase.from("account_balances").select("id, saldo"),
      supabase.from("accounts").select("id, nombre, institucion, tipo, ultimos4, cupo, dia_corte, dia_pago, saldo_inicial, saldo_inicial_fecha, color, orden, activa").order("orden"),
      supabase.from("categories").select("id, parent_id, nombre, tipo, color, icono, es_fijo, bolsa_default, beneficiario_default, orden, activa").order("orden"),
      todasLasFilas((a, b) =>
        supabase.from("transactions").select(COLS_MOV).gte("fecha", desde).order("fecha", { ascending: false }).order("created_at", { ascending: false }).order("id").range(a, b),
      ),
      supabase.from("recurring_items").select("id, nombre, tipo, categoria_id, cuenta_id, monto_esperado, es_variable, frecuencia, dia_pago, bolsa, beneficiario, activo, notas").order("nombre"),
      supabase.from("budgets").select("id, categoria_id, mes, monto, monto_diario_habil"),
      supabase.from("debts").select("id, acreedor, monto_original, saldo_inicial, saldo_fecha, cuota, tasa_mensual, interes_mensual, solo_intereses, dia_pago, categoria_id, estado, notas").order("acreedor"),
      supabase.from("debt_payments").select("id, debt_id, fecha, monto_total, capital, interes"),
      supabase.from("lemon_settlements").select("id, fecha_corte, periodo_desde, periodo_hasta, monto_presentado, monto_reembolsado, fecha_reembolso, estado, notas").order("fecha_corte", { ascending: false }),
      supabase.from("income_sources").select("id, nombre, tipo, monto_esperado, es_variable, frecuencia, dia_pago, activa"),
      supabase.from("savings").select("id, nombre, tipo, aporte_mensual, meta_monto, acumulado_inicial, fecha_inicio, fecha_entrega, dia_aporte, organizador, categoria_id, notas"),
      supabase.from("savings_contributions").select("id, saving_id, fecha, monto"),
      todasLasFilas((a, b) => supabase.from("transactions").select(COLS_MOV).eq("bolsa", "lemon").order("fecha", { ascending: false }).order("id").range(a, b)),
      supabase.from("tags").select("id, nombre, grupo, descripcion, emoji, color, orden, activa").order("orden"),
      supabase.from("projects").select("id, nombre, emoji, tag_id, presupuesto, fecha_inicio, fecha_fin, moneda, tasa_cambio, notas, activo").order("created_at"),
    ]);

  const error = [saldos, cuentas, categorias, movimientos, recurrentes, presupuestos, deudas, pagosDeuda, cortes, ingresos, ahorros, aportes, gastosLemon, etiquetas, proyectos].find((r) => r.error)?.error;
  if (error) throw new Error(`No se pudieron cargar los datos: ${error.message}`);

  // Movimientos de proyectos (un viaje se paga meses antes: no se limita por fecha).
  const tagsProyecto = (proyectos.data ?? []).map((p) => p.tag_id).filter((t): t is string => Boolean(t));
  let movimientosProyectos: Movimiento[] = [];
  if (tagsProyecto.length) {
    const { data: enlaces } = await supabase.from("transaction_tags").select("transaction_id").in("tag_id", tagsProyecto);
    const ids = [...new Set((enlaces ?? []).map((e) => e.transaction_id))];
    for (let i = 0; i < ids.length; i += 200) {
      const { data } = await supabase.from("transactions").select(COLS_MOV).in("id", ids.slice(i, i + 200));
      movimientosProyectos.push(...((data ?? []) as FilaMov[]).map(aMovimiento));
    }
    movimientosProyectos = movimientosProyectos.sort((x, y) => y.fecha.localeCompare(x.fecha));
  }

  return {
    hoy,
    cuentas: cuentas.data ?? [],
    categorias: categorias.data ?? [],
    movimientos: ((movimientos.data ?? []) as FilaMov[]).map(aMovimiento),
    recurrentes: recurrentes.data ?? [],
    presupuestos: presupuestos.data ?? [],
    deudas: (deudas.data ?? []).map((x) => ({ ...x, tasa_mensual: x.tasa_mensual === null ? null : Number(x.tasa_mensual) })),
    pagosDeuda: pagosDeuda.data ?? [],
    cortes: cortes.data ?? [],
    ingresos: ingresos.data ?? [],
    ahorros: ahorros.data ?? [],
    aportes: aportes.data ?? [],
    gastosLemon: ((gastosLemon.data ?? []) as FilaMov[]).map(aMovimiento),
    saldos: Object.fromEntries((saldos.data ?? []).filter((s) => s.id).map((s) => [s.id!, s.saldo ?? 0])),
    etiquetas: etiquetas.data ?? [],
    proyectos: (proyectos.data ?? []).map((p) => ({ ...p, tasa_cambio: p.tasa_cambio === null ? null : Number(p.tasa_cambio) })),
    movimientosProyectos,
  };
}

export async function cargarPreferencias() {
  const supabase = await createClient();
  const { data } = await supabase.from("user_settings").select("cuenta_default_id, bolsa_default, tags_default, reparto_ingreso, calendario_token").maybeSingle();
  return {
    cuentaDefault: data?.cuenta_default_id ?? null,
    bolsaDefault: data?.bolsa_default ?? "personal",
    tagsDefault: data?.tags_default ?? [],
    reparto: leerReparto(data?.reparto_ingreso),
    calendarioToken: data?.calendario_token ?? null,
  };
}
