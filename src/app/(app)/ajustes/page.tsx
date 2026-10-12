import { VistaAjustes } from "@/components/vistas/ajustes";
import { cargarDatos, cargarPreferencias } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajustes · Mis Finanzas" };

export default async function Page() {
  const [datos, prefs] = await Promise.all([cargarDatos(2), cargarPreferencias()]);
  return <VistaAjustes datos={datos} calendarioToken={prefs.calendarioToken} />;
}
