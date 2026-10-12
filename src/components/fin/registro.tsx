"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/format";
import { crearMovimiento, eliminarMovimiento } from "@/lib/acciones/movimientos";
import { crearIngresoRepartido, eliminarGrupo } from "@/lib/acciones/reparto";
import type { Ahorro, Beneficiario, Bolsa, Categoria, Cuenta, Deuda, Etiqueta, Proyecto, TipoMovimiento } from "@/lib/finance/modelo";
import type { LineaReparto } from "@/lib/finance/reparto";
import { EditorReparto, SelectorEtiquetas, ToggleProyecto } from "./registro-extras";
import { BENEFICIARIOS, nombreCuenta } from "@/lib/finance/etiquetas";

export interface PrefillRegistro {
  monto?: number;
  categoriaId?: string;
  descripcion?: string;
  recurrenteId?: string;
  tipo?: TipoMovimiento;
  bolsa?: Bolsa;
  proyectoId?: string;
}

const TIPOS: { valor: TipoMovimiento; nombre: string }[] = [
  { valor: "gasto", nombre: "Gasto" },
  { valor: "ingreso", nombre: "Ingreso" },
  { valor: "transferencia", nombre: "Transferir" },
  { valor: "pago_tarjeta", nombre: "Pagar tarjeta" },
];

const BOLSAS: { valor: Bolsa; nombre: string; clase: string }[] = [
  { valor: "personal", nombre: "Personal", clase: "data-[on=true]:bg-primary data-[on=true]:text-primary-foreground" },
  { valor: "lemon", nombre: "🍋 Lemon", clase: "data-[on=true]:bg-lemon data-[on=true]:text-black" },
  { valor: "freelance", nombre: "Freelance", clase: "data-[on=true]:bg-freelance data-[on=true]:text-white" },
];

