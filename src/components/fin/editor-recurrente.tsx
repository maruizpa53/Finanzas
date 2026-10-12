"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { guardarRecurrente } from "@/lib/acciones/planeacion";
import type { Bolsa, Categoria, Frecuencia, Recurrente } from "@/lib/finance/modelo";

const FRECUENCIAS: { valor: Frecuencia; nombre: string }[] = [
  { valor: "mensual", nombre: "Mensual" },
  { valor: "quincenal", nombre: "Quincenal" },
  { valor: "bimestral", nombre: "Bimestral" },
  { valor: "semanal", nombre: "Semanal" },
  { valor: "diaria_habil", nombre: "Cada día hábil" },
  { valor: "anual", nombre: "Anual" },
];

export function EditorRecurrente({ recurrente, categorias }: { recurrente?: Recurrente; categorias: Categoria[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const [nombre, setNombre] = useState(recurrente?.nombre ?? "");
  const [categoriaId, setCategoriaId] = useState(recurrente?.categoria_id ?? "");
  const [monto, setMonto] = useState(recurrente?.monto_esperado ? String(recurrente.monto_esperado) : "");
  const [variable, setVariable] = useState(recurrente?.es_variable ?? false);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>(recurrente?.frecuencia ?? "mensual");
  const [dia, setDia] = useState(recurrente?.dia_pago ? String(recurrente.dia_pago) : "");
  const [bolsa, setBolsa] = useState<Bolsa>(recurrente?.bolsa ?? "personal");
  const [activo, setActivo] = useState(recurrente?.activo ?? true);
  const sel = "border-input h-10 w-full rounded-md border bg-transparent px-3 text-sm";

  function guardar() {
    iniciar(async () => {
      const r = await guardarRecurrente(recurrente?.id ?? null, {
        nombre,
        categoria_id: categoriaId || null,
        monto_esperado: monto ? Number(monto) : null,
        es_variable: variable,
        frecuencia,
        dia_pago: dia ? Number(dia) : null,
        bolsa,
        activo,
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

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        {recurrente ? (
          <Button variant="ghost" size="icon" aria-label={`Editar ${recurrente.nombre}`}>
            <Pencil />
          </Button>
        ) : (
          <Button variant="outline">
            <Plus />
            Nuevo pago fijo
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pt-5">
          <SheetTitle>{recurrente ? "Editar pago fijo" : "Nuevo pago fijo"}</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 px-5 pb-6">
          <div className="grid gap-1.5">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Categoría</Label>
            <select className={sel} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">—</option>
              {categorias
                .filter((c) => !c.parent_id && c.tipo === "gasto")
                .map((g) => (
                  <optgroup key={g.id} label={g.nombre}>
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
              <Label>Monto esperado</Label>
              <Input inputMode="numeric" placeholder={variable ? "Promedio automático" : "$0"} value={monto} onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Día de pago</Label>
              <Input inputMode="numeric" placeholder="1–31" value={dia} onChange={(e) => setDia(e.target.value.replace(/\D/g, "").slice(0, 2))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Frecuencia</Label>
              <select className={sel} value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as Frecuencia)}>
                {FRECUENCIAS.map((f) => (
                  <option key={f.valor} value={f.valor}>
                    {f.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Bolsa</Label>
              <select className={sel} value={bolsa} onChange={(e) => setBolsa(e.target.value as Bolsa)}>
                <option value="personal">Personal</option>
                <option value="lemon">Lemon</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={variable} onChange={(e) => setVariable(e.target.checked)} />
            El monto cambia cada mes (luz, gas, celular…). Si lo deja vacío, se usa el promedio de los últimos 3 pagos.
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Activo
          </label>
          <Button onClick={guardar} disabled={pendiente || !nombre}>
            {pendiente ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
