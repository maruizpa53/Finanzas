import { describe, expect, it } from "vitest";
import { DATOS_EJEMPLO, MOVIMIENTOS_COREA } from "./fixture";
import { resumenProyecto, totalesPorEtiqueta } from "./proyectos";
import type { Movimiento } from "./modelo";

const corea = DATOS_EJEMPLO.proyectos[0];

describe("resumen de proyecto (viaje a Corea)", () => {
  it("suma solo lo etiquetado y calcula lo que queda antes del viaje", () => {
    const r = resumenProyecto(corea, MOVIMIENTOS_COREA, DATOS_EJEMPLO.categorias, "2026-10-12");
    expect(r.gastado).toBe(6_800_000 + 1_250_000 + 1_900_000);
    expect(r.restante).toBe(18_000_000 - 9_950_000);
    expect(r.estado).toBe("planeando");
    expect(r.diasParaEmpezar).toBe(39);
    expect(r.duracion).toBe(16);
    // 8.050.000 / 16 días
    expect(r.porDiaDisponible).toBe(503_125);
    expect(r.porCategoria[0]).toMatchObject({ nombre: "Viajes", total: 9_950_000 });
    expect(r.gastadoMonedaLocal).toBe(Math.round(9_950_000 / 2.95));
  });

  it("durante el viaje calcula el promedio diario y lo disponible por día restante", () => {
    const enViaje: Movimiento[] = [
      ...MOVIMIENTOS_COREA,
      { ...MOVIMIENTOS_COREA[0], id: "x1", fecha: "2026-11-20", monto: 300_000, etiquetas: ["t-corea"] },
      { ...MOVIMIENTOS_COREA[0], id: "x2", fecha: "2026-11-21", monto: 100_000, etiquetas: ["t-corea"] },
      { ...MOVIMIENTOS_COREA[0], id: "x3", fecha: "2026-11-21", monto: 50_000, tipo: "ingreso", etiquetas: ["t-corea"] },
    ];
    const r = resumenProyecto(corea, enViaje, DATOS_EJEMPLO.categorias, "2026-11-21");
    expect(r.estado).toBe("en_curso");
    expect(r.diaActual).toBe(2);
    expect(r.gastado).toBe(9_950_000 + 350_000);
    expect(r.promedioDiario).toBe(175_000);
    // Quedan 7.700.000 para 15 días (21/11 al 05/12)
    expect(r.porDiaDisponible).toBe(Math.floor(7_700_000 / 15));
  });

  it("totaliza gastos por etiqueta", () => {
    const t = totalesPorEtiqueta(MOVIMIENTOS_COREA);
    expect(t.get("t-corea")).toBe(9_950_000);
    expect(t.get("t-mio")).toBe(6_800_000);
  });
});
