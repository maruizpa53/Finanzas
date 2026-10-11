import { describe, expect, it } from "vitest";
import {
  calcularLemonMeDebe,
  equivalenteMensual,
  estadoPresupuesto,
  presupuestoDelMes,
  proyeccionCierreMes,
  relacionDeudaIngresos,
  resumenMes,
  saldoCuenta,
  usoDeCupo,
  type MovimientoSaldo,
} from "./calculos";

describe("saldos de cuentas", () => {
  const BANCO = "banco";
  const NU = "nu-tc";
  const NEQUI = "nequi";

  const movimientos: MovimientoSaldo[] = [
    { monto: 15_000_000, tipo: "ingreso", cuenta_id: BANCO, cuenta_destino_id: null },
    { monto: 380_000, tipo: "gasto", cuenta_id: NU, cuenta_destino_id: null }, // Meta con la Nu
    { monto: 45_000, tipo: "gasto", cuenta_id: NEQUI, cuenta_destino_id: null },
    { monto: 500_000, tipo: "transferencia", cuenta_id: BANCO, cuenta_destino_id: NEQUI },
    { monto: 380_000, tipo: "pago_tarjeta", cuenta_id: BANCO, cuenta_destino_id: NU },
  ];

  it("ingreso suma, gasto resta, transferencia mueve entre cuentas", () => {
    expect(saldoCuenta(0, movimientos, BANCO)).toBe(15_000_000 - 500_000 - 380_000);
    expect(saldoCuenta(0, movimientos, NEQUI)).toBe(500_000 - 45_000);
  });

  it("pagar la tarjeta deja su deuda en cero sin contar un gasto nuevo", () => {
    expect(saldoCuenta(0, movimientos, NU)).toBe(0);
  });

  it("la suma de todas las cuentas cambia solo por ingresos y gastos", () => {
    const total = [BANCO, NU, NEQUI].reduce((s, c) => s + saldoCuenta(0, movimientos, c), 0);
    expect(total).toBe(15_000_000 - 380_000 - 45_000);
  });

  it("calcula el uso de cupo", () => {
    expect(usoDeCupo(-2_000_000, 8_000_000)).toBe(0.25);
    expect(usoDeCupo(100_000, 8_000_000)).toBe(0);
    expect(usoDeCupo(-1, null)).toBeNull();
  });
});

describe("resumen del mes", () => {
  it("separa gasto personal de Lemon y freelance", () => {
    const r = resumenMes([
      { monto: 15_000_000, tipo: "ingreso", bolsa: "personal" },
      { monto: 2_000_000, tipo: "ingreso", bolsa: "freelance" },
      { monto: 380_000, tipo: "ingreso", bolsa: "lemon" }, // reembolso: no es ingreso
      { monto: 1_100_588, tipo: "gasto", bolsa: "personal" },
      { monto: 380_000, tipo: "gasto", bolsa: "lemon" },
      { monto: 100_000, tipo: "gasto", bolsa: "freelance" },
      { monto: 500_000, tipo: "pago_tarjeta", bolsa: "personal" },
      { monto: 200_000, tipo: "transferencia", bolsa: "personal" },
    ]);
    expect(r.ingresos).toBe(17_000_000);
    expect(r.gastoPersonal).toBe(1_100_588);
    expect(r.gastoLemon).toBe(380_000);
    expect(r.gastoFreelance).toBe(100_000);
    expect(r.flujoNeto).toBe(17_000_000 - 1_100_588 - 100_000);
    expect(r.tasaAhorro).toBeCloseTo(15_799_412 / 17_000_000);
  });

  it("sin ingresos la tasa de ahorro es null", () => {
    expect(resumenMes([{ monto: 1000, tipo: "gasto", bolsa: "personal" }]).tasaAhorro).toBeNull();
  });
});

