"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Resultado } from "./movimientos";

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function crearCorte(entrada: { ids: string[]; fecha_corte: string; notas?: string }): Promise<Resultado> {
  const p = z.object({ ids: z.array(z.string().uuid()).min(1, "Seleccione al menos un gasto"), fecha_corte: fecha, notas: z.string().max(500).optional() }).safeParse(entrada);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const supabase = await createClient();

  const { data: gastos, error: e1 } = await supabase
    .from("transactions")
    .select("id, monto, fecha")
    .in("id", p.data.ids)
    .eq("bolsa", "lemon")
    .eq("tipo", "gasto")
    .eq("reembolso_estado", "pendiente")
    .is("lemon_settlement_id", null);
  if (e1) return { ok: false, error: e1.message };
  if (!gastos?.length) return { ok: false, error: "Los gastos seleccionados ya no están pendientes" };

  const fechas = gastos.map((g) => g.fecha).sort();
  const total = gastos.reduce((s, g) => s + g.monto, 0);
  const { data: corte, error: e2 } = await supabase
    .from("lemon_settlements")
    .insert({
      fecha_corte: p.data.fecha_corte,
      periodo_desde: fechas[0],
      periodo_hasta: fechas[fechas.length - 1],
      monto_presentado: total,
      estado: "presentado",
      notas: p.data.notas || null,
    })
    .select("id")
    .single();
  if (e2) return { ok: false, error: e2.message };

  const { error: e3 } = await supabase
    .from("transactions")
    .update({ lemon_settlement_id: corte.id, reembolso_estado: "presentado" })
    .in("id", gastos.map((g) => g.id));
  if (e3) return { ok: false, error: e3.message };

  revalidatePath("/", "layout");
  return { ok: true, id: corte.id, mensaje: `Corte creado con ${gastos.length} gastos` };
}

export async function registrarReembolso(entrada: { corte_id: string; monto: number; fecha: string; cuenta_id: string }): Promise<Resultado> {
  const p = z
    .object({ corte_id: z.string().uuid(), monto: z.coerce.number().int().positive("Escriba el monto"), fecha, cuenta_id: z.string().uuid("Elija la cuenta donde llegó") })
    .safeParse(entrada);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const supabase = await createClient();
  const { data: corte, error: e1 } = await supabase
    .from("lemon_settlements")
    .select("id, monto_presentado, monto_reembolsado")
    .eq("id", p.data.corte_id)
    .single();
  if (e1) return { ok: false, error: e1.message };

  const { data: cat } = await supabase.from("categories").select("id").eq("nombre", "Reembolso Lemon").maybeSingle();
  const { error: e2 } = await supabase.from("transactions").insert({
    tipo: "ingreso",
    monto: p.data.monto,
    fecha: p.data.fecha,
    cuenta_id: p.data.cuenta_id,
    categoria_id: cat?.id ?? null,
    bolsa: "lemon",
    descripcion: "Reembolso Lemon First",
    lemon_settlement_id: corte.id,
    origen: "manual",
  });
  if (e2) return { ok: false, error: e2.message };

  const reembolsado = corte.monto_reembolsado + p.data.monto;
  const completo = corte.monto_presentado !== null && reembolsado >= corte.monto_presentado;
  const { error: e3 } = await supabase
    .from("lemon_settlements")
    .update({ monto_reembolsado: reembolsado, fecha_reembolso: p.data.fecha, estado: completo ? "reembolsado" : "reembolsado_parcial" })
    .eq("id", corte.id);
  if (e3) return { ok: false, error: e3.message };

  if (completo) {
    await supabase.from("transactions").update({ reembolso_estado: "reembolsado" }).eq("lemon_settlement_id", corte.id).eq("tipo", "gasto");
  }

  revalidatePath("/", "layout");
  return { ok: true, mensaje: completo ? "Corte reembolsado por completo" : "Abono parcial registrado" };
}

export async function editarCorte(entrada: {
  id: string;
  fecha_corte: string;
  monto_presentado: number | null;
  estado: "presentado" | "reembolsado_parcial" | "reembolsado";
  notas: string | null;
}): Promise<Resultado> {
  const p = z
    .object({
      id: z.string().uuid(),
      fecha_corte: fecha,
      monto_presentado: z.coerce.number().int().nonnegative().nullable(),
      estado: z.enum(["presentado", "reembolsado_parcial", "reembolsado"]),
      notas: z.string().max(500).nullable(),
    })
    .safeParse(entrada);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const supabase = await createClient();
  const { id, ...cambios } = p.data;
  const { error } = await supabase.from("lemon_settlements").update(cambios).eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (cambios.estado === "reembolsado") {
    await supabase.from("transactions").update({ reembolso_estado: "reembolsado" }).eq("lemon_settlement_id", id).eq("tipo", "gasto");
  }
  revalidatePath("/", "layout");
  return { ok: true, mensaje: "Corte actualizado" };
}
