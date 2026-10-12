import { VistaLemon } from "@/components/vistas/lemon";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lemon · Mis Finanzas" };

export default async function Page() {
  const datos = await cargarDatos();
  return <VistaLemon datos={datos} />;
}
