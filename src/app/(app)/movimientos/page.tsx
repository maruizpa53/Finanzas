import { VistaMovimientos, type FiltrosMovimientos } from "@/components/vistas/movimientos";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Movimientos · Mis Finanzas" };

export default async function MovimientosPage({ searchParams }: { searchParams: Promise<FiltrosMovimientos> }) {
  const [datos, filtros] = await Promise.all([cargarDatos(), searchParams]);
  return <VistaMovimientos datos={datos} filtros={filtros} />;
}
