import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { cerrarSesion } from "@/app/auth/actions";
import { DATOS_EJEMPLO } from "@/lib/finance/fixture";
import { VistaInicio } from "@/components/vistas/inicio";
import { VistaMovimientos } from "@/components/vistas/movimientos";
import { VistaPresupuestos } from "@/components/vistas/presupuestos";
import { VistaRecurrentes } from "@/components/vistas/recurrentes";
import { VistaLemon } from "@/components/vistas/lemon";
import { VistaAhorro, VistaCuentas, VistaDeudas } from "@/components/vistas/patrimonio";
import { VistaReportes } from "@/components/vistas/reportes";
import { VistaAjustes } from "@/components/vistas/ajustes";
import { RegistroRapido } from "@/components/fin/registro";
import { categoriasFrecuentes } from "@/lib/finance/frecuentes";

// Vistas previas con datos de ejemplo para revisar el diseño. Solo existen en desarrollo.
export default async function Preview({ params }: { params: Promise<{ pantalla: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { pantalla } = await params;
  const d = DATOS_EJEMPLO;
  const vistas: Record<string, React.ReactNode> = {
    inicio: <VistaInicio datos={d} />,
    movimientos: <VistaMovimientos datos={d} filtros={{}} />,
    registro: (
      <RegistroRapido cuentas={d.cuentas} categorias={d.categorias} frecuentes={categoriasFrecuentes(d.movimientos)} cuentaDefault="a-bancolombia" bolsaDefault="personal" hoy={d.hoy} />
    ),
    presupuestos: <VistaPresupuestos datos={d} />,
    recurrentes: <VistaRecurrentes datos={d} />,
    lemon: <VistaLemon datos={d} />,
    deudas: <VistaDeudas datos={d} />,
    ahorro: <VistaAhorro datos={d} />,
    cuentas: <VistaCuentas datos={d} />,
    reportes: <VistaReportes datos={d} />,
    ajustes: <VistaAjustes datos={d} />,
  };
  const vista = vistas[pantalla];
  if (!vista) notFound();
  return <AppShell cerrarSesion={cerrarSesion}>{vista}</AppShell>;
}
