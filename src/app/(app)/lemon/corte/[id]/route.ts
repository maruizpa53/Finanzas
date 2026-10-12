import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatFecha } from "@/lib/format";

// Cuenta de cobro de un corte Lemon en CSV (se abre directo en Excel, separador ";").
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: corte } = await supabase.from("lemon_settlements").select("id, fecha_corte, monto_presentado").eq("id", id).maybeSingle();
  if (!corte) return new NextResponse("No encontrado", { status: 404 });

  const [{ data: gastos }, { data: cuentas }] = await Promise.all([
    supabase.from("transactions").select("fecha, descripcion, comercio, monto, cuenta_id").eq("lemon_settlement_id", id).eq("tipo", "gasto").order("fecha"),
    supabase.from("accounts").select("id, nombre, ultimos4"),
  ]);
  const cta = new Map((cuentas ?? []).map((c) => [c.id, `${c.nombre}${c.ultimos4 ? ` ···${c.ultimos4}` : ""}`]));
  const celda = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const filas = [
    ["Cuenta de cobro – Lemon First S.A.S."],
    ["Corte", formatFecha(corte.fecha_corte)],
    [],
    ["Fecha", "Concepto", "Comercio", "Tarjeta / cuenta", "Monto"],
    ...(gastos ?? []).map((g) => [formatFecha(g.fecha), g.descripcion, g.comercio ?? "", cta.get(g.cuenta_id) ?? "", g.monto]),
    [],
    ["", "", "", "TOTAL", (gastos ?? []).reduce((s, g) => s + g.monto, 0) || corte.monto_presentado || 0],
  ];
  const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cuenta-de-cobro-lemon-${corte.fecha_corte}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
