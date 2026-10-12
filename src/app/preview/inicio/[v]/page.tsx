import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/shell";
import { Encabezado } from "@/components/app/encabezado";
import { cerrarSesion } from "@/app/auth/actions";
import { EJEMPLO } from "@/components/inicio/datos-ejemplo";
import { AvisoEjemplo } from "@/components/inicio/piezas";
import { InicioA, InicioB, InicioC } from "@/components/inicio/variantes";

// Vista previa de propuestas de diseño. Solo existe en desarrollo.
const VARIANTES = { a: InicioA, b: InicioB, c: InicioC } as const;

export default async function PreviewInicio({ params }: { params: Promise<{ v: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { v } = await params;
  const Variante = VARIANTES[v as keyof typeof VARIANTES];
  if (!Variante) notFound();

  return (
    <AppShell cerrarSesion={cerrarSesion}>
      <AvisoEjemplo />
      <Encabezado titulo="Hola, Miguel" descripcion="Lunes 12 de octubre · así va su mes" />
      <Variante d={EJEMPLO} />
    </AppShell>
  );
}
