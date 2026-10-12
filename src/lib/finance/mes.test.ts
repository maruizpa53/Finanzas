import { describe, expect, it } from "vitest";
import { DATOS_EJEMPLO } from "./fixture";
import { acumuladoDiario, comparacionMesAnterior, ocurrenciasDelMes, planDelMes, presupuestosDelMes, proximosPagos, tendencia } from "./mes";
import { calcularLemonMeDebe } from "./calculos";
import { diasPromedioReembolso, saldoActualDeuda, simularPlan } from "./deudas";

const d = DATOS_EJEMPLO;

describe("ocurrencias del mes (octubre 2026)", () => {
  const oc = ocurrenciasDelMes(d, 2026, 10);
  const de = (nombre: string) => oc.filter((o) => o.recurrente.nombre === nombre);

  it("excluye los recurrentes de día hábil (onces van al presupuesto)", () => {
    expect(de("Onces Matías")).toHaveLength(0);
  });

  it("detecta pagos por categoría fija aunque no estén vinculados", () => {
    expect(de("Cuota apartamento")[0].pagado).toBe(true);
    expect(de("Pensión colegio Matías")[0].pagado).toBe(false);
  });

  it("los quincenales generan dos pagos y cuentan cada uno", () => {
    const p = de("Pañales");
    expect(p).toHaveLength(2);
    expect(p.map((x) => x.fecha)).toEqual(["2026-10-01", "2026-10-16"]);
    expect(p.map((x) => x.pagado)).toEqual([true, false]);
  });

  it("estima los variables con el promedio de pagos anteriores", () => {
    expect(de("Luz")[0].montoEsperado).toBe(182_000);
    expect(de("Internet")[0].montoEsperado).toBe(115_000);
    expect(de("Netflix")[0].montoEsperado).toBeNull();
  });

  it("clasifica ahorro y deudas", () => {
    expect(de("Cadena")[0].clase).toBe("ahorro");
    expect(de("Cuota Sandra Ballesteros")[0].clase).toBe("deudas");
    expect(de("Sura plan complementario")[0].clase).toBe("fijos");
  });
});

describe("plan del mes y disponible para gastar", () => {
  const p = planDelMes(d, 2026, 10);

  it("excluye Lemon, transferencias y pagos de tarjeta del gasto", () => {
    expect(p.gastado).toBe(2_735_664);
  });

  it("fijos pagados y pendientes", () => {
    expect(p.fijosPagados).toBe(1_657_664);
    expect(p.fijosPendientes).toBe(3_212_150);
    expect(p.pendientesSinMonto).toBe(1);
  });

  it("disponible = ingreso − gastado − fijos pendientes", () => {
    expect(p.ingreso).toBe(15_000_000);
    expect(p.disponible).toBe(15_000_000 - 2_735_664 - 3_212_150);
    expect(p.diasRestantes).toBe(20);
    expect(p.porDia).toBe(Math.floor(p.disponible / 20));
  });

  it("los segmentos del plan suman exactamente el ingreso", () => {
    const s = p.segmentos;
    expect(s.ahorro).toBe(1_400_000);
    expect(s.deudas).toBe(555_000);
    expect(s.variable).toBe(1_078_000);
    expect(s.fijos + s.ahorro + s.deudas + s.variable + s.disponible).toBe(p.ingreso);
  });
});

describe("presupuestos", () => {
  const ps = presupuestosDelMes(d, 2026, 10);
  it("mercado incluye las onces por día hábil", () => {
    const m = ps.find((x) => x.categoria.nombre === "Mercado")!;
    expect(m.presupuesto).toBe(1_273_000);
    expect(m.gastado).toBe(675_000);
  });
  it("restaurantes suma Nequi y tarjeta", () => {
    expect(ps.find((x) => x.categoria.nombre === "Restaurantes")!.gastado).toBe(365_000);
  });
});

