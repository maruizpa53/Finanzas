// Formatos de Colombia: montos $1.234.567 y fechas dd/mm/aaaa, zona America/Bogota.

export const ZONA_HORARIA = "America/Bogota";

/** Formatea pesos enteros como $1.234.567 (negativos: -$1.234.567). */
export function formatCOP(monto: number): string {
  if (!Number.isFinite(monto)) return "$0";
  const entero = Math.round(Math.abs(monto));
  const conPuntos = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${monto < 0 && entero !== 0 ? "-" : ""}$${conPuntos}`;
}

/** Versión corta para gráficos y KPIs: $1,2 M · $350 mil · $9.500 */
export function formatCOPCorto(monto: number): string {
  const abs = Math.abs(monto);
  const signo = monto < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const millones = abs / 1_000_000;
    const texto = (Math.round(millones * 10) / 10).toString().replace(".", ",");
    return `${signo}$${texto} M`;
  }
  if (abs >= 100_000) return `${signo}$${Math.round(abs / 1000)} mil`;
  return formatCOP(monto);
}

/** "2026-10-11" → "11/10/2026". Acepta también fechas con hora (ISO). */
export function formatFecha(fecha: string | Date): string {
  if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [a, m, d] = fecha.split("-");
    return `${d}/${m}/${a}`;
  }
  const date = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: ZONA_HORARIA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Fecha de hoy en Bogotá como "aaaa-mm-dd". */
export function hoyBogota(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** (2026, 10) → "octubre de 2026" */
export function nombreMes(anio: number, mes: number): string {
  return `${MESES[mes - 1]} de ${anio}`;
}

/** (2026, 10) → "Octubre de 2026" */
export function tituloMes(anio: number, mes: number): string {
  const t = nombreMes(anio, mes);
  return t[0].toUpperCase() + t.slice(1);
}
