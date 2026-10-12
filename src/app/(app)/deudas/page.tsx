import { VistaDeudas } from "@/components/vistas/patrimonio";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deudas · Mis Finanzas" };

export default async function Page() {
  const datos = await cargarDatos();
  return <VistaDeudas datos={datos} />;
}
