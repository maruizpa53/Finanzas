"use server";

// Adaptadores de los formularios genéricos (valores en texto) a las acciones tipadas.
import type { Resultado } from "./movimientos";
import { editarAhorro, editarCuenta, editarDeuda, editarIngreso, guardarCategoria, registrarAbono, registrarAporte } from "./patrimonio";

type Valores = Record<string, string | boolean>;
const num = (v: string | boolean | undefined) => (typeof v === "string" && v.trim() !== "" ? Number(v.replace(/\./g, "").replace(",", ".")) : null);
const dec = (v: string | boolean | undefined) => (typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : null);
const txt = (v: string | boolean | undefined) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

export async function formAbono(debtId: string, v: Valores): Promise<Resultado> {
  const monto = num(v.monto) ?? 0;
  return registrarAbono({ debt_id: debtId, monto, capital: num(v.capital) ?? monto, fecha: String(v.fecha), cuenta_id: String(v.cuenta_id) });
}

export async function formDeuda(id: string, v: Valores): Promise<Resultado> {
  const tasa = dec(v.tasa);
  return editarDeuda({
    id,
    saldo_hoy: num(v.saldo),
    cuota: num(v.cuota),
    tasa_mensual: tasa === null ? null : tasa / 100,
    dia_pago: num(v.dia_pago),
    solo_intereses: Boolean(v.solo_intereses),
    notas: txt(v.notas),
  });
}

export async function formAporte(savingId: string, v: Valores): Promise<Resultado> {
  return registrarAporte({ saving_id: savingId, monto: num(v.monto) ?? 0, fecha: String(v.fecha), cuenta_id: String(v.cuenta_id) });
}

export async function formAhorro(id: string, v: Valores): Promise<Resultado> {
  return editarAhorro({
    id,
    acumulado_inicial: num(v.acumulado) ?? 0,
    aporte_mensual: num(v.aporte),
    meta_monto: num(v.meta),
    fecha_inicio: txt(v.fecha_inicio),
    fecha_entrega: txt(v.fecha_entrega),
    dia_aporte: num(v.dia_aporte),
  });
}

export async function formCuenta(id: string, v: Valores): Promise<Resultado> {
  return editarCuenta({
    id,
    nombre: String(v.nombre),
    ultimos4: txt(v.ultimos4),
    cupo: num(v.cupo),
    dia_corte: num(v.dia_corte),
    dia_pago: num(v.dia_pago),
    saldo_hoy: num(v.saldo),
  });
}

export async function formCategoria(id: string | null, parentId: string | null, v: Valores): Promise<Resultado> {
  return guardarCategoria({ id, parent_id: parentId, nombre: String(v.nombre), icono: String(v.icono ?? ""), activa: v.activa === undefined ? true : Boolean(v.activa) });
}

export async function formIngreso(id: string, v: Valores): Promise<Resultado> {
  return editarIngreso({ id, monto_esperado: num(v.monto), dia_pago: num(v.dia_pago) });
}
