import { describe, expect, it } from "vitest";
import { enlaceGoogleCalendar, generarIcs } from "./ics";

const feed = {
  recurrentes: [
    { id: "r1", nombre: "Cuota apartamento", monto: 1_100_588, variable: false, frecuencia: "mensual", dia: 5, tipo: "gasto" },
    { id: "r2", nombre: "Luz", monto: null, variable: true, frecuencia: "mensual", dia: 31, tipo: "gasto" },
    { id: "r3", nombre: "Pañales", monto: 100_000, variable: false, frecuencia: "quincenal", dia: 1, tipo: "gasto" },
  ],
  deudas: [{ id: "d1", nombre: "Sandra Ballesteros", monto: 390_000, dia: 18 }],
  tarjetas: [{ id: "t1", nombre: "Nu", corte: 15, pago: null }],
  proyectos: [{ id: "p1", nombre: "World Cup Corea", emoji: "🇰🇷", inicio: "2026-11-20", fin: "2026-12-05" }],
};

describe("feed de calendario", () => {
  const ics = generarIcs(feed, "2026-10-12", "https://x.app", new Date("2026-10-12T15:00:00Z"));

  it("crea eventos recurrentes desde la próxima fecha", () => {
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toMatch(/UID:rec-r1@finanzas\r\nDTSTAMP:20261012T150000Z\r\nDTSTART;VALUE=DATE:20261105/);
    expect(ics).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=5");
    expect(ics).toContain("$1.100.588");
  });

  it("usa el último día del mes para pagos del 29 al 31", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20261031");
    expect(ics).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=-1");
  });

  it("los quincenales caen dos veces al mes", () => {
    expect(ics).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=1,16");
  });

  it("incluye deudas, cortes y el viaje con su rango de fechas", () => {
    expect(ics).toContain("Pago Sandra Ballesteros");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261015");
    expect(ics).toMatch(/DTSTART;VALUE=DATE:20261120\r\nDTEND;VALUE=DATE:20261206/);
  });

  it("arma el enlace para agregar un pago a Google Calendar", () => {
    const u = enlaceGoogleCalendar("Pagar luz", "2026-10-31");
    expect(u).toContain("dates=20261031%2F20261101");
    expect(u.startsWith("https://calendar.google.com/calendar/render?")).toBe(true);
  });
});
