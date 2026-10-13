// Etiquetas compartidas entre servidor y cliente.
import type { Beneficiario, Cuenta } from "./modelo";

export const BENEFICIARIOS: { valor: Beneficiario; nombre: string }[] = [
  { valor: "yo", nombre: "Yo" },
  { valor: "hogar", nombre: "Hogar" },
  { valor: "matias", nombre: "Matías" },
  { valor: "hijo_menor", nombre: "Hijo menor" },
  { valor: "esposa", nombre: "Esposa" },
  { valor: "milo", nombre: "Milo" },
];

export function nombreCuenta(c: Pick<Cuenta, "nombre" | "ultimos4">) {
  return `${c.nombre}${c.ultimos4 ? ` ···${c.ultimos4}` : ""}`;
}

/** Agrupa etiquetas por su grupo respetando el orden. */
export function agruparEtiquetas<T extends { grupo: string; orden: number }>(etiquetas: T[]): [string, T[]][] {
  const grupos = new Map<string, T[]>();
  for (const e of [...etiquetas].sort((a, b) => a.orden - b.orden)) grupos.set(e.grupo, [...(grupos.get(e.grupo) ?? []), e]);
  return [...grupos.entries()];
}
