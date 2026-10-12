// Reparto de un ingreso (estilo "Salary Sorter" de Monzo): cuando entra plata,
// se decide de una vez a dónde va cada parte. Lo que no se reparte se queda
// en la cuenta donde entró.

export type DestinoReparto = "cuenta" | "deuda" | "ahorro" | "prestamo";

export interface LineaReparto {
  destino: DestinoReparto;
  /** Cuenta, deuda o ahorro de destino. En "prestamo" es null (se usa `nombre`). */
  id: string | null;
  /** A quién se presta, o etiqueta libre. */
  nombre?: string;
  modo: "monto" | "porcentaje";
  /** Pesos si modo = monto; 0–100 si modo = porcentaje. */
  valor: number;
}

export interface LineaCalculada extends LineaReparto {
  monto: number;
}

export interface ResultadoReparto {
  lineas: LineaCalculada[];
  asignado: number;
  /** Lo que se queda en la cuenta donde entró el ingreso. */
  queda: number;
  excede: boolean;
}

const DESTINOS: DestinoReparto[] = ["cuenta", "deuda", "ahorro", "prestamo"];

/** Lee la plantilla guardada en user_settings.reparto_ingreso descartando lo que no tenga forma válida. */
export function leerReparto(json: unknown): LineaReparto[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((x) => {
    if (!x || typeof x !== "object") return [];
    const l = x as Record<string, unknown>;
    if (!DESTINOS.includes(l.destino as DestinoReparto)) return [];
    if (l.modo !== "monto" && l.modo !== "porcentaje") return [];
    const valor = Number(l.valor);
    if (!Number.isFinite(valor) || valor < 0) return [];
    return [
      {
        destino: l.destino as DestinoReparto,
        id: typeof l.id === "string" ? l.id : null,
        nombre: typeof l.nombre === "string" ? l.nombre : undefined,
        modo: l.modo,
        valor: l.modo === "porcentaje" ? Math.min(valor, 100) : Math.round(valor),
      },
    ];
  });
}

/** Convierte las líneas a pesos. Los porcentajes se redondean hacia abajo (nunca se inventa plata). */
export function calcularReparto(ingreso: number, lineas: LineaReparto[]): ResultadoReparto {
  const calculadas = lineas.map((l) => ({
    ...l,
    monto: l.modo === "porcentaje" ? Math.floor((ingreso * l.valor) / 100) : Math.round(l.valor),
  }));
  const asignado = calculadas.reduce((s, l) => s + l.monto, 0);
  return { lineas: calculadas, asignado, queda: ingreso - asignado, excede: asignado > ingreso };
}
