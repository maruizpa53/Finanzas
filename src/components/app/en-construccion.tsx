import { Hammer } from "lucide-react";
import { TODAS } from "./navegacion";
import { Encabezado } from "./encabezado";

export function EnConstruccion({ href, titulo }: { href: string; titulo?: string }) {
  const item = TODAS.find((n) => n.href === href);
  const nombre = titulo ?? item?.titulo ?? "Esta sección";
  return (
    <>
      <Encabezado titulo={nombre} />
      <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center">
        <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-2xl">
          <Hammer className="size-5" />
        </span>
        <p className="font-medium">En construcción</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          {nombre} llega en la sub-fase {item?.subfase ?? "siguiente"} del plan. Sus datos ya están guardados y
          protegidos; esta pantalla solo falta diseñarla.
        </p>
      </div>
    </>
  );
}
