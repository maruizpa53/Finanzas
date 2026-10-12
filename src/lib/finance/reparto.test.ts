import { describe, expect, it } from "vitest";
import { calcularReparto, leerReparto } from "./reparto";

describe("reparto de ingresos", () => {
  it("convierte porcentajes y montos fijos a pesos y deja el resto en la cuenta", () => {
    const r = calcularReparto(15_000_000, [
      { destino: "ahorro", id: "s1", modo: "porcentaje", valor: 10 },
      { destino: "deuda", id: "d1", modo: "monto", valor: 390_000 },
      { destino: "cuenta", id: "nequi", modo: "monto", valor: 500_000 },
    ]);
    expect(r.lineas.map((l) => l.monto)).toEqual([1_500_000, 390_000, 500_000]);
    expect(r.asignado).toBe(2_390_000);
    expect(r.queda).toBe(12_610_000);
    expect(r.excede).toBe(false);
  });

  it("redondea porcentajes hacia abajo para no inventar pesos", () => {
    const r = calcularReparto(1_000_001, [{ destino: "ahorro", id: "s1", modo: "porcentaje", valor: 33.3 }]);
    expect(r.lineas[0].monto).toBe(333_000);
    expect(r.asignado + r.queda).toBe(1_000_001);
  });

  it("marca cuando se reparte más de lo que entró", () => {
    const r = calcularReparto(100_000, [{ destino: "cuenta", id: "x", modo: "monto", valor: 150_000 }]);
    expect(r.excede).toBe(true);
    expect(r.queda).toBe(-50_000);
  });

  it("lee la plantilla guardada ignorando entradas inválidas", () => {
    const l = leerReparto([
      { destino: "ahorro", id: "s1", modo: "porcentaje", valor: 150 },
      { destino: "otro", id: "x", modo: "monto", valor: 1 },
      { destino: "prestamo", id: null, nombre: "Juan", modo: "monto", valor: "200000" },
      null,
    ]);
    expect(l).toEqual([
      { destino: "ahorro", id: "s1", nombre: undefined, modo: "porcentaje", valor: 100 },
      { destino: "prestamo", id: null, nombre: "Juan", modo: "monto", valor: 200_000 },
    ]);
    expect(leerReparto("nada")).toEqual([]);
  });
});
