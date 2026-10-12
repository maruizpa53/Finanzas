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
import { VistaProyecto, VistaProyectos } from "@/components/vistas/proyectos";
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
    "registro-ingreso": (
      <RegistroRapido cuentas={d.cuentas} categorias={d.categorias} frecuentes={[]} cuentaDefault="a-bancolombia" bolsaDefault="personal" hoy={d.hoy} etiquetas={d.etiquetas} proyectos={d.proyectos} deudas={d.deudas} ahorros={d.ahorros} prefill={{ tipo: "ingreso", monto: 15_000_000, categoriaId: "c-sueldo" }} reparto={[{ destino: "cuenta", id: "a-nequi", modo: "monto", valor: 500_000 }, { destino: "deuda", id: "d-sandra", modo: "monto", valor: 390_000 }, { destino: "ahorro", id: "s-cadena", modo: "porcentaje", valor: 10 }]} />
    ),
    registro: (
      <RegistroRapido cuentas={d.cuentas} categorias={d.categorias} frecuentes={categoriasFrecuentes(d.movimientos)} cuentaDefault="a-bancolombia" bolsaDefault="personal" hoy={d.hoy} etiquetas={d.etiquetas} proyectos={d.proyectos} deudas={d.deudas} ahorros={d.ahorros} tagsDefault={["t-mio"]} />
    ),
    presupuestos: <VistaPresupuestos datos={d} />,
    recurrentes: <VistaRecurrentes datos={d} />,
    lemon: <VistaLemon datos={d} />,
    deudas: <VistaDeudas datos={d} />,
    ahorro: <VistaAhorro datos={d} />,
    cuentas: <VistaCuentas datos={d} />,
    reportes: <VistaReportes datos={d} />,
    ajustes: <VistaAjustes datos={d} />,
    proyectos: <VistaProyectos datos={d} />,
    proyecto: <VistaProyecto datos={d} proyecto={d.proyectos[0]} />,
  };
  const vista = vistas[pantalla];
  if (!vista) notFound();
  return <AppShell cerrarSesion={cerrarSesion}>{vista}</AppShell>;
}
