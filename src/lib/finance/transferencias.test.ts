import { describe, expect, it } from "vitest";
import { CATEGORIAS } from "./fixture";
import { categoriaTransferenciaSugerida, nombreCategoriaTransferencia } from "./transferencias";

describe("categoría de transferencias", () => {
  it("elige según el destino", () => {
    expect(nombreCategoriaTransferencia("pago_tarjeta", undefined)).toBe("Pago de tarjeta");
    expect(nombreCategoriaTransferencia("transferencia", { tipo: "credito", nombre: "Nu tarjeta de crédito" })).toBe("Pago de tarjeta");
    expect(nombreCategoriaTransferencia("transferencia", { tipo: "efectivo", nombre: "Efectivo" })).toBe("Retiro de efectivo");
    expect(nombreCategoriaTransferencia("transferencia", { tipo: "billetera", nombre: "Global66" })).toBe("Cambio de divisas");
    expect(nombreCategoriaTransferencia("transferencia", { tipo: "billetera", nombre: "Nequi" })).toBe("Entre mis cuentas");
  });

  it("devuelve el id de la categoría", () => {
    expect(categoriaTransferenciaSugerida("transferencia", { tipo: "efectivo", nombre: "Efectivo" }, CATEGORIAS)).toBe("c-retiro");
    expect(categoriaTransferenciaSugerida("transferencia", undefined, [])).toBeNull();
  });
});
