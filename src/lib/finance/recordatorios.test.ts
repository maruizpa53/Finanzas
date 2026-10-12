import { describe, expect, it } from "vitest";
import { DATOS_EJEMPLO } from "./fixture";
import { recordatorios } from "./recordatorios";

describe("recordatorios del banner", () => {
  const r = recordatorios(DATOS_EJEMPLO);

  it("incluye movimientos por revisar, Lemon y la cuenta regresiva del viaje", () => {
    const ids = r.map((x) => x.id);
    expect(ids).toContain("revisar");
    expect(ids).toContain("lemon");
    const corea = r.find((x) => x.id === "proy-pr-corea");
    expect(corea?.titulo).toBe("World Cup Corea: faltan 39 días");
    expect(corea?.texto).toBe("Lleva $9.950.000 de $18.000.000");
  });

  it("si no hay nada pendiente, muestra que todo está al día", () => {
    const vacio = recordatorios({ ...DATOS_EJEMPLO, movimientos: [], gastosLemon: [], recurrentes: [], deudas: [], ahorros: [], cuentas: [], proyectos: [], presupuestos: [] });
    expect(vacio.map((x) => x.id)).toEqual(["al-dia"]);
  });
});
