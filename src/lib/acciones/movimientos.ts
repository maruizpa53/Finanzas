"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type Resultado = { ok: true; id?: string; mensaje?: string } | { ok: false; error: string };

const BOLSAS = ["personal", "lemon", "freelance"] as const;
const BENEFICIARIOS = ["yo", "hogar", "matias", "hijo_menor", "esposa", "milo"] as const;
const TIPOS = ["gasto", "ingreso", "transferencia", "pago_tarjeta"] as const;

const esquemaMovimiento = z
  .object({
    monto: z.coerce.number().int().positive("El monto debe ser mayor que cero"),
    tipo: z.enum(TIPOS),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    cuenta_id: z.string().uuid("Elija una cuenta"),
    cuenta_destino_id: z.string().uuid().nullable().optional(),
    categoria_id: z.string().uuid().nullable().optional(),
    bolsa: z.enum(BOLSAS).default("personal"),
    beneficiario: z.enum(BENEFICIARIOS).nullable().optional(),
    descripcion: z.string().trim().max(200).optional(),
    comercio: z.string().trim().max(120).nullable().optional(),
    notas: z.string().trim().max(500).nullable().optional(),
    recurring_item_id: z.string().uuid().nullable().optional(),
    etiquetas: z.array(z.string().uuid()).max(10).optional(),
    moneda_original: z.string().trim().length(3).toUpperCase().nullable().optional(),
    monto_original: z.coerce.number().positive().nullable().optional(),
  })
  .refine((v) => (v.tipo === "transferencia" || v.tipo === "pago_tarjeta" ? Boolean(v.cuenta_destino_id) : true), {
    message: "Elija la cuenta de destino",
  })
  .refine((v) => v.cuenta_destino_id !== v.cuenta_id, { message: "Origen y destino deben ser distintos" });

export type EntradaMovimiento = z.input<typeof esquemaMovimiento>;

function revalidarTodo() {
  revalidatePath("/", "layout");
}

type Cliente = Awaited<ReturnType<typeof createClient>>;

/** Reemplaza las etiquetas de un movimiento. */
async function ponerEtiquetas(supabase: Cliente, transactionId: string, etiquetas: string[] | undefined, reemplazar: boolean) {
  if (etiquetas === undefined) return null;
  if (reemplazar) {
    const { error } = await supabase.from("transaction_tags").delete().eq("transaction_id", transactionId);
    if (error) return error;
  }
  if (!etiquetas.length) return null;
  const { error } = await supabase.from("transaction_tags").insert([...new Set(etiquetas)].map((tag_id) => ({ transaction_id: transactionId, tag_id })));
  return error;
}

export async function crearMovimiento(entrada: EntradaMovimiento): Promise<Resultado> {
  const p = esquemaMovimiento.safeParse(entrada);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const v = p.data;
  const supabase = await createClient();

  const esMovEntreCuentas = v.tipo === "transferencia" || v.tipo === "pago_tarjeta";
  let descripcion = v.descripcion;
  let recurrente = v.recurring_item_id ?? null;

  if (!esMovEntreCuentas && v.categoria_id) {
    const { data: cat } = await supabase.from("categories").select("nombre").eq("id", v.categoria_id).single();
    if (!descripcion) descripcion = cat?.nombre ?? "Movimiento";

    // Vincular con un gasto fijo de la misma categoría que aún no tenga pago este mes.
    if (!recurrente && v.tipo === "gasto") {
      const mes = v.fecha.slice(0, 7);
      const { data: items } = await supabase
        .from("recurring_items")
        .select("id, frecuencia")
        .eq("categoria_id", v.categoria_id)
        .eq("activo", true)
        .neq("frecuencia", "diaria_habil");
      for (const it of items ?? []) {
        const veces = it.frecuencia === "quincenal" ? 2 : it.frecuencia === "semanal" ? 4 : 1;
        const { count } = await supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("recurring_item_id", it.id)
          .gte("fecha", `${mes}-01`)
          .lte("fecha", `${mes}-31`);
        if ((count ?? 0) < veces) {
          recurrente = it.id;
          break;
        }
      }
    }
  }
  if (!descripcion) descripcion = v.tipo === "pago_tarjeta" ? "Pago de tarjeta" : v.tipo === "transferencia" ? "Transferencia" : "Movimiento";

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      monto: v.monto,
      tipo: v.tipo,
      fecha: v.fecha,
      cuenta_id: v.cuenta_id,
      cuenta_destino_id: esMovEntreCuentas ? v.cuenta_destino_id : null,
      categoria_id: esMovEntreCuentas ? null : (v.categoria_id ?? null),
      bolsa: esMovEntreCuentas ? "personal" : v.bolsa,
      beneficiario: esMovEntreCuentas ? null : (v.beneficiario ?? null),
      descripcion,
      comercio: v.comercio || null,
      notas: v.notas || null,
      recurring_item_id: recurrente,
      origen: "manual",
      revisado: true,
      moneda_original: v.moneda_original && v.monto_original ? v.moneda_original : null,
      monto_original: v.moneda_original && v.monto_original ? v.monto_original : null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: "No se pudo guardar: " + error.message };
  const eTags = await ponerEtiquetas(supabase, data.id, v.etiquetas, false);
  if (eTags) return { ok: false, error: "Se guardó, pero sin etiquetas: " + eTags.message };

  // Recordar cuenta y bolsa para el próximo registro.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    // Las etiquetas de proyectos (ej. Corea) no se recuerdan: solo las de "para quién" (Mío, Familia…).
    const { data: proys } = await supabase.from("projects").select("tag_id");
    const deProyecto = new Set((proys ?? []).map((x) => x.tag_id));
    await supabase.from("user_settings").upsert({
      user_id: user.id,
      cuenta_default_id: v.cuenta_id,
      bolsa_default: esMovEntreCuentas ? "personal" : v.bolsa,
      ...(v.etiquetas && !esMovEntreCuentas ? { tags_default: v.etiquetas.filter((t) => !deProyecto.has(t)) } : {}),
    });
  }

  revalidarTodo();
  return { ok: true, id: data.id, mensaje: recurrente ? "Guardado y marcado como pago del mes" : "Guardado" };
}

