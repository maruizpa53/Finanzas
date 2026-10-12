"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Resultado } from "@/lib/acciones/movimientos";

export type Valores = Record<string, string | boolean>;

export interface CampoFormulario {
  nombre: string;
  etiqueta: string;
  tipo: "monto" | "texto" | "fecha" | "numero" | "decimal" | "select" | "check" | "emoji";
  inicial?: string | boolean | number | null;
  opciones?: { valor: string; nombre: string }[];
  ayuda?: string;
  placeholder?: string;
}

/** Formulario genérico dentro de una hoja lateral. `accion` es una server action ya vinculada. */
export function HojaFormulario({
  titulo,
  descripcion,
  disparador,
  campos,
  accion,
  textoBoton = "Guardar",
}: {
  titulo: string;
  descripcion?: string;
  disparador: React.ReactNode;
  campos: CampoFormulario[];
  accion: (valores: Valores) => Promise<Resultado>;
  textoBoton?: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const inicial = () =>
    Object.fromEntries(campos.map((c) => [c.nombre, c.tipo === "check" ? Boolean(c.inicial) : c.inicial === null || c.inicial === undefined ? "" : String(c.inicial)])) as Valores;
  const [valores, setValores] = useState<Valores>(inicial);
  const poner = (n: string, v: string | boolean) => setValores((x) => ({ ...x, [n]: v }));
  const sel = "border-input h-10 w-full rounded-md border bg-transparent px-3 text-sm";

  return (
    <Sheet
      open={abierto}
      onOpenChange={(o) => {
        setAbierto(o);
        if (o) setValores(inicial());
      }}
    >
      <SheetTrigger asChild>{disparador}</SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pt-5">
          <SheetTitle>{titulo}</SheetTitle>
          {descripcion && <SheetDescription>{descripcion}</SheetDescription>}
        </SheetHeader>
        <form
          className="grid gap-4 px-5 pb-6"
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              const r = await accion(valores);
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              toast.success(r.mensaje ?? "Guardado");
              setAbierto(false);
              router.refresh();
            });
          }}
        >
          {campos.map((c) =>
            c.tipo === "check" ? (
              <label key={c.nombre} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-0.5" checked={Boolean(valores[c.nombre])} onChange={(e) => poner(c.nombre, e.target.checked)} />
                <span>
                  {c.etiqueta}
                  {c.ayuda && <span className="text-muted-foreground block text-xs">{c.ayuda}</span>}
                </span>
              </label>
            ) : (
              <div key={c.nombre} className="grid gap-1.5">
                <Label htmlFor={c.nombre}>{c.etiqueta}</Label>
                {c.tipo === "select" ? (
                  <select id={c.nombre} className={sel} value={String(valores[c.nombre])} onChange={(e) => poner(c.nombre, e.target.value)}>
                    {c.opciones?.map((o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={c.nombre}
                    type={c.tipo === "fecha" ? "date" : "text"}
                    inputMode={c.tipo === "monto" || c.tipo === "numero" ? "numeric" : c.tipo === "decimal" ? "decimal" : undefined}
                    placeholder={c.placeholder}
                    value={String(valores[c.nombre])}
                    className={c.tipo === "emoji" ? "w-20 text-center text-xl" : undefined}
                    onChange={(e) => {
                      const v = e.target.value;
                      poner(c.nombre, c.tipo === "monto" || c.tipo === "numero" ? v.replace(/[^\d-]/g, "") : c.tipo === "decimal" ? v.replace(/[^\d.,]/g, "") : v);
                    }}
                  />
                )}
                {c.ayuda && <p className="text-muted-foreground text-xs">{c.ayuda}</p>}
              </div>
            ),
          )}
          <Button type="submit" disabled={pendiente}>
            {pendiente ? "Guardando…" : textoBoton}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