describe("presupuestos", () => {
  it("mercado de octubre 2026 = $1.000.000 + $13.000 × 21 días hábiles", () => {
    expect(presupuestoDelMes({ monto: 1_000_000, monto_diario_habil: 13_000 }, 2026, 10)).toBe(1_273_000);
  });

  it("alerta al 80 % y excedido al 100 %", () => {
    expect(estadoPresupuesto(1_000_000, 790_000).nivel).toBe("ok");
    expect(estadoPresupuesto(1_000_000, 800_000).nivel).toBe("alerta");
    expect(estadoPresupuesto(1_000_000, 1_000_000).nivel).toBe("excedido");
    expect(estadoPresupuesto(1_000_000, 1_200_000).disponible).toBe(-200_000);
    expect(estadoPresupuesto(0, 0).nivel).toBe("ok");
  });

  it("proyecta el gasto al cierre según el ritmo", () => {
    // $500.000 en 10 días de un mes de 31 → $1.550.000
    expect(proyeccionCierreMes(500_000, 2026, 10, 10)).toBe(1_550_000);
  });
});

describe("Lemon me debe", () => {
  it("suma gastos sin corte y lo presentado sin pagar", () => {
    const r = calcularLemonMeDebe(
      [
        { monto: 380_000, reembolso_estado: "pendiente", lemon_settlement_id: null },
        { monto: 120_000, reembolso_estado: "pendiente", lemon_settlement_id: null },
        { monto: 1_000_000, reembolso_estado: "presentado", lemon_settlement_id: "c2" },
        { monto: 700_000, reembolso_estado: "reembolsado", lemon_settlement_id: "c1" },
      ],
      [
        { id: "c1", monto_presentado: 700_000, monto_reembolsado: 700_000, estado: "reembolsado" },
        { id: "c2", monto_presentado: null, monto_reembolsado: 400_000, estado: "reembolsado_parcial" },
      ],
    );
    expect(r.pendienteSinCorte).toBe(500_000);
    expect(r.presentadoSinPagar).toBe(600_000);
    expect(r.total).toBe(1_100_000);
  });

  it("usa el monto presentado del corte aunque no tenga gastos asociados", () => {
    const r = calcularLemonMeDebe([], [
      { id: "junio", monto_presentado: 2_500_000, monto_reembolsado: 0, estado: "presentado" },
    ]);
    expect(r.total).toBe(2_500_000);
  });

  it("un corte sin monto ni gastos no suma", () => {
    const r = calcularLemonMeDebe([], [
      { id: "junio", monto_presentado: null, monto_reembolsado: 0, estado: "presentado" },
    ]);
    expect(r.total).toBe(0);
  });

  it("nunca resta si Lemon pagó de más en un corte", () => {
    const r = calcularLemonMeDebe([], [
      { id: "c", monto_presentado: 100_000, monto_reembolsado: 150_000, estado: "reembolsado_parcial" },
    ]);
    expect(r.total).toBe(0);
  });
});

describe("deudas", () => {
  it("relación cuotas / ingresos", () => {
    expect(relacionDeudaIngresos(555_000, 15_000_000)).toBeCloseTo(0.037);
    expect(relacionDeudaIngresos(555_000, 0)).toBeNull();
  });
});

describe("equivalente mensual de recurrentes", () => {
  it("convierte cada frecuencia", () => {
    expect(equivalenteMensual(13_000, "diaria_habil", 2026, 10)).toBe(273_000);
    expect(equivalenteMensual(100_000, "quincenal", 2026, 10)).toBe(200_000);
    expect(equivalenteMensual(1_100_588, "mensual", 2026, 10)).toBe(1_100_588);
    expect(equivalenteMensual(120_000, "bimestral", 2026, 10)).toBe(60_000);
    expect(equivalenteMensual(120_000, "anual", 2026, 10)).toBe(10_000);
    expect(equivalenteMensual(12_000, "semanal", 2026, 10)).toBe(52_000);
  });
});
