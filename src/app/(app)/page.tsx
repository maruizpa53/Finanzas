import { VistaInicio } from "@/components/vistas/inicio";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const datos = await cargarDatos();
  return <VistaInicio datos={datos} />;
}
