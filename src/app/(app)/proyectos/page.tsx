import { VistaProyectos } from "@/components/vistas/proyectos";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Viajes y proyectos · Mis Finanzas" };

export default async function ProyectosPage() {
  return <VistaProyectos datos={await cargarDatos(2)} />;
}
