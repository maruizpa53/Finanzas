import Link from "next/link";
import { CalendarDays, ChevronRight, Pencil, Plane, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Encabezado } from "@/components/app/encabezado";
import { Monto } from "@/components/app/monto";
import { AnilloProgreso, MontoAnimado, NumeroAnimado } from "@/components/app/animado";
import { HojaFormulario, type CampoFormulario } from "@/components/fin/hoja-formulario";
import { EmojiCategoria, Kpi, Tarjeta, TituloTarjeta } from "@/components/fin/piezas";
import { formProyecto } from "@/lib/acciones/formularios";
import { formatCOP, formatFecha } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Datos, Proyecto } from "@/lib/finance/modelo";
import { resumenProyecto, type ResumenProyecto } from "@/lib/finance/proyectos";
import { nombreCuenta } from "@/lib/finance/etiquetas";

const ESTADO: Record<ResumenProyecto["estado"], string> = {
  sin_fechas: "Sin fechas",
  planeando: "Planeando",
  en_curso: "En curso",
  terminado: "Terminado",
};

function camposProyecto(p?: Proyecto): CampoFormulario[] {
  return [
    { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", inicial: p?.nombre ?? "" },
    { nombre: "emoji", etiqueta: "Emoji", tipo: "emoji", inicial: p?.emoji ?? "✈️" },
    { nombre: "presupuesto", etiqueta: "Presupuesto total (pesos)", tipo: "monto", inicial: p?.presupuesto ?? null, ayuda: "Todo lo del viaje: tiquetes, hotel, boletas, comida, compras." },
    { nombre: "fecha_inicio", etiqueta: "Desde", tipo: "fecha", inicial: p?.fecha_inicio ?? null },
    { nombre: "fecha_fin", etiqueta: "Hasta", tipo: "fecha", inicial: p?.fecha_fin ?? null },
    { nombre: "moneda", etiqueta: "Moneda del destino", tipo: "texto", inicial: p?.moneda ?? "", placeholder: "KRW, USD…" },
    {
      nombre: "tasa",
      etiqueta: "Pesos por 1 unidad de esa moneda",
      tipo: "decimal",
      inicial: p?.tasa_cambio ?? null,
      ayuda: "Ej. 1 KRW ≈ 2,95 pesos. Sirve para registrar gastos en la moneda local y ver equivalencias.",
    },
    { nombre: "notas", etiqueta: "Notas", tipo: "texto", inicial: p?.notas ?? "" },
  ];
}

export function EditorProyecto({ proyecto }: { proyecto?: Proyecto }) {
  return (
    <HojaFormulario
      titulo={proyecto ? `Editar ${proyecto.nombre}` : "Nuevo proyecto o viaje"}
      descripcion="Se crea una etiqueta con el mismo nombre para marcar sus gastos."
      disparador={
        proyecto ? (
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" /> Editar
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="size-4" /> Nuevo
          </Button>
        )
      }
      campos={camposProyecto(proyecto)}
      accion={formProyecto.bind(null, proyecto?.id ?? null)}
    />
  );
}

function rangoFechas(p: Proyecto) {
  if (!p.fecha_inicio) return "Fechas por definir";
  return p.fecha_fin && p.fecha_fin !== p.fecha_inicio ? `${formatFecha(p.fecha_inicio)} – ${formatFecha(p.fecha_fin)}` : formatFecha(p.fecha_inicio);
}

/** Lista de proyectos (viajes, remodelaciones, torneos…). */
export function VistaProyectos({ datos }: { datos: Datos }) {
  const lista = datos.proyectos.map((p) => ({ p, r: resumenProyecto(p, datos.movimientosProyectos, datos.categorias, datos.hoy) }));
  return (
    <>
      <Encabezado titulo="Viajes y proyectos" descripcion="Presupuesto, fechas y todo lo gastado con su etiqueta" acciones={<EditorProyecto />} />
      {!lista.length && (
        <Tarjeta className="text-center">
          <Plane className="text-muted-foreground mx-auto size-8" />
          <p className="mt-2 text-sm">Aún no tiene proyectos. Cree uno para seguir el gasto de un viaje.</p>
        </Tarjeta>
      )}
      <div className="escalonado grid gap-4 md:grid-cols-2">
        {lista.map(({ p, r }) => (
          <Link key={p.id} href={`/proyectos/${p.id}`} className="group">
            <TarjetaHeroProyecto proyecto={p} r={r} compacta />
          </Link>
        ))}
      </div>
    </>
  );
}

function TarjetaHeroProyecto({ proyecto: p, r, compacta = false }: { proyecto: Proyecto; r: ResumenProyecto; compacta?: boolean }) {
  const pasado = r.porcentaje !== null && r.porcentaje > 1;
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-fuchsia-600 to-indigo-700 p-5 text-white shadow-xl shadow-fuchsia-900/20 sm:p-6">
      <div className="blob pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-white/15 blur-2xl" />
      <div className="blob-2 pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-amber-300/20 blur-2xl" />
      <div className={cn("relative flex items-center gap-5", !compacta && "flex-col text-center sm:flex-row sm:text-left")}>
        <AnilloProgreso valor={r.porcentaje ?? 0} tamano={compacta ? 104 : 150} grosor={compacta ? 10 : 12} color={pasado ? "#FCA5A5" : "#FFFFFF"} pista="rgba(255,255,255,0.22)">
          <span className={cn(compacta ? "text-3xl" : "text-4xl")}>{p.emoji ?? "✈️"}</span>
          {r.porcentaje !== null && <span className="text-xs font-semibold text-white/90">{Math.round(r.porcentaje * 100)}%</span>}
        </AnilloProgreso>
        <div className="min-w-0 flex-1">
          <p className={cn("flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-white/80 uppercase", !compacta && "justify-center sm:justify-start")}>
            <span className="rounded-full bg-white/20 px-2 py-0.5">{ESTADO[r.estado]}</span>
            {r.diasParaEmpezar !== null && <span>faltan {r.diasParaEmpezar} días</span>}
            {r.estado === "en_curso" && r.diaActual && <span>día {r.diaActual} de {r.duracion}</span>}
          </p>
          <h2 className={cn("mt-1 truncate font-semibold tracking-tight", compacta ? "text-lg" : "text-2xl")}>{p.nombre}</h2>
          <p className={cn("flex items-center gap-1 text-xs text-white/80", !compacta && "justify-center sm:justify-start")}>
            <CalendarDays className="size-3.5" /> {rangoFechas(p)}
          </p>
          <p className={cn("mt-2 font-semibold tracking-tight", compacta ? "text-xl" : "text-3xl")}>
            <MontoAnimado valor={r.gastado} />
          </p>
          <p className="text-xs text-white/80">
            {r.presupuesto !== null ? (
              <>
                de {formatCOP(r.presupuesto)} · {r.restante! >= 0 ? `quedan ${formatCOP(r.restante!)}` : `pasado por ${formatCOP(-r.restante!)}`}
              </>
            ) : (
              "Sin presupuesto: póngale uno"
            )}
          </p>
        </div>
        {compacta && <ChevronRight className="size-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-1" />}
      </div>
    </section>
  );
}

