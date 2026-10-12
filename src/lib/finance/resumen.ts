// Agregados de alto nivel que usan varias pantallas.
import { calcularLemonMeDebe } from "./calculos";
import { saldoActualDeuda } from "./deudas";
import type { Datos } from "./modelo";

export function lemonDe(datos: Datos) {
  return calcularLemonMeDebe(
    datos.gastosLemon
      .filter((g) => g.tipo === "gasto")
      .map((g) => ({ monto: g.monto, reembolso_estado: g.reembolso_estado ?? "pendiente", lemon_settlement_id: g.lemon_settlement_id })),
    datos.cortes,
  );
}

export function deudaTotal(datos: Datos) {
  const activas = datos.deudas.filter((d) => d.estado === "activa");
  return {
    total: activas.reduce((s, d) => s + (saldoActualDeuda(d, datos.pagosDeuda) ?? 0), 0),
    cuotas: activas.reduce((s, d) => s + (d.cuota ?? 0), 0),
    cantidad: activas.length,
  };
}

export function porRevisar(datos: Datos) {
  return datos.movimientos.filter((m) => !m.revisado).length;
}