export function RegistroRapido({
  cuentas,
  categorias,
  frecuentes,
  cuentaDefault,
  bolsaDefault,
  hoy,
  prefill,
  etiquetas = [],
  proyectos = [],
  deudas = [],
  ahorros = [],
  tagsDefault = [],
  reparto = [],
}: {
  cuentas: Cuenta[];
  categorias: Categoria[];
  frecuentes: string[];
  cuentaDefault: string | null;
  bolsaDefault: Bolsa;
  hoy: string;
  prefill?: PrefillRegistro;
  etiquetas?: Etiqueta[];
  proyectos?: Proyecto[];
  deudas?: Deuda[];
  ahorros?: Ahorro[];
  tagsDefault?: string[];
  reparto?: LineaReparto[];
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const activas = cuentas.filter((c) => c.activa);
  const [tipo, setTipo] = useState<TipoMovimiento>(prefill?.tipo ?? "gasto");
  const [digitos, setDigitos] = useState(prefill?.monto ? String(prefill.monto) : "");
  const [categoriaId, setCategoriaId] = useState<string | null>(prefill?.categoriaId ?? null);
  const [cuentaId, setCuentaId] = useState<string>(cuentaDefault ?? activas[0]?.id ?? "");
  const [destinoId, setDestinoId] = useState<string>("");
  const [bolsa, setBolsa] = useState<Bolsa>(prefill?.bolsa ?? bolsaDefault);
  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [fecha, setFecha] = useState(hoy);
  const [descripcion, setDescripcion] = useState(prefill?.descripcion ?? "");
  const [notas, setNotas] = useState("");
  const [verTodas, setVerTodas] = useState(false);
  const [verDetalles, setVerDetalles] = useState(false);
  const proyectosActivos = proyectos.filter((p) => p.activo && p.tag_id);
  const tagsProyecto = new Set(proyectosActivos.map((p) => p.tag_id));
  const etiquetasLibres = etiquetas.filter((e) => e.activa && !tagsProyecto.has(e.id));
  const [tags, setTags] = useState<string[]>(tagsDefault.filter((t) => etiquetasLibres.some((e) => e.id === t)));
  const [proyectoId, setProyectoId] = useState<string | null>(prefill?.proyectoId ?? null);
  const [montoExt, setMontoExt] = useState("");
  const [lineas, setLineas] = useState<LineaReparto[]>(reparto);
  const [verReparto, setVerReparto] = useState(false);
  const [recordar, setRecordar] = useState(true);

  const monto = Number(digitos || 0);
  const entreCuentas = tipo === "transferencia" || tipo === "pago_tarjeta";
  const porId = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const tipoCat = tipo === "ingreso" ? "ingreso" : "gasto";
  const disponibles = categorias.filter((c) => c.parent_id && c.activa && c.tipo === tipoCat);
  const rapidas = [
    ...frecuentes.map((id) => porId.get(id)).filter((c): c is Categoria => Boolean(c && c.tipo === tipoCat && c.activa)),
    ...disponibles,
  ]
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
    .slice(0, 8);
  const grupos = categorias.filter((c) => !c.parent_id && c.tipo === tipoCat);
  const destinos = activas.filter((c) => c.id !== cuentaId && (tipo === "pago_tarjeta" ? c.tipo === "credito" : true));

  function elegirCategoria(c: Categoria) {
    setCategoriaId(c.id);
    if (c.bolsa_default) setBolsa(c.bolsa_default);
    setBeneficiario(c.beneficiario_default);
  }

  function tecla(t: string) {
    if (t === "⌫") return setDigitos((d) => d.slice(0, -1));
    setDigitos((d) => (d + t).replace(/^0+/, "").slice(0, 12));
  }

  const proyecto = proyectosActivos.find((p) => p.id === proyectoId);
  const repartiendo = tipo === "ingreso" && verReparto && lineas.some((l) => l.valor > 0);

  function deshacer(id: string | undefined, grupo: boolean) {
    if (!id) return undefined;
    return {
      label: "Deshacer",
      onClick: async () => {
        const d = grupo ? await eliminarGrupo(id) : await eliminarMovimiento(id);
        toast(d.ok ? (d.mensaje ?? "Eliminado") : d.error);
      },
    };
  }

  function guardar() {
    if (!monto) return toast.error("Escriba el monto");
    if (!entreCuentas && !categoriaId) return toast.error("Elija una categoría");
    if (entreCuentas && !destinoId) return toast.error("Elija la cuenta de destino");
    iniciar(async () => {
      if (repartiendo && categoriaId) {
        const r = await crearIngresoRepartido({
          monto,
          fecha,
          cuenta_id: cuentaId,
          categoria_id: categoriaId,
          bolsa,
          descripcion: descripcion || undefined,
          notas: notas || null,
          lineas: lineas.filter((l) => l.valor > 0),
          guardar_plantilla: recordar,
        });
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success(`${r.mensaje} · ${formatCOP(monto)}`, { action: deshacer(r.id, true), duration: 8000 });
        router.push("/");
        router.refresh();
        return;
      }
      const ext = Number(montoExt) || 0;
      const r = await crearMovimiento({
        etiquetas: entreCuentas ? [] : [...tags, ...(proyecto?.tag_id ? [proyecto.tag_id] : [])],
        moneda_original: proyecto?.moneda && proyecto.moneda !== "COP" && ext ? proyecto.moneda : null,
        monto_original: proyecto?.moneda && proyecto.moneda !== "COP" && ext ? ext : null,
        monto,
        tipo,
        fecha,
        cuenta_id: cuentaId,
        cuenta_destino_id: entreCuentas ? destinoId : null,
        categoria_id: entreCuentas ? null : categoriaId,
        bolsa,
        beneficiario,
        descripcion: descripcion || undefined,
        notas: notas || null,
        recurring_item_id: prefill?.recurrenteId ?? null,
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`${r.mensaje ?? "Guardado"}${proyecto ? ` en ${proyecto.emoji ?? ""} ${proyecto.nombre}` : ""} · ${formatCOP(monto)}`, {
        action: deshacer(r.id, false),
        duration: 8000,
      });
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-xl min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      {/* Tipo */}
      <div className="bg-muted grid grid-cols-4 gap-1 rounded-xl p-1">
        {TIPOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => {
              setTipo(t.valor);
              setCategoriaId(null);
              if (t.valor !== "gasto") setBolsa("personal");
            }}
            className={cn(
              "rounded-lg py-2 text-xs font-medium transition-colors sm:text-sm",
              tipo === t.valor ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      {/* Monto */}
      <div className="text-center">
        <label htmlFor="monto" className="text-muted-foreground text-xs">
          Monto
        </label>
        <input
          id="monto"
          inputMode="numeric"
          autoComplete="off"
          value={monto ? formatCOP(monto) : ""}
          placeholder="$0"
          onChange={(e) => setDigitos(e.target.value.replace(/\D/g, "").slice(0, 12))}
          className={cn(
            "placeholder:text-muted-foreground/50 w-full bg-transparent text-center text-5xl font-semibold tracking-tight tabular outline-none",
            tipo === "ingreso" && "text-positive",
          )}
        />
        <div className="mt-2 flex justify-center gap-2">
          {[10_000, 20_000, 50_000, 100_000].map((v) => (
            <button key={v} type="button" onClick={() => setDigitos(String(monto + v))} className="bg-surface rounded-full px-3 py-1 text-xs font-medium">
              +{v / 1000} mil
            </button>
          ))}
        </div>
      </div>

      {/* Teclado (móvil) */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "⌫"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => tecla(t)}
            className="bg-surface active:bg-accent flex h-12 items-center justify-center rounded-xl text-xl font-medium"
            aria-label={t === "⌫" ? "Borrar" : t}
          >
            {t === "⌫" ? <Delete className="size-5" /> : t}
          </button>
        ))}
      </div>

      {/* Categoría */}
      {!entreCuentas && (
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium">Categoría</p>
          <div className="grid grid-cols-4 gap-2">
            {rapidas.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => elegirCategoria(c)}
                className={cn(
                  "bg-surface flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-center text-[11px] leading-tight font-medium",
                  categoriaId === c.id && "ring-primary bg-accent ring-2",
                )}
              >
                <span className="text-xl">{c.icono}</span>
                <span className="line-clamp-2">{c.nombre}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setVerTodas((v) => !v)} className="text-primary mt-2 flex items-center gap-1 text-xs font-medium">
            {verTodas ? "Menos" : "Todas las categorías"}
            <ChevronDown className={cn("size-3.5 transition-transform", verTodas && "rotate-180")} />
          </button>
          {verTodas && (
            <div className="mt-2 grid gap-3">
              {grupos.map((g) => (
                <div key={g.id}>
                  <p className="text-muted-foreground mb-1 text-xs">
                    {g.icono} {g.nombre}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {disponibles
                      .filter((c) => c.parent_id === g.id)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => elegirCategoria(c)}
                          className={cn("bg-surface rounded-full px-3 py-1.5 text-xs", categoriaId === c.id && "bg-primary text-primary-foreground")}
                        >
                          {c.icono} {c.nombre}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cuenta */}
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-medium">{entreCuentas ? "Sale de" : tipo === "ingreso" ? "Entra a" : "Pagado con"}</p>
        <Chips opciones={activas.map((c) => ({ valor: c.id, nombre: nombreCuenta(c) }))} valor={cuentaId} onChange={setCuentaId} />
      </div>
      {entreCuentas && (
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium">{tipo === "pago_tarjeta" ? "Tarjeta que paga" : "Llega a"}</p>
          <Chips opciones={destinos.map((c) => ({ valor: c.id, nombre: nombreCuenta(c) }))} valor={destinoId} onChange={setDestinoId} />
          {tipo === "pago_tarjeta" && (
            <p className="text-muted-foreground mt-2 text-xs">Pagar la tarjeta no es un gasto nuevo: solo mueve plata entre sus cuentas.</p>
          )}
        </div>
      )}

      {/* Bolsa */}
      {!entreCuentas && (
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium">Bolsa</p>
          <div className="flex gap-2">
            {BOLSAS.map((b) => (
              <button
                key={b.valor}
                type="button"
                data-on={bolsa === b.valor}
                onClick={() => setBolsa(b.valor)}
                className={cn("bg-surface flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors", b.clase)}
              >
                {b.nombre}
              </button>
            ))}
          </div>
          {bolsa === "lemon" && <p className="text-lemon-foreground mt-2 text-xs">Este gasto no cuenta como personal: suma a “Lemon me debe”.</p>}
        </div>
      )}

      {/* Viaje / proyecto */}
      {tipo === "gasto" &&
        proyectosActivos.map((p) => (
          <ToggleProyecto
            key={p.id}
            proyecto={p}
            activo={proyectoId === p.id}
            onToggle={() => setProyectoId((x) => (x === p.id ? null : p.id))}
            montoExtranjero={montoExt}
            onMontoExtranjero={setMontoExt}
            onCalcularPesos={(v) => setDigitos(String(v))}
          />
        ))}

      {/* Etiquetas */}
      {!entreCuentas && <SelectorEtiquetas etiquetas={etiquetasLibres} valor={tags} onChange={setTags} />}

      {/* Reparto del ingreso */}
      {tipo === "ingreso" &&
        (verReparto ? (
          <EditorReparto
            ingreso={monto}
            cuentaOrigen={activas.find((c) => c.id === cuentaId)}
            lineas={lineas}
            onChange={setLineas}
            cuentas={cuentas}
            deudas={deudas}
            ahorros={ahorros}
            recordar={recordar}
            onRecordar={setRecordar}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setVerReparto(true);
              if (!lineas.length) setLineas([{ destino: "cuenta", id: null, modo: "monto", valor: 0 }]);
            }}
            className="bg-positive-soft text-positive flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium"
          >
            <span>
              🧩 Repartir este ingreso
              <span className="block text-xs font-normal opacity-80">
                {reparto.length ? `Usar su reparto guardado (${reparto.length} partes)` : "Mandar partes a Nequi, a una deuda, al ahorro o prestar"}
              </span>
            </span>
            <ChevronDown className="size-4 -rotate-90" />
          </button>
        ))}

      {/* Detalles */}
      <button type="button" onClick={() => setVerDetalles((v) => !v)} className="text-primary flex items-center gap-1 text-xs font-medium">
        Fecha, descripción y más
        <ChevronDown className={cn("size-3.5 transition-transform", verDetalles && "rotate-180")} />
      </button>
      {verDetalles && (
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} />
            </div>
            {!entreCuentas && (
              <div className="grid gap-1.5">
                <Label htmlFor="beneficiario">Para</Label>
                <select
                  id="beneficiario"
                  value={beneficiario ?? ""}
                  onChange={(e) => setBeneficiario((e.target.value || null) as Beneficiario | null)}
                  className="border-input h-10 rounded-md border bg-transparent px-3 text-sm"
                >
                  <option value="">—</option>
                  {BENEFICIARIOS.map((b) => (
                    <option key={b.valor} value={b.valor}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="descripcion">Descripción o comercio</Label>
            <Input id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder={categoriaId ? porId.get(categoriaId)?.nombre : "Opcional"} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notas">Notas</Label>
            <Input id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional" />
          </div>
        </div>
      )}

      <Button size="lg" className="h-12 text-base" onClick={guardar} disabled={pendiente}>
        {pendiente ? "Guardando…" : repartiendo ? `Guardar y repartir ${formatCOP(monto)}` : `Guardar ${monto ? formatCOP(monto) : ""}`}
      </Button>
    </div>
  );
}

export function Chips({
  opciones,
  valor,
  onChange,
}: {
  opciones: { valor: string; nombre: string }[];
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onChange(o.valor)}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-2 text-sm whitespace-nowrap transition-colors",
            valor === o.valor ? "border-primary bg-primary text-primary-foreground" : "bg-card",
          )}
        >
          {o.nombre}
        </button>
      ))}
    </div>
  );
}
