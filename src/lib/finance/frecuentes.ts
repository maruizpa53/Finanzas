import type { Movimiento } from "./modelo";

/** Categorías más usadas (por cantidad de movimientos), de mayor a menor. */
export function categoriasFrecuentes(movs: Movimiento[], n = 8) {
  const conteo = new Map<string, number>();
  for (const m of movs) if (m.categoria_id) conteo.set(m.categoria_id, (conteo.get(m.categoria_id) ?? 0) + 1);
  return [...conteo.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([id]) => id);
}
