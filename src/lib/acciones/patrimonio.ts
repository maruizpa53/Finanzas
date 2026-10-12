"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/format";
import { sumarDias } from "@/lib/finance/mes";
import type { Resultado } from "./movimientos";
import type { TablesUpdate } from "@/lib/supabase/database.types";

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const entero = z.coerce.number().int();
const listo = (mensaje: string): Resultado => {
  revalidatePath("/", "layout");
  return { ok: true, mensaje };
};
const fallo = (e: { message: string } | null | undefined, def = "Datos inválidos"): Resultado => ({ ok: false, error: e?.message ?? def });

// ---------------------------------------------------------------------------
// Deudas
// ---------------------------------------------------------------------------

export async function registrarAbono(entrada: { debt_id: string; monto: number; capital: number; fecha: string; cuenta_id: string }): Promise<Resultado> {
  const p = z
    .object({ debt_id: z.string().uuid(), monto: entero.positive("Escriba el monto"), capital: entero.nonnegative(), fecha, cuenta_id: z.string().uuid("Elija la cuenta") })
    .refine((v) => v.capital <= v.monto, { message: "El abono a capital no puede superar el pago" })
    .safeParse(entrada);
  if (!p.success) return fallo(p.error.issues[0]);
  const v = p.data;
  const supabase = await createClient();
  const { data: deuda, error: e0 } = await supabase.from("debts").select("acreedor, categoria_id").eq("id", v.debt_id).single();
  if (e0) return fallo(e0);

  const { data: tx, error: e1 } = await supabase
    .from("transactions")
    .insert({
      tipo: "gasto",
      monto: v.monto,
      fecha: v.fecha,
      cuenta_id: v.cuenta_id,
      categoria_id: deuda.categoria_id,
      bolsa: "personal",
      beneficiario: "yo",
      descripcion: `Pago a ${deuda.acreedor}`,
      origen: "manual",
    })
    .select("id")
    .single();
  if (e1) return fallo(e1);

  const { error: e2 } = await supabase
    .from("debt_payments")
    .insert({ debt_id: v.debt_id, fecha: v.fecha, monto_total: v.monto, capital: v.capital, interes: v.monto - v.capital, transaction_id: tx.id });
  if (e2) return fallo(e2);

  const { data: saldo } = await supabase.from("debt_balances").select("saldo_actual").eq("id", v.debt_id).maybeSingle();
  if (saldo?.saldo_actual === 0) await supabase.from("debts").update({ estado: "pagada" }).eq("id", v.debt_id);
  return listo(saldo?.saldo_actual === 0 ? `¡Deuda con ${deuda.acreedor} pagada!` : "Pago registrado");
}

export async function editarDeuda(entrada: {
  id: string;
  saldo_hoy: number | null;
  cuota: number | null;
  tasa_mensual: number | null;
  dia_pago: number | null;
  solo_intereses: boolean;
  notas: string | null;
}): Promise<Resultado> {
  const p = z
    .object({
      id: z.string().uuid(),
      saldo_hoy: entero.nonnegative().nullable(),
      cuota: entero.nonnegative().nullable(),
      tasa_mensual: z.coerce.number().min(0).max(1).nullable(),
      dia_pago: entero.min(1).max(31).nullable(),
      solo_intereses: z.boolean(),
      notas: z.string().max(500).nullable(),
    })
    .safeParse(entrada);
  if (!p.success) return fallo(p.error.issues[0]);
  const { id, saldo_hoy, ...resto } = p.data;
  const supabase = await createClient();
  const cambios: TablesUpdate<"debts"> = { ...resto };
  // El saldo de hoy ya incluye los pagos de hoy: los abonos cuentan desde mañana.
  if (saldo_hoy !== null) Object.assign(cambios, { saldo_inicial: saldo_hoy, saldo_fecha: sumarDias(hoyBogota(), 1) });
  if (resto.solo_intereses && resto.tasa_mensual && saldo_hoy) cambios.interes_mensual = Math.round(saldo_hoy * resto.tasa_mensual);
  const { error } = await supabase.from("debts").update(cambios).eq("id", id);
  if (error) return fallo(error);
  return listo("Deuda actualizada");
}

// ---------------------------------------------------------------------------
// Ahorro
// ---------------------------------------------------------------------------

export async function registrarAporte(entrada: { saving_id: string; monto: number; fecha: string; cuenta_id: string }): Promise<Resultado> {
  const p = z.object({ saving_id: z.string().uuid(), monto: entero.positive("Escriba el monto"), fecha, cuenta_id: z.string().uuid("Elija la cuenta") }).safeParse(entrada);
  if (!p.success) return fallo(p.error.issues[0]);
  const v = p.data;
  const supabase = await createClient();
  const { data: ahorro, error: e0 } = await supabase.from("savings").select("nombre, categoria_id").eq("id", v.saving_id).single();
  if (e0) return fallo(e0);
  const { data: tx, error: e1 } = await supabase
    .from("transactions")
    .insert({ tipo: "gasto", monto: v.monto, fecha: v.fecha, cuenta_id: v.cuenta_id, categoria_id: ahorro.categoria_id, bolsa: "personal", beneficiario: "yo", descripcion: `Aporte ${ahorro.nombre}`, origen: "manual" })
    .select("id")
    .single();
  if (e1) return fallo(e1);
  const { error: e2 } = await supabase.from("savings_contributions").insert({ saving_id: v.saving_id, monto: v.monto, fecha: v.fecha, transaction_id: tx.id });
  if (e2) return fallo(e2);
  return listo("Aporte registrado");
}

