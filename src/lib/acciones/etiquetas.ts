"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Resultado } from "./movimientos";

const listo = (mensaje: string, id?: string): Resultado => {
  revalidatePath("/", "layout");
  return { ok: true, mensaje, id };
};

const esquemaEtiqueta = z.object({
  nombre: z.string().trim().min(1, "Escriba el nombre").max(40),
  emoji: z.string().trim().max(16).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
});

export async function crearEtiqueta(entrada: z.input<typeof esquemaEtiqueta>): Promise<Resultado> {
  const p = esquemaEtiqueta.safeParse(entrada);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const supabase = await createClient();
  const { count } = await supabase.from("tags").select("id", { count: "exact", head: true });
  const { data, error } = await supabase
    .from("tags")
    .insert({ nombre: p.data.nombre, emoji: p.data.emoji || null, color: p.data.color ?? "#64748B", orden: (count ?? 0) + 1 })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.code === "23505" ? "Ya existe una etiqueta con ese nombre" : error.message };
  return listo("Etiqueta creada", data.id);
}

export async function editarEtiqueta(id: string, entrada: z.input<typeof esquemaEtiqueta> & { activa?: boolean }): Promise<Resultado> {
  const p = esquemaEtiqueta.extend({ activa: z.boolean().optional() }).safeParse(entrada);
  if (!p.success || !z.string().uuid().safeParse(id).success) return { ok: false, error: "Datos inválidos" };
  const supabase = await createClient();
  const { error } = await supabase.from("tags").update({ nombre: p.data.nombre, emoji: p.data.emoji || null, color: p.data.color ?? undefined, activa: p.data.activa }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return listo("Etiqueta actualizada");
}

const esquemaProyecto = z
  .object({
    nombre: z.string().trim().min(1, "Escriba el nombre").max(60),
    emoji: z.string().trim().max(16).nullable().optional(),
    presupuesto: z.coerce.number().int().nonnegative().nullable(),
    fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    moneda: z.string().trim().toUpperCase().length(3).nullable(),
    tasa_cambio: z.coerce.number().positive().nullable(),
    notas: z.string().trim().max(500).nullable(),
  })
  .refine((v) => !v.fecha_inicio || !v.fecha_fin || v.fecha_fin >= v.fecha_inicio, { message: "La fecha final es antes de la inicial" });

export type EntradaProyecto = z.input<typeof esquemaProyecto>;

export async function guardarProyecto(id: string | null, entrada: EntradaProyecto): Promise<Resultado> {
  const p = esquemaProyecto.safeParse(entrada);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const v = p.data;
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("projects").update({ ...v, emoji: v.emoji || null }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    return listo("Proyecto actualizado", id);
  }
  // Cada proyecto nuevo tiene su propia etiqueta para marcar gastos.
  const { data: tag, error: e1 } = await supabase.from("tags").insert({ nombre: v.nombre, emoji: v.emoji || "📁", color: "#8B5CF6", orden: 99 }).select("id").single();
  if (e1) return { ok: false, error: e1.code === "23505" ? "Ya existe una etiqueta con ese nombre" : e1.message };
  const { data, error } = await supabase.from("projects").insert({ ...v, emoji: v.emoji || null, tag_id: tag.id }).select("id").single();
  if (error) return { ok: false, error: error.message };
  return listo("Proyecto creado", data.id);
}

/** Crea (o renueva) el token secreto del feed de calendario. Renovarlo invalida el enlace anterior. */
export async function renovarTokenCalendario(): Promise<Resultado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión vencida" };
  const token = randomBytes(24).toString("base64url");
  const { error } = await supabase.from("user_settings").upsert({ user_id: user.id, calendario_token: token });
  if (error) return { ok: false, error: error.message };
  return listo("Enlace de calendario listo", token);
}
