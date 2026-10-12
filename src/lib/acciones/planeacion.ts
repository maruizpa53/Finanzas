"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Resultado } from "./movimientos";

const FRECUENCIAS = ["diaria_habil", "semanal", "quincenal", "mensual", "bimestral", "anual"] as const;

const esquemaRecurrente = z.object({
  nombre: z.string().trim().min(1, "Escriba un nombre").max(120),
  categoria_id: z.string().uuid().nullable(),
  monto_esperado: z.coerce.number().int().nonnegative().nullable(),
  es_variable: z.boolean(),
  frecuencia: z.enum(FRECUENCIAS),
  dia_pago: z.coerce.number().int().min(1).max(31).nullable(),
  bolsa: z.enum(["personal", "lemon", "freelance"]),
  activo: z.boolean(),
});

export type EntradaRecurrente = z.input<typeof esquemaRecurrente>;

export async function guardarRecurrente(id: string | null, entrada: EntradaRecurrente): Promise<Resultado> {
  const p = esquemaRecurrente.safeParse(entrada);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("recurring_items").update(p.data).eq("id", id)
    : await supabase.from("recurring_items").insert({ ...p.data, tipo: "gasto" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, mensaje: id ? "Pago fijo actualizado" : "Pago fijo creado" };
}

const esquemaPresupuesto = z.object({
  categoria_id: z.string().uuid(),
  monto: z.coerce.number().int().nonnegative(),
  monto_diario_habil: z.coerce.number().int().nonnegative().default(0),
  /** null = presupuesto por defecto para todos los meses. */
  mes: z.string().regex(/^\d{4}-\d{2}-01$/).nullable(),
});

export async function guardarPresupuesto(entrada: z.input<typeof esquemaPresupuesto>): Promise<Resultado> {
  const p = esquemaPresupuesto.safeParse(entrada);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const supabase = await createClient();
  let q = supabase.from("budgets").select("id").eq("categoria_id", p.data.categoria_id);
  q = p.data.mes ? q.eq("mes", p.data.mes) : q.is("mes", null);
  const { data: existente } = await q.maybeSingle();
  const { error } = existente
    ? await supabase.from("budgets").update({ monto: p.data.monto, monto_diario_habil: p.data.monto_diario_habil }).eq("id", existente.id)
    : await supabase.from("budgets").insert(p.data);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, mensaje: "Presupuesto guardado" };
}

export async function eliminarPresupuesto(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, mensaje: "Presupuesto eliminado" };
}
