"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, CheckCheck, CreditCard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Monto } from "@/components/app/monto";
import { ChipBolsa, EmojiCategoria } from "@/components/fin/piezas";
import { BENEFICIARIOS, nombreCuenta } from "@/lib/finance/etiquetas";
import { actualizarMovimiento, eliminarMovimiento, marcarRevisados } from "@/lib/acciones/movimientos";
import { formatFecha } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Beneficiario, Bolsa, Categoria, Cuenta, Movimiento, TipoMovimiento } from "@/lib/finance/modelo";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function tituloDia(fecha: string, hoy: string) {
  if (fecha === hoy) return "Hoy";
  const d = new Date(`${fecha}T12:00:00Z`);
  return `${DIAS[d.getUTCDay()][0].toUpperCase()}${DIAS[d.getUTCDay()].slice(1)} ${formatFecha(fecha)}`;
}

export function ListaMovimientos({
  movimientos,
  cuentas,
  categorias,
  hoy,
  modoRevision = false,
}: {
  movimientos: Movimiento[];
  cuentas: Cuenta[];
  categorias: Categoria[];
  hoy: string;
  modoRevision?: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<Movimiento | null>(null);
  const [pendiente, iniciar] = useTransition();
  const cat = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const cta = useMemo(() => new Map(cuentas.map((c) => [c.id, c])), [cuentas]);

  const grupos = useMemo(() => {
    const m = new Map<string, Movimiento[]>();
    for (const mv of movimientos) m.set(mv.fecha, [...(m.get(mv.fecha) ?? []), mv]);
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [movimientos]);

  if (!movimientos.length)
    return <p className="text-muted-foreground py-12 text-center text-sm">{modoRevision ? "No hay movimientos por revisar ✓" : "No hay movimientos con estos filtros."}</p>;

  return (
    <>
      {modoRevision && (
        <Button
          variant="outline"
          className="mb-4"
          disabled={pendiente}
          onClick={() =>
            iniciar(async () => {
              const r = await marcarRevisados(movimientos.map((m) => m.id));
              toast[r.ok ? "success" : "error"](r.ok ? (r.mensaje ?? "Listo") : r.error);
              router.refresh();
            })
          }
        >
          <CheckCheck />
          Marcar todos como revisados
        </Button>
      )}
      <div className="grid gap-5">
        {grupos.map(([fecha, movs]) => {
          const totalGasto = movs.filter((m) => m.tipo === "gasto" && m.bolsa !== "lemon").reduce((s, m) => s + m.monto, 0);
          return (
            <section key={fecha}>
              <div className="text-muted-foreground mb-1.5 flex items-center justify-between px-1 text-xs font-medium">
                <span>{tituloDia(fecha, hoy)}</span>
                {totalGasto > 0 && <Monto valor={-totalGasto} />}
              </div>
              <ul className="bg-card divide-y overflow-hidden rounded-2xl border shadow-xs">
                {movs.map((m) => {
                  const c = m.categoria_id ? cat.get(m.categoria_id) : undefined;
                  const cuenta = cta.get(m.cuenta_id);
                  const destino = m.cuenta_destino_id ? cta.get(m.cuenta_destino_id) : undefined;
                  const entre = m.tipo === "transferencia" || m.tipo === "pago_tarjeta";
                  return (
                    <li key={m.id}>
                      <button type="button" onClick={() => setEditando(m)} className="hover:bg-accent/50 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors">
                        {entre ? (
                          <span className="bg-surface flex size-9 shrink-0 items-center justify-center rounded-xl">
                            {m.tipo === "pago_tarjeta" ? <CreditCard className="size-4" /> : <ArrowLeftRight className="size-4" />}
                          </span>
                        ) : (
                          <EmojiCategoria emoji={c?.icono} />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                            <span className="truncate">{m.comercio || m.descripcion}</span>
                            {!m.revisado && <span className="bg-primary size-1.5 shrink-0 rounded-full" title="Por revisar" />}
                          </p>
                          <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
                            <span className="truncate">
                              {entre
                                ? `${cuenta?.nombre ?? ""} → ${destino?.nombre ?? ""}`
                                : `${c?.nombre ?? "Sin categoría"} · ${cuenta ? nombreCuenta(cuenta) : ""}`}
                            </span>
                            <ChipBolsa bolsa={m.bolsa} />
                            {m.bolsa === "lemon" && m.reembolso_estado && m.reembolso_estado !== "pendiente" && (
                              <span className="text-[10px]">{m.reembolso_estado === "presentado" ? "· presentado" : "· reembolsado"}</span>
                            )}
                          </p>
                        </div>
                        <Monto
                          valor={m.tipo === "gasto" ? -m.monto : m.monto}
                          signo={m.tipo === "ingreso"}
                          className={cn("text-sm font-semibold", m.tipo === "ingreso" && "text-positive", entre && "text-muted-foreground")}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <Sheet open={Boolean(editando)} onOpenChange={(o) => !o && setEditando(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {editando && (
            <EditorMovimiento
              key={editando.id}
              mov={editando}
              cuentas={cuentas}
              categorias={categorias}
              alTerminar={() => {
                setEditando(null);
                router.refresh();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function EditorMovimiento({
  mov,
  cuentas,
  categorias,
  alTerminar,
}: {
  mov: Movimiento;
  cuentas: Cuenta[];
  categorias: Categoria[];
  alTerminar: () => void;
}) {
  const [pendiente, iniciar] = useTransition();
  const [tipo, setTipo] = useState<TipoMovimiento>(mov.tipo);
  const [monto, setMonto] = useState(String(mov.monto));
  const [fecha, setFecha] = useState(mov.fecha);
  const [cuentaId, setCuentaId] = useState(mov.cuenta_id);
  const [destinoId, setDestinoId] = useState(mov.cuenta_destino_id ?? "");
  const [categoriaId, setCategoriaId] = useState(mov.categoria_id ?? "");
  const [bolsa, setBolsa] = useState<Bolsa>(mov.bolsa);
  const [beneficiario, setBeneficiario] = useState<string>(mov.beneficiario ?? "");
  const [descripcion, setDescripcion] = useState(mov.descripcion);
  const [comercio, setComercio] = useState(mov.comercio ?? "");
  const [notas, setNotas] = useState(mov.notas ?? "");
  const [crearRegla, setCrearRegla] = useState(false);
  const entre = tipo === "transferencia" || tipo === "pago_tarjeta";
  const cambioCategoria = categoriaId !== (mov.categoria_id ?? "") || bolsa !== mov.bolsa;
  const patron = (comercio || descripcion).trim();
  const grupos = categorias.filter((c) => !c.parent_id);

  function guardar() {
    iniciar(async () => {
      const r = await actualizarMovimiento(
        mov.id,
        {
          monto: Number(monto.replace(/\D/g, "")),
          tipo,
          fecha,
          cuenta_id: cuentaId,
          cuenta_destino_id: entre ? destinoId || null : null,
          categoria_id: entre ? null : categoriaId || null,
          bolsa,
          beneficiario: (beneficiario || null) as Beneficiario | null,
          descripcion,
          comercio: comercio || null,
          notas: notas || null,
        },
        crearRegla && cambioCategoria && patron ? { patron } : null,
      );
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(r.mensaje ?? "Actualizado");
      alTerminar();
    });
  }

  function eliminar() {
    if (!confirm("¿Eliminar este movimiento? No se puede deshacer.")) return;
    iniciar(async () => {
      const r = await eliminarMovimiento(mov.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Eliminado");
      alTerminar();
    });
  }

  const sel = "border-input h-10 w-full rounded-md border bg-transparent px-3 text-sm";

  return (
    <>
      <SheetHeader className="pt-5">
        <SheetTitle>Editar movimiento</SheetTitle>
        <SheetDescription>
          {mov.origen === "importacion" ? "Importado" : mov.origen === "chat" ? "Registrado por chat" : "Registrado a mano"} · {formatFecha(mov.fecha)}
        </SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 px-5 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Monto">
            <Input inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))} />
          </Campo>
          <Campo etiqueta="Fecha">
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Campo>
        </div>
        <Campo etiqueta="Tipo">
          <select className={sel} value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimiento)}>
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
            <option value="transferencia">Transferencia</option>
            <option value="pago_tarjeta">Pago de tarjeta</option>
          </select>
        </Campo>
        <Campo etiqueta={entre ? "Sale de" : "Cuenta"}>
          <select className={sel} value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {nombreCuenta(c)}
              </option>
            ))}
          </select>
        </Campo>
        {entre ? (
          <Campo etiqueta="Llega a">
            <select className={sel} value={destinoId} onChange={(e) => setDestinoId(e.target.value)}>
              <option value="">—</option>
              {cuentas
                .filter((c) => c.id !== cuentaId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {nombreCuenta(c)}
                  </option>
                ))}
            </select>
          </Campo>
        ) : (
          <>
            <Campo etiqueta="Categoría">
              <select
                className={sel}
                value={categoriaId}
                onChange={(e) => {
                  setCategoriaId(e.target.value);
                  const c = categorias.find((x) => x.id === e.target.value);
                  if (c?.bolsa_default) setBolsa(c.bolsa_default);
                }}
              >
                <option value="">Sin categoría</option>
                {grupos.map((g) => (
                  <optgroup key={g.id} label={`${g.icono ?? ""} ${g.nombre}`}>
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
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Bolsa">
                <select className={sel} value={bolsa} onChange={(e) => setBolsa(e.target.value as Bolsa)}>
                  <option value="personal">Personal</option>
                  <option value="lemon">Lemon</option>
                  <option value="freelance">Freelance</option>
                </select>
              </Campo>
              <Campo etiqueta="Para">
                <select className={sel} value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)}>
                  <option value="">—</option>
                  {BENEFICIARIOS.map((b) => (
                    <option key={b.valor} value={b.valor}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
          </>
        )}
        <Campo etiqueta="Descripción">
          <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </Campo>
        <Campo etiqueta="Comercio">
          <Input value={comercio} onChange={(e) => setComercio(e.target.value)} placeholder="Opcional" />
        </Campo>
        <Campo etiqueta="Notas">
          <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional" />
        </Campo>
        {!entre && cambioCategoria && patron && (
          <label className="bg-accent text-accent-foreground flex items-start gap-2 rounded-xl p-3 text-sm">
            <input type="checkbox" checked={crearRegla} onChange={(e) => setCrearRegla(e.target.checked)} className="mt-0.5" />
            <span>
              Crear regla: todo lo que contenga <strong>“{patron}”</strong> irá a esta categoría y bolsa, y se aplicará a los movimientos similares por revisar.
            </span>
          </label>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={eliminar} disabled={pendiente} aria-label="Eliminar">
            <Trash2 />
          </Button>
          <Button className="flex-1" onClick={guardar} disabled={pendiente}>
            {pendiente ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-muted-foreground text-xs">{etiqueta}</Label>
      {children}
    </div>
  );
}