export async function editarAhorro(entrada: {
  id: string;
  acumulado_inicial: number;
  aporte_mensual: number | null;
  meta_monto: number | null;
  fecha_inicio: string | null;
  fecha_entrega: string | null;
  dia_aporte: number | null;
}): Promise<Resultado> {
  const p = z
    .object({
      id: z.string().uuid(),
      acumulado_inicial: entero.nonnegative(),
      aporte_mensual: entero.nonnegative().nullable(),
      meta_monto: entero.nonnegative().nullable(),
      fecha_inicio: fecha.nullable(),
      fecha_entrega: fecha.nullable(),
      dia_aporte: entero.min(1).max(31).nullable(),
    })
    .safeParse(entrada);
  if (!p.success) return fallo(p.error.issues[0]);
  const { id, ...cambios } = p.data;
  const supabase = await createClient();
  const { error } = await supabase.from("savings").update(cambios).eq("id", id);
  if (error) return fallo(error);
  return listo("Ahorro actualizado");
}

// ---------------------------------------------------------------------------
// Cuentas
// ---------------------------------------------------------------------------

export async function editarCuenta(entrada: {
  id: string;
  nombre: string;
  ultimos4: string | null;
  cupo: number | null;
  dia_corte: number | null;
  dia_pago: number | null;
  saldo_hoy: number | null;
}): Promise<Resultado> {
  const p = z
    .object({
      id: z.string().uuid(),
      nombre: z.string().trim().min(1).max(80),
      ultimos4: z.string().regex(/^\d{4}$/, "Solo los últimos 4 dígitos").nullable(),
      cupo: entero.nonnegative().nullable(),
      dia_corte: entero.min(1).max(31).nullable(),
      dia_pago: entero.min(1).max(31).nullable(),
      saldo_hoy: entero.nullable(),
    })
    .safeParse(entrada);
  if (!p.success) return fallo(p.error.issues[0]);
  const { id, saldo_hoy, ...resto } = p.data;
  const supabase = await createClient();
  const { data: cuenta } = await supabase.from("accounts").select("tipo").eq("id", id).single();
  const cambios: TablesUpdate<"accounts"> = { ...resto };
  if (cuenta?.tipo !== "credito") cambios.cupo = null;

  if (saldo_hoy !== null) {
    // saldo_inicial tal que (saldo_inicial + movimientos de hoy) = saldo de hoy.
    const hoy = hoyBogota();
    const { data: deHoy } = await supabase
      .from("transactions")
      .select("monto, tipo, cuenta_id, cuenta_destino_id")
      .eq("fecha", hoy)
      .or(`cuenta_id.eq.${id},cuenta_destino_id.eq.${id}`);
    const efecto = (deHoy ?? []).reduce((s, t) => s + (t.cuenta_id === id ? (t.tipo === "ingreso" ? t.monto : -t.monto) : t.monto), 0);
    Object.assign(cambios, { saldo_inicial: saldo_hoy - efecto, saldo_inicial_fecha: hoy });
  }
  const { error } = await supabase.from("accounts").update(cambios).eq("id", id);
  if (error) return fallo(error);
  return listo("Cuenta actualizada");
}

// ---------------------------------------------------------------------------
// Categorías e ingresos
// ---------------------------------------------------------------------------

export async function guardarCategoria(entrada: { id: string | null; parent_id: string | null; nombre: string; icono: string; activa: boolean }): Promise<Resultado> {
  const p = z
    .object({ id: z.string().uuid().nullable(), parent_id: z.string().uuid().nullable(), nombre: z.string().trim().min(1).max(60), icono: z.string().trim().max(8), activa: z.boolean() })
    .safeParse(entrada);
  if (!p.success) return fallo(p.error.issues[0]);
  const { id, ...v } = p.data;
  const supabase = await createClient();
  let tipo: "gasto" | "ingreso" = "gasto";
  if (v.parent_id) {
    const { data: g } = await supabase.from("categories").select("tipo, bolsa_default").eq("id", v.parent_id).single();
    tipo = g?.tipo ?? "gasto";
  }
  const { error } = id
    ? await supabase.from("categories").update({ nombre: v.nombre, icono: v.icono || null, activa: v.activa }).eq("id", id)
    : await supabase.from("categories").insert({ ...v, icono: v.icono || null, tipo });
  if (error) return fallo(error);
  return listo(id ? "Categoría actualizada" : "Categoría creada");
}

export async function editarIngreso(entrada: { id: string; monto_esperado: number | null; dia_pago: number | null }): Promise<Resultado> {
  const p = z.object({ id: z.string().uuid(), monto_esperado: entero.nonnegative().nullable(), dia_pago: entero.min(1).max(31).nullable() }).safeParse(entrada);
  if (!p.success) return fallo(p.error.issues[0]);
  const { id, ...cambios } = p.data;
  const supabase = await createClient();
  const { error } = await supabase.from("income_sources").update(cambios).eq("id", id);
  if (error) return fallo(error);
  return listo("Ingreso actualizado");
}
