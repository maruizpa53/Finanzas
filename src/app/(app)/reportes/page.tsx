import { VistaReportes } from "@/components/vistas/reportes";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reportes · Mis Finanzas" };

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const [datos, sp] = await Promise.all([cargarDatos(), searchParams]);
  return <VistaReportes datos={datos} mesParam={sp.mes} />;
}
