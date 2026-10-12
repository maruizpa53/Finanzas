import { VistaAhorro } from "@/components/vistas/patrimonio";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ahorro y metas · Mis Finanzas" };

export default async function Page() {
  const datos = await cargarDatos();
  return <VistaAhorro datos={datos} />;
}
