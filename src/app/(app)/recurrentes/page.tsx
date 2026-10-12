import { VistaRecurrentes } from "@/components/vistas/recurrentes";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pagos y calendario · Mis Finanzas" };

export default async function Page() {
  const datos = await cargarDatos();
  return <VistaRecurrentes datos={datos} />;
}
