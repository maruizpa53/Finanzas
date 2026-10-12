import { VistaAjustes } from "@/components/vistas/ajustes";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajustes · Mis Finanzas" };

export default async function Page() {
  const datos = await cargarDatos();
  return <VistaAjustes datos={datos} />;
}