/** Detalle de un proyecto (estilo TravelSpend). */
export function VistaProyecto({ datos, proyecto: p }: { datos: Datos; proyecto: Proyecto }) {
  const r = resumenProyecto(p, datos.movimientosProyectos, datos.categorias, datos.hoy);
  const catPorId = new Map(datos.categorias.map((c) => [c.id, c]));
  const cuentaPorId = new Map(datos.cuentas.map((c) => [c.id, c]));
  const max = Math.max(...r.porCategoria.map((c) => c.total), 1);
  const moneda = p.moneda && p.moneda !== "COP" ? p.moneda : null;

  return (
    <>
      <Encabezado
        titulo={`${p.emoji ?? ""} ${p.nombre}`}
        descripcion={rangoFechas(p)}
        acciones={
          <div className="flex gap-2">
            <EditorProyecto proyecto={p} />
            <Button size="sm" asChild>
              <Link href={`/movimientos/nuevo?proyecto=${p.id}`}>
                <Plus className="size-4" /> Gasto
              </Link>
            </Button>
          </div>
        }
      />

      <div className="escalonado grid gap-6">
        <TarjetaHeroProyecto proyecto={p} r={r} />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi titulo="Gastado" valor={<MontoAnimado valor={r.gastado} />} detalle={`${r.movimientos.length} movimientos`} />
          <Kpi
            titulo={r.estado === "en_curso" ? "Puede gastar por día" : "Disponible por día del viaje"}
            valor={r.porDiaDisponible !== null ? <MontoAnimado valor={r.porDiaDisponible} /> : "—"}
            detalle={r.duracion ? `${r.duracion} días de viaje` : "Ponga fechas y presupuesto"}
          />
          <Kpi
            titulo="Promedio diario"
            valor={r.promedioDiario !== null ? <MontoAnimado valor={r.promedioDiario} /> : "—"}
            detalle={r.promedioDiario !== null ? "durante el viaje" : "se calcula cuando empiece"}
          />
          <Kpi
            titulo={moneda ? `En ${moneda}` : "Cuenta regresiva"}
            valor={
              moneda && r.gastadoMonedaLocal !== null ? (
                <NumeroAnimado valor={r.gastadoMonedaLocal} sufijo={` ${moneda}`} />
              ) : r.diasParaEmpezar !== null ? (
                <NumeroAnimado valor={r.diasParaEmpezar} sufijo=" días" />
              ) : (
                "—"
              )
            }
            detalle={moneda ? (p.tasa_cambio ? `1 ${moneda} ≈ ${p.tasa_cambio.toLocaleString("es-CO")} pesos` : "Falta la tasa de cambio") : undefined}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Tarjeta className="lg:col-span-2 lg:self-start">
            <TituloTarjeta>Por categoría</TituloTarjeta>
            {!r.porCategoria.length && <p className="text-muted-foreground py-4 text-center text-sm">Marque gastos con {p.emoji} para verlos aquí.</p>}
            <ul className="grid gap-3">
              {r.porCategoria.map((c) => (
                <li key={c.categoriaId ?? "sin"}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">
                      {c.icono ?? "📌"} {c.nombre}
                    </span>
                    <Monto valor={c.total} className="font-semibold" />
                  </div>
                  <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                    <div className="animate-llenar h-full rounded-full bg-gradient-to-r from-rose-500 to-indigo-600" style={{ width: `${(c.total / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta className="lg:col-span-3">
            <TituloTarjeta>Gastos del viaje</TituloTarjeta>
            {!r.movimientos.length && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Al registrar un gasto, active “Gasto de {p.nombre}”. También puede etiquetar movimientos existentes.
              </p>
            )}
            <ul className="-mx-1 divide-y">
              {r.movimientos.map((m) => {
                const cat = m.categoria_id ? catPorId.get(m.categoria_id) : undefined;
                const cuenta = cuentaPorId.get(m.cuenta_id);
                return (
                  <li key={m.id} className="flex items-center gap-3 px-1 py-2.5">
                    <EmojiCategoria emoji={cat?.icono} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.comercio || m.descripcion}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {formatFecha(m.fecha)} · {cuenta ? nombreCuenta(cuenta) : ""}
                        {m.moneda_original && m.monto_original ? ` · ${m.monto_original.toLocaleString("es-CO")} ${m.moneda_original}` : ""}
                      </p>
                    </div>
                    <Monto valor={m.tipo === "ingreso" ? m.monto : -m.monto} signo className={cn("text-sm font-semibold", m.tipo === "ingreso" && "text-positive")} />
                  </li>
                );
              })}
            </ul>
          </Tarjeta>
        </div>
        {p.notas && (
          <Tarjeta>
            <TituloTarjeta>Notas</TituloTarjeta>
            <p className="text-sm whitespace-pre-line">{p.notas}</p>
          </Tarjeta>
        )}
      </div>
    </>
  );
}
