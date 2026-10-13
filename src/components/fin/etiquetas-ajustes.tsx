import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HojaFormulario, type CampoFormulario } from "@/components/fin/hoja-formulario";
import { formEtiqueta } from "@/lib/acciones/formularios";
import { cn } from "@/lib/utils";
import type { Etiqueta } from "@/lib/finance/modelo";
import { agruparEtiquetas } from "@/lib/finance/etiquetas";

const DESCRIPCION_GRUPO: Record<string, string> = {
  "Para quién": "Quién se beneficia del gasto",
  Actividad: "Hobbies y frentes de su vida",
  "Viajes y proyectos": "Se crean solas con cada proyecto",
  "Tipo de gasto": "Necesidad vs. gusto (regla 50/30/20)",
  Seguimiento: "Para no olvidar algo de ese gasto",
  Ocasión: "Fechas especiales",
};

function campos(grupos: string[], e?: Etiqueta, grupo?: string): CampoFormulario[] {
  return [
    { nombre: "emoji", etiqueta: "Emoji", tipo: "emoji", inicial: e?.emoji ?? "🏷️" },
    { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", inicial: e?.nombre ?? "" },
    { nombre: "grupo", etiqueta: "Grupo", tipo: "select", inicial: e?.grupo ?? grupo ?? grupos[0], opciones: [...new Set([...grupos, "Otras"])].map((g) => ({ valor: g, nombre: g })) },
    { nombre: "color", etiqueta: "Color", tipo: "texto", inicial: e?.color ?? "#6366F1", placeholder: "#6366F1" },
    ...(e ? [{ nombre: "activa", etiqueta: "Activa (aparece al registrar)", tipo: "check" as const, inicial: e.activa }] : []),
  ];
}

/** Etiquetas organizadas por grupo, con edición y creación por grupo. */
export function EtiquetasAjustes({ etiquetas }: { etiquetas: Etiqueta[] }) {
  const grupos = agruparEtiquetas(etiquetas);
  const nombres = grupos.map(([g]) => g);
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {grupos.map(([grupo, es]) => (
        <div key={grupo}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{grupo}</p>
              {DESCRIPCION_GRUPO[grupo] && <p className="text-muted-foreground text-xs">{DESCRIPCION_GRUPO[grupo]}</p>}
            </div>
            <HojaFormulario
              titulo={`Nueva etiqueta en ${grupo}`}
              disparador={
                <Button variant="ghost" size="icon" aria-label={`Agregar a ${grupo}`}>
                  <Plus />
                </Button>
              }
              accion={formEtiqueta.bind(null, null)}
              campos={campos(nombres, undefined, grupo)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {es.map((e) => (
              <HojaFormulario
                key={e.id}
                titulo="Editar etiqueta"
                descripcion={e.descripcion ?? undefined}
                disparador={
                  <button
                    className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-transform hover:scale-105", !e.activa && "line-through opacity-50")}
                    style={{ borderColor: e.color ?? undefined }}
                    title={e.descripcion ?? undefined}
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: e.color ?? "#64748B" }} />
                    {e.emoji} {e.nombre}
                  </button>
                }
                accion={formEtiqueta.bind(null, e.id)}
                campos={campos(nombres, e)}
              />
            ))}
          </div>
        </div>
      ))}
      <HojaFormulario
        titulo="Nueva etiqueta"
        descripcion="Escriba un grupo nuevo en “Grupo” si ninguno le sirve."
        disparador={
          <Button variant="outline" size="sm" className="justify-self-start rounded-full">
            <Plus className="size-3.5" /> Nueva etiqueta
          </Button>
        }
        accion={formEtiqueta.bind(null, null)}
        campos={campos(nombres).map((c) => (c.nombre === "grupo" ? { ...c, tipo: "texto" as const, inicial: "", placeholder: nombres.join(", ") } : c))}
      />
    </div>
  );
}
