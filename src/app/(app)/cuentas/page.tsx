import { VistaCuentas } from "@/components/vistas/patrimonio";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cuentas · Mis Finanzas" };

export default async function Page() {
  const datos = await cargarDatos();
  return <VistaCuentas datos={datos} />;
}
