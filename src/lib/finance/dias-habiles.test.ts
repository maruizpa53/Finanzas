import { describe, expect, it } from "vitest";
import { diasHabilesDelMes, domingoDePascua, esDiaHabil, festivosColombia } from "./dias-habiles";

describe("festivos de Colombia", () => {
  it("calcula la Pascua", () => {
    expect(domingoDePascua(2026).toISOString().slice(0, 10)).toBe("2026-04-05");
    expect(domingoDePascua(2027).toISOString().slice(0, 10)).toBe("2027-03-28");
  });

  it("lista los 18 festivos de 2026", () => {
    expect([...festivosColombia(2026)].sort()).toEqual([
      "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03",
      "2026-05-01", "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29",
      "2026-07-20", "2026-08-07", "2026-08-17", "2026-10-12", "2026-11-02",
      "2026-11-16", "2026-12-08", "2026-12-25",
    ]);
  });

  it("fines de semana y festivos no son hábiles", () => {
    expect(esDiaHabil("2026-10-12")).toBe(false); // Día de la Raza (lunes)
    expect(esDiaHabil("2026-10-10")).toBe(false); // sábado
    expect(esDiaHabil("2026-10-13")).toBe(true);
  });
});

describe("días hábiles del mes", () => {
  it("octubre 2026 tiene 21 días hábiles", () => {
    expect(diasHabilesDelMes(2026, 10)).toBe(21);
  });

  it("noviembre 2026 tiene 19 (dos festivos)", () => {
    expect(diasHabilesDelMes(2026, 11)).toBe(19);
  });

  it("cuenta solo hasta un día dado", () => {
    expect(diasHabilesDelMes(2026, 10, 11)).toBe(7); // 1,2,5,6,7,8,9
  });
});
