import { describe, expect, it } from "vitest";
import { formatCOP, formatCOPCorto, formatFecha, hoyBogota } from "./format";

describe("formatCOP", () => {
  it("usa puntos de miles y sin decimales", () => {
    expect(formatCOP(1234567)).toBe("$1.234.567");
    expect(formatCOP(1100588)).toBe("$1.100.588");
    expect(formatCOP(13000)).toBe("$13.000");
    expect(formatCOP(999)).toBe("$999");
    expect(formatCOP(0)).toBe("$0");
  });

  it("muestra negativos con signo adelante", () => {
    expect(formatCOP(-390000)).toBe("-$390.000");
  });

  it("redondea montos no enteros", () => {
    expect(formatCOP(1499.6)).toBe("$1.500");
  });
});

describe("formatCOPCorto", () => {
  it("abrevia millones y miles", () => {
    expect(formatCOPCorto(15000000)).toBe("$15 M");
    expect(formatCOPCorto(1273000)).toBe("$1,3 M");
    expect(formatCOPCorto(380000)).toBe("$380 mil");
    expect(formatCOPCorto(45000)).toBe("$45.000");
  });
});

describe("fechas", () => {
  it("formatea dd/mm/aaaa", () => {
    expect(formatFecha("2026-10-11")).toBe("11/10/2026");
  });

  it("calcula hoy en Bogotá (UTC-5)", () => {
    // 11/10/2026 02:00 UTC = 10/10/2026 21:00 en Bogotá
    expect(hoyBogota(new Date("2026-10-11T02:00:00Z"))).toBe("2026-10-10");
    expect(hoyBogota(new Date("2026-10-11T06:00:00Z"))).toBe("2026-10-11");
  });
});
