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
