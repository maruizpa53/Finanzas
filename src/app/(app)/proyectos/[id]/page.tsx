import { notFound } from "next/navigation";
import { VistaProyecto } from "@/components/vistas/proyectos";
import { cargarDatos } from "@/lib/data/cargar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proyecto · Mis Finanzas" };

export default async function ProyectoPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, datos] = await Promise.all([params, cargarDatos(2)]);
  const proyecto = datos.proyectos.find((p) => p.id === id);
  if (!proyecto) notFound();
  return <VistaProyecto datos={datos} proyecto={proyecto} />;
}
