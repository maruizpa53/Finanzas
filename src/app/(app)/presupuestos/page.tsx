import { VistaPresupuestos } from "@/components/vistas/presupuestos";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Presupuestos · Mis Finanzas" };

export default async function Page() {
  const datos = await cargarDatos();
  return <VistaPresupuestos datos={datos} />;
}
