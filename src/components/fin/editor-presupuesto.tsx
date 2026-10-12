"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { eliminarPresupuesto, guardarPresupuesto } from "@/lib/acciones/planeacion";
import type { Categoria } from "@/lib/finance/modelo";

export function EditorPresupuesto({
  categorias,
  inicial,
  mesClave,
}: {
  categorias: Categoria[];
  inicial?: { id: string; categoria_id: string; monto: number; monto_diario_habil: number; mes: string | null };
  /** aaaa-mm-01 del mes que se está viendo. */
  mesClave: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const [categoriaId, setCategoriaId] = useState(inicial?.categoria_id ?? "");
  const [monto, setMonto] = useState(inicial ? String(inicial.monto) : "");
  const [diario, setDiario] = useState(inicial?.monto_diario_habil ? String(inicial.monto_diario_habil) : "");
  const [soloEsteMes, setSoloEsteMes] = useState(Boolean(inicial?.mes));
  const sel = "border-input h-10 w-full rounded-md border bg-transparent px-3 text-sm";

  function guardar() {
    iniciar(async () => {
      const r = await guardarPresupuesto({
        categoria_id: categoriaId,
        monto: Number(monto || 0),
        monto_diario_habil: Number(diario || 0),
        mes: soloEsteMes ? mesClave : null,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(r.mensaje ?? "Guardado");
      setAbierto(false);
      router.refresh();
    });
  }

  function eliminar() {
    if (!inicial || !confirm("¿Eliminar este presupuesto?")) return;
    iniciar(async () => {
      const r = await eliminarPresupuesto(inicial.id);
      toast[r.ok ? "success" : "error"](r.ok ? "Eliminado" : r.error);
      setAbierto(false);
      router.refresh();
    });
  }

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        {inicial ? (
          <Button variant="ghost" size="icon" aria-label="Editar presupuesto">
            <Pencil />
          </Button>
        ) : (
          <Button variant="outline">
            <Plus />
            Nuevo presupuesto
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pt-5">
          <SheetTitle>{inicial ? "Editar presupuesto" : "Nuevo presupuesto"}</SheetTitle>
          <SheetDescription>Alertas al 80 % y al 100 %.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-5 pb-6">
          <div className="grid gap-1.5">
            <Label>Categoría o grupo</Label>
            <select className={sel} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} disabled={Boolean(inicial)}>
              <option value="">Elija…</option>
              {categorias
                .filter((c) => !c.parent_id && c.tipo === "gasto")
                .map((g) => (
                  <optgroup key={g.id} label={`${g.icono ?? ""} ${g.nombre}`}>
                    <option value={g.id}>Todo el grupo {g.nombre}</option>
                    {categorias
                      .filter((c) => c.parent_id === g.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icono} {c.nombre}
                        </option>
                      ))}
                  </optgroup>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Monto del mes</Label>
              <Input inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))} placeholder="$0" />
            </div>
            <div className="grid gap-1.5">
              <Label>+ por día hábil</Label>
              <Input inputMode="numeric" value={diario} onChange={(e) => setDiario(e.target.value.replace(/\D/g, ""))} placeholder="Opcional" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soloEsteMes} onChange={(e) => setSoloEsteMes(e.target.checked)} />
            Solo para este mes (si no, aplica a todos los meses)
          </label>
          <div className="flex gap-2">
            {inicial && (
              <Button variant="outline" onClick={eliminar} disabled={pendiente}>
                Eliminar
              </Button>
            )}
            <Button className="flex-1" onClick={guardar} disabled={pendiente || !categoriaId}>
              {pendiente ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
