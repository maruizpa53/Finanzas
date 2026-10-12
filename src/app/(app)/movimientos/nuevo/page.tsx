import { Encabezado } from "@/components/app/encabezado";
import { RegistroRapido, type PrefillRegistro } from "@/components/fin/registro";
import { cargarDatos, cargarPreferencias } from "@/lib/data/cargar";
import { categoriasFrecuentes } from "@/lib/finance/frecuentes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registrar · Mis Finanzas" };

export default async function NuevoMovimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ recurrente?: string; tipo?: string }>;
}) {
  const [datos, prefs, sp] = await Promise.all([cargarDatos(3), cargarPreferencias(), searchParams]);
  let prefill: PrefillRegistro | undefined;
  const r = sp.recurrente ? datos.recurrentes.find((x) => x.id === sp.recurrente) : undefined;
  if (r) {
    prefill = {
      monto: r.monto_esperado ?? undefined,
      categoriaId: r.categoria_id ?? undefined,
      descripcion: r.nombre,
      recurrenteId: r.id,
      bolsa: r.bolsa,
    };
  } else if (sp.tipo === "pago_tarjeta" || sp.tipo === "transferencia" || sp.tipo === "ingreso") {
    prefill = { tipo: sp.tipo };
  }

  return (
    <>
      <Encabezado titulo={r ? `Pagar: ${r.nombre}` : "Registrar"} className="mx-auto max-w-xl" />
      <RegistroRapido
        cuentas={datos.cuentas}
        categorias={datos.categorias}
        frecuentes={categoriasFrecuentes(datos.movimientos)}
        cuentaDefault={prefs.cuentaDefault}
        bolsaDefault={prefs.bolsaDefault}
        hoy={datos.hoy}
        prefill={prefill}
      />
    </>
  );
}
