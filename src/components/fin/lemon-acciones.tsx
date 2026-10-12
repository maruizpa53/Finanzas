"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileSpreadsheet, HandCoins, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Monto } from "@/components/app/monto";
import { crearCorte, editarCorte, registrarReembolso } from "@/lib/acciones/lemon";
import { formatCOP, formatFecha } from "@/lib/format";
import { cn } from "@/lib/utils";
import { nombreCuenta } from "@/lib/finance/etiquetas";
import type { CorteLemonFila, Cuenta, Movimiento } from "@/lib/finance/modelo";

/** Lista de gastos Lemon pendientes con selección para crear un corte. */
export function PendientesLemon({ gastos, cuentas, hoy }: { gastos: Movimiento[]; cuentas: Cuenta[]; hoy: string }) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set(gastos.map((g) => g.id)));
  const [fechaCorte, setFechaCorte] = useState(hoy);
  const [pendiente, iniciar] = useTransition();
  const cta = new Map(cuentas.map((c) => [c.id, c]));
  const total = gastos.filter((g) => seleccion.has(g.id)).reduce((s, g) => s + g.monto, 0);

  function alternar(id: string) {
    setSeleccion((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  if (!gastos.length) return <p className="text-muted-foreground py-6 text-center text-sm">No hay gastos de Lemon pendientes por presentar ✓</p>;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <button className="text-primary font-medium" onClick={() => setSeleccion(seleccion.size === gastos.length ? new Set() : new Set(gastos.map((g) => g.id)))}>
          {seleccion.size === gastos.length ? "Quitar todos" : "Seleccionar todos"}
        </button>
        <span className="text-muted-foreground">{seleccion.size} seleccionados</span>
      </div>
      <ul className="-mx-1 divide-y">
        {gastos.map((g) => {
          const c = cta.get(g.cuenta_id);
          return (
            <li key={g.id}>
              <label className="flex cursor-pointer items-center gap-3 px-1 py-2.5">
                <input type="checkbox" checked={seleccion.has(g.id)} onChange={() => alternar(g.id)} className="accent-[var(--color-primary)] size-4" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{g.comercio || g.descripcion}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatFecha(g.fecha)} · {c ? nombreCuenta(c) : ""}
                  </p>
                </div>
                <Monto valor={g.monto} className="text-sm font-semibold" />
              </label>
            </li>
          );
        })}
      </ul>
      <div className="bg-lemon-soft mt-4 flex flex-wrap items-end gap-3 rounded-xl p-3">
        <div className="grid gap-1">
          <Label className="text-xs">Fecha del corte</Label>
          <Input type="date" value={fechaCorte} onChange={(e) => setFechaCorte(e.target.value)} className="bg-card h-9 w-40" />
        </div>
        <div className="flex-1 text-sm">
          Total a presentar
          <Monto valor={total} className="block text-lg font-semibold" />
        </div>
        <Button
          disabled={pendiente || !seleccion.size}
          onClick={() =>
            iniciar(async () => {
              const r = await crearCorte({ ids: [...seleccion], fecha_corte: fechaCorte });
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              toast.success(r.mensaje ?? "Corte creado");
              router.refresh();
            })
          }
        >
          Crear corte
        </Button>
      </div>
    </div>
  );
}

export function AccionesCorte({ corte, cuentas, hoy }: { corte: CorteLemonFila; cuentas: Cuenta[]; hoy: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {corte.estado !== "reembolsado" && <ReembolsoCorte corte={corte} cuentas={cuentas} hoy={hoy} />}
      <Button size="sm" variant="outline" asChild>
        <a href={`/lemon/corte/${corte.id}`} download>
          <FileSpreadsheet />
          Excel
        </a>
      </Button>
      <EditarCorte corte={corte} />
    </div>
  );
}

function ReembolsoCorte({ corte, cuentas, hoy }: { corte: CorteLemonFila; cuentas: Cuenta[]; hoy: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const falta = Math.max((corte.monto_presentado ?? 0) - corte.monto_reembolsado, 0);
  const [monto, setMonto] = useState(falta ? String(falta) : "");
  const [fecha, setFecha] = useState(hoy);
  const [cuentaId, setCuentaId] = useState(cuentas.find((c) => c.tipo === "debito")?.id ?? cuentas[0]?.id ?? "");
  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        <Button size="sm">
          <HandCoins />
          Registrar pago
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="pt-5">
          <SheetTitle>Lemon pagó</SheetTitle>
          <SheetDescription>Corte del {formatFecha(corte.fecha_corte)} · falta {formatCOP(falta)}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-5 pb-6">
          <div className="grid gap-1.5">
            <Label>Monto recibido</Label>
            <Input inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Llegó a</Label>
            <select className="border-input h-10 rounded-md border bg-transparent px-3 text-sm" value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {nombreCuenta(c)}
                </option>
              ))}
            </select>
          </div>
          <p className="text-muted-foreground text-xs">Se registra como ingreso de la bolsa Lemon: no cuenta como ingreso personal.</p>
          <Button
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                const r = await registrarReembolso({ corte_id: corte.id, monto: Number(monto), fecha, cuenta_id: cuentaId });
                if (!r.ok) {
                  toast.error(r.error);
                  return;
                }
                toast.success(r.mensaje ?? "Registrado");
                setAbierto(false);
                router.refresh();
              })
            }
          >
            Guardar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EditarCorte({ corte }: { corte: CorteLemonFila }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const [fecha, setFecha] = useState(corte.fecha_corte);
  const [monto, setMonto] = useState(corte.monto_presentado !== null ? String(corte.monto_presentado) : "");
  const [estado, setEstado] = useState(corte.estado);
  const [notas, setNotas] = useState(corte.notas ?? "");
  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" aria-label="Editar corte">
          <Pencil />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="pt-5">
          <SheetTitle>Editar corte</SheetTitle>
          <SheetDescription>Útil para completar cortes antiguos, como el de junio.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 px-5 pb-6">
          <div className="grid gap-1.5">
            <Label>Fecha del corte</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Monto presentado</Label>
            <Input inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))} placeholder="Por confirmar" />
          </div>
          <div className="grid gap-1.5">
            <Label>Estado</Label>
            <select className="border-input h-10 rounded-md border bg-transparent px-3 text-sm" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}>
              <option value="presentado">Presentado (sin pagar)</option>
              <option value="reembolsado_parcial">Pagado en parte</option>
              <option value="reembolsado">Pagado completo</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>Notas</Label>
            <Input value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
          <Button
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                const r = await editarCorte({ id: corte.id, fecha_corte: fecha, monto_presentado: monto ? Number(monto) : null, estado, notas: notas || null });
                if (!r.ok) {
                  toast.error(r.error);
                  return;
                }
                toast.success("Corte actualizado");
                setAbierto(false);
                router.refresh();
              })
            }
          >
            Guardar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function EstadoCorte({ estado }: { estado: CorteLemonFila["estado"] }) {
  const m = {
    presentado: { t: "Por pagar", c: "bg-warning-soft text-warning" },
    reembolsado_parcial: { t: "Pagado en parte", c: "bg-accent text-accent-foreground" },
    reembolsado: { t: "Pagado", c: "bg-positive-soft text-positive" },
  }[estado];
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", m.c)}>{m.t}</span>;
}
