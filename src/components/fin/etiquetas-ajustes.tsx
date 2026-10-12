import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HojaFormulario } from "@/components/fin/hoja-formulario";
import { formEtiqueta } from "@/lib/acciones/formularios";
import { cn } from "@/lib/utils";
import type { Etiqueta } from "@/lib/finance/modelo";

const campos = (e?: Etiqueta) => [
  { nombre: "emoji", etiqueta: "Emoji", tipo: "emoji" as const, inicial: e?.emoji ?? "🏷️" },
  { nombre: "nombre", etiqueta: "Nombre", tipo: "texto" as const, inicial: e?.nombre ?? "" },
  { nombre: "color", etiqueta: "Color", tipo: "texto" as const, inicial: e?.color ?? "#6366F1", placeholder: "#6366F1" },
  ...(e ? [{ nombre: "activa", etiqueta: "Activa (aparece al registrar)", tipo: "check" as const, inicial: e.activa }] : []),
];

export function EtiquetasAjustes({ etiquetas }: { etiquetas: Etiqueta[] }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {etiquetas.map((e) => (
          <HojaFormulario
            key={e.id}
            titulo="Editar etiqueta"
            disparador={
              <button
                className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-transform hover:scale-105", !e.activa && "line-through opacity-50")}
                style={{ borderColor: e.color ?? undefined }}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: e.color ?? "#64748B" }} />
                {e.emoji} {e.nombre}
              </button>
            }
            accion={formEtiqueta.bind(null, e.id)}
            campos={campos(e)}
          />
        ))}
        <HojaFormulario
          titulo="Nueva etiqueta"
          descripcion="Úselas para saber para quién o para qué fue un gasto (Mío, Familia, Carro, Billar…). Un gasto puede tener varias."
          disparador={
            <Button variant="outline" size="sm" className="h-7 rounded-full text-xs">
              <Plus className="size-3.5" /> Nueva
            </Button>
          }
          accion={formEtiqueta.bind(null, null)}
          campos={campos()}
        />
      </div>
    </div>
  );
}
