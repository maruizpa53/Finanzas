"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { calcularReparto, type LineaReparto } from "@/lib/finance/reparto";
import type { Resultado } from "./movimientos";
import type { TablesInsert } from "@/lib/supabase/database.types";

const linea = z.object({
  destino: z.enum(["cuenta", "deuda", "ahorro", "prestamo"]),
  id: z.string().uuid().nullable(),
  nombre: z.string().trim().max(80).optional(),
  modo: z.enum(["monto", "porcentaje"]),
  valor: z.coerce.number().min(0),
});

const esquema = z.object({
  monto: z.coerce.number().int().positive("El monto debe ser mayor que cero"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cuenta_id: z.string().uuid("Elija la cuenta donde entró"),
  categoria_id: z.string().uuid("Elija la categoría del ingreso"),
  bolsa: z.enum(["personal", "lemon", "freelance"]).default("personal"),
  descripcion: z.string().trim().max(200).optional(),
  notas: z.string().trim().max(500).nullable().optional(),
  lineas: z.array(linea).max(12),
  guardar_plantilla: z.boolean().default(false),
});

export type EntradaIngresoRepartido = z.input<typeof esquema>;

/**
 * Registra un ingreso y, en el mismo paso, a dónde se fue cada parte:
 * - cuenta propia → transferencia (no es gasto)
 * - deuda → pago (gasto con la categoría de la deuda + abono)
 * - ahorro → aporte (gasto con la categoría del ahorro + aporte)
 * - préstamo a alguien → gasto "Préstamos que hice"
 * Todo queda unido con el mismo grupo_id para poder verlo o deshacerlo junto.
 */
export async function crearIngresoRepartido(entrada: EntradaIngresoRepartido): Promise<Resultado> {
  const p = esquema.safeParse(entrada);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const v = p.data;
  const lineas = v.lineas.filter((l) => l.valor > 0) as LineaReparto[];
  const r = calcularReparto(v.monto, lineas);
  if (r.excede) return { ok: false, error: "Está repartiendo más de lo que entró" };
  for (const l of r.lineas) {
    if (l.destino !== "prestamo" && !l.id) return { ok: false, error: "Elija el destino de cada parte" };
    if (l.destino === "cuenta" && l.id === v.cuenta_id) return { ok: false, error: "Una parte va a la misma cuenta donde entró" };
    if (l.destino === "prestamo" && !l.nombre) return { ok: false, error: "Escriba a quién le prestó" };
  }

  const supabase = await createClient();
  const grupo = randomUUID();
  const { data: cat } = await supabase.from("categories").select("nombre").eq("id", v.categoria_id).single();

  const { data: ingreso, error: e0 } = await supabase
    .from("transactions")
    .insert({
      tipo: "ingreso",
      monto: v.monto,
      fecha: v.fecha,
      cuenta_id: v.cuenta_id,
      categoria_id: v.categoria_id,
      bolsa: v.bolsa,
      descripcion: v.descripcion || cat?.nombre || "Ingreso",
      notas: v.notas || null,
      origen: "manual",
      grupo_id: grupo,
    })
    .select("id")
    .single();
  if (e0) return { ok: false, error: "No se pudo guardar el ingreso: " + e0.message };

  const base = { fecha: v.fecha, cuenta_id: v.cuenta_id, origen: "manual" as const, grupo_id: grupo, bolsa: "personal" as const };
  const fallos: string[] = [];

  // Datos de destino en una sola consulta por tipo.
  const ids = (d: string) => r.lineas.filter((l) => l.destino === d && l.monto > 0).map((l) => l.id!);
  const [{ data: deudas }, { data: ahorros }, { data: catPrestamo }] = await Promise.all([
    ids("deuda").length ? supabase.from("debts").select("id, acreedor, categoria_id, solo_intereses, interes_mensual").in("id", ids("deuda")) : Promise.resolve({ data: [] as never[] }),
    ids("ahorro").length ? supabase.from("savings").select("id, nombre, categoria_id").in("id", ids("ahorro")) : Promise.resolve({ data: [] as never[] }),
    supabase.from("categories").select("id").eq("nombre", "Préstamos que hice").not("parent_id", "is", null).maybeSingle(),
  ]);

  for (const l of r.lineas) {
    if (!l.monto) continue;
    if (l.destino === "cuenta") {
      const { error } = await supabase.from("transactions").insert({ ...base, tipo: "transferencia", monto: l.monto, cuenta_destino_id: l.id, descripcion: "Reparto de ingreso" });
      if (error) fallos.push(error.message);
    } else if (l.destino === "deuda") {
      const d = (deudas ?? []).find((x) => x.id === l.id);
      if (!d) {
        fallos.push("Deuda no encontrada");
        continue;
      }
      const fila: TablesInsert<"transactions"> = { ...base, tipo: "gasto", monto: l.monto, categoria_id: d.categoria_id, beneficiario: "yo", descripcion: `Pago a ${d.acreedor}` };
      const { data: tx, error } = await supabase.from("transactions").insert(fila).select("id").single();
      if (error) {
        fallos.push(error.message);
        continue;
      }
      const interes = d.solo_intereses ? Math.min(l.monto, d.interes_mensual ?? 0) : 0;
      const { error: e2 } = await supabase
        .from("debt_payments")
        .insert({ debt_id: d.id, fecha: v.fecha, monto_total: l.monto, capital: l.monto - interes, interes, transaction_id: tx.id });
      if (e2) fallos.push(e2.message);
    } else if (l.destino === "ahorro") {
      const a = (ahorros ?? []).find((x) => x.id === l.id);
      if (!a) {
        fallos.push("Ahorro no encontrado");
        continue;
      }
      const { data: tx, error } = await supabase
        .from("transactions")
        .insert({ ...base, tipo: "gasto", monto: l.monto, categoria_id: a.categoria_id, beneficiario: "yo", descripcion: `Aporte ${a.nombre}` })
        .select("id")
        .single();
      if (error) {
        fallos.push(error.message);
        continue;
      }
      const { error: e2 } = await supabase.from("savings_contributions").insert({ saving_id: a.id, monto: l.monto, fecha: v.fecha, transaction_id: tx.id });
      if (e2) fallos.push(e2.message);
    } else {
      const { error } = await supabase
        .from("transactions")
        .insert({ ...base, tipo: "gasto", monto: l.monto, categoria_id: catPrestamo?.id ?? null, descripcion: `Préstamo a ${l.nombre}`, comercio: l.nombre ?? null });
      if (error) fallos.push(error.message);
    }
  }

  if (v.guardar_plantilla) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from("user_settings").upsert({ user_id: user.id, reparto_ingreso: lineas.map((l) => ({ ...l })) });
  }

  revalidatePath("/", "layout");
  if (fallos.length) return { ok: false, error: `El ingreso quedó guardado, pero ${fallos.length} parte(s) fallaron: ${fallos[0]}` };
  const partes = r.lineas.filter((l) => l.monto).length;
  return { ok: true, id: ingreso.id, mensaje: partes ? `Ingreso guardado y repartido en ${partes} parte${partes > 1 ? "s" : ""}` : "Ingreso guardado" };
}

/** Deshace un ingreso repartido completo (borra todo el grupo; los abonos y aportes caen en cascada o se borran). */
export async function eliminarGrupo(grupoId: string): Promise<Resultado> {
  if (!z.string().uuid().safeParse(grupoId).success) return { ok: false, error: "Grupo inválido" };
  const supabase = await createClient();
  const { data: txs } = await supabase.from("transactions").select("id").eq("grupo_id", grupoId);
  const idsTx = (txs ?? []).map((t) => t.id);
  if (idsTx.length) {
    await supabase.from("debt_payments").delete().in("transaction_id", idsTx);
    await supabase.from("savings_contributions").delete().in("transaction_id", idsTx);
  }
  const { error } = await supabase.from("transactions").delete().eq("grupo_id", grupoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, mensaje: "Ingreso y reparto eliminados" };
}