export async function actualizarMovimiento(
  id: string,
  entrada: EntradaMovimiento,
  regla?: { patron: string } | null,
): Promise<Resultado> {
  const p = esquemaMovimiento.safeParse(entrada);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Datos inválidos" };
  const v = p.data;
  const supabase = await createClient();
  const esMovEntreCuentas = v.tipo === "transferencia" || v.tipo === "pago_tarjeta";

  const { error } = await supabase
    .from("transactions")
    .update({
      monto: v.monto,
      tipo: v.tipo,
      fecha: v.fecha,
      cuenta_id: v.cuenta_id,
      cuenta_destino_id: esMovEntreCuentas ? v.cuenta_destino_id : null,
      categoria_id: esMovEntreCuentas ? null : (v.categoria_id ?? null),
      bolsa: esMovEntreCuentas ? "personal" : v.bolsa,
      beneficiario: esMovEntreCuentas ? null : (v.beneficiario ?? null),
      descripcion: v.descripcion || "Movimiento",
      comercio: v.comercio || null,
      notas: v.notas || null,
      revisado: true,
      ...(v.moneda_original !== undefined
        ? { moneda_original: v.moneda_original && v.monto_original ? v.moneda_original : null, monto_original: v.moneda_original && v.monto_original ? v.monto_original : null }
        : {}),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar: " + error.message };
  const eTags = await ponerEtiquetas(supabase, id, v.etiquetas, true);
  if (eTags) return { ok: false, error: "No se pudieron guardar las etiquetas: " + eTags.message };

  let mensaje = "Actualizado";
  if (regla?.patron && v.categoria_id && !esMovEntreCuentas) {
    const patron = regla.patron.trim().toLowerCase();
    await supabase.from("categorization_rules").insert({
      patron,
      tipo_patron: "contiene",
      categoria_id: v.categoria_id,
      bolsa: v.bolsa,
      beneficiario: v.beneficiario ?? null,
      prioridad: 40,
      origen: "aprendida",
    });
    // Aplicar a movimientos similares sin revisar.
    const { data: similares } = await supabase
      .from("transactions")
      .select("id")
      .eq("revisado", false)
      .or(`descripcion.ilike.%${patron.replace(/[%,()]/g, "")}%,comercio.ilike.%${patron.replace(/[%,()]/g, "")}%`);
    if (similares?.length) {
      await supabase
        .from("transactions")
        .update({ categoria_id: v.categoria_id, bolsa: v.bolsa, beneficiario: v.beneficiario ?? null, revisado: true })
        .in("id", similares.map((s) => s.id));
    }
    mensaje = `Actualizado · regla creada${similares?.length ? ` y aplicada a ${similares.length} más` : ""}`;
  }

  revalidarTodo();
  return { ok: true, mensaje };
}

export async function eliminarMovimiento(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar: " + error.message };
  revalidarTodo();
  return { ok: true, mensaje: "Eliminado" };
}

export async function marcarRevisados(ids: string[]): Promise<Resultado> {
  if (!ids.length) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").update({ revisado: true }).in("id", ids);
  if (error) return { ok: false, error: error.message };
  revalidarTodo();
  return { ok: true, mensaje: "Marcados como revisados" };
}

