// Categoría sugerida para una transferencia según a dónde va la plata.
import type { Categoria, Cuenta, TipoMovimiento } from "./modelo";

export function nombreCategoriaTransferencia(tipo: TipoMovimiento, destino: Pick<Cuenta, "tipo" | "nombre"> | undefined): string {
  if (tipo === "pago_tarjeta" || destino?.tipo === "credito") return "Pago de tarjeta";
  if (destino?.tipo === "efectivo") return "Retiro de efectivo";
  if (destino && /global\s?66/i.test(destino.nombre)) return "Cambio de divisas";
  return "Entre mis cuentas";
}

export function categoriaTransferenciaSugerida(tipo: TipoMovimiento, destino: Pick<Cuenta, "tipo" | "nombre"> | undefined, categorias: Categoria[]) {
  const nombre = nombreCategoriaTransferencia(tipo, destino);
  return categorias.find((c) => c.parent_id && c.tipo === "transferencia" && c.nombre === nombre)?.id ?? null;
}