describe("series", () => {
  it("acumulado diario termina hoy y compara con el mes anterior", () => {
    const serie = acumuladoDiario(d, 2026, 10);
    expect(serie).toHaveLength(31);
    expect(serie[11].esteMes).toBe(2_735_664);
    expect(serie[12].esteMes).toBeNull();
    const c = comparacionMesAnterior(d, 2026, 10);
    expect(c.actual).toBe(2_735_664);
  });

  it("tendencia de ingresos y gastos", () => {
    const t = tendencia(d, 2026, 10, 2);
    expect(t.map((x) => x.clave)).toEqual(["2026-09", "2026-10"]);
    expect(t[1].ingresos).toBe(15_000_000);
  });
});

describe("Lemon", () => {
  it("todo lo pendiente sin corte suma en Lemon me debe", () => {
    const r = calcularLemonMeDebe(
      d.gastosLemon.map((g) => ({ monto: g.monto, reembolso_estado: g.reembolso_estado!, lemon_settlement_id: g.lemon_settlement_id })),
      d.cortes,
    );
    expect(r.total).toBe(1_680_000);
  });

  it("días promedio de reembolso", () => {
    expect(diasPromedioReembolso(d.cortes)).toBeNull();
    expect(
      diasPromedioReembolso([
        { ...d.cortes[0], estado: "reembolsado", fecha_corte: "2026-06-30", fecha_reembolso: "2026-07-20" },
        { ...d.cortes[0], estado: "reembolsado", fecha_corte: "2026-08-01", fecha_reembolso: "2026-08-11" },
      ]),
    ).toBe(15);
  });
});

describe("deudas", () => {
  it("saldo actual descuenta abonos a capital posteriores a la fecha del saldo", () => {
    const sandra = d.deudas[0];
    expect(
      saldoActualDeuda(sandra, [
        { id: "x", debt_id: "d-sandra", fecha: "2026-10-18", monto_total: 390_000, capital: 390_000, interes: 0 },
        { id: "y", debt_id: "d-sandra", fecha: "2026-09-18", monto_total: 390_000, capital: 390_000, interes: 0 },
      ]),
    ).toBe(780_000);
  });

  const entrada = [
    { acreedor: "Sandra", saldo: 1_170_000, tasaMensual: 0, cuota: 390_000, soloIntereses: false },
    { acreedor: "Martha", saldo: 5_500_000, tasaMensual: 0.03, cuota: 165_000, soloIntereses: true },
    { acreedor: "Giovanni", saldo: 1_500_000, tasaMensual: 0, cuota: 0, soloIntereses: false },
  ];

  it("la avalancha paga menos intereses que la bola de nieve", () => {
    const av = simularPlan(entrada, 300_000, "avalancha");
    const bn = simularPlan(entrada, 300_000, "bola_de_nieve");
    expect(av.meses).not.toBeNull();
    expect(bn.meses).not.toBeNull();
    expect(av.interesesTotales).toBeLessThan(bn.interesesTotales);
    expect(av.orden[0].acreedor).toBe("Sandra"); // termina primero por su cuota
  });

  it("sin aporte extra, solo intereses nunca baja hasta que se libera una cuota", () => {
    const r = simularPlan([entrada[1]], 0, "avalancha");
    expect(r.meses).toBeNull();
  });
});

describe("próximos pagos y proyecciones", () => {
  it("lista lo pendiente de los próximos 7 días con el corte de la Nu", () => {
    const p = proximosPagos(d, 7);
    expect(p.map((x) => `${x.fecha} ${x.nombre}`)).toEqual([
      "2026-10-15 Pensión colegio Matías",
      "2026-10-15 Corte Nu tarjeta de crédito ···3688",
      "2026-10-16 Pañales",
      "2026-10-18 Cuota Sandra Ballesteros",
      "2026-10-19 Cadena",
    ]);
    expect(p[0].dias).toBe(3);
  });

  it("tasa de ahorro proyectada con el gasto variable al ritmo actual", () => {
    const plan = planDelMes(d, 2026, 10);
    expect(plan.variableProyectado).toBe(Math.round((1_078_000 / 12) * 31));
    expect(plan.tasaAhorroProyectada).toBeCloseTo((15_000_000 - 2_914_814 - 555_000 - plan.variableProyectado) / 15_000_000);
  });
});
