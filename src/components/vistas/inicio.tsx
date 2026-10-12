import Link from "next/link";
import { AlertCircle, CalendarDays, ChevronRight, Inbox } from "lucide-react";
import { Monto } from "@/components/app/monto";
import { MontoAnimado } from "@/components/app/animado";
import { BannerRecordatorios } from "@/components/app/banner-recordatorios";
import { recordatorios } from "@/lib/finance/recordatorios";
import { resumenProyecto } from "@/lib/finance/proyectos";
import { Encabezado } from "@/components/app/encabezado";
import { GraficoAcumulado } from "@/components/fin/grafico-acumulado";
import { FilaPresupuesto, Kpi, ListaProximos, Tarjeta, TarjetaLemon, TituloTarjeta, pct } from "@/components/fin/piezas";
import { nombreMes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Datos } from "@/lib/finance/modelo";
import {
  acumuladoDiario,
  comparacionMesAnterior,
  ocurrenciasDelMes,
  partesFecha,
  planDelMes,
  presupuestosDelMes,
  proximosPagos,
  sumarDias,
} from "@/lib/finance/mes";
import { deudaTotal, lemonDe, porRevisar } from "@/lib/finance/resumen";

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function saludo(hoy: string) {
  const { anio, mes, dia } = partesFecha(hoy);
  const dow = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  const nombres = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  return `${nombres[dow][0].toUpperCase()}${nombres[dow].slice(1)} ${dia} de ${nombreMes(anio, mes).split(" ")[0]}`;
}

export function VistaInicio({ datos }: { datos: Datos }) {
  const { anio, mes } = partesFecha(datos.hoy);
  const plan = planDelMes(datos, anio, mes);
  const lemon = lemonDe(datos);
  const deuda = deudaTotal(datos);
  const comp = comparacionMesAnterior(datos, anio, mes);
  const proximos = proximosPagos(datos, 7);
  const enRiesgo = presupuestosDelMes(datos, anio, mes).filter((p) => p.nivel !== "ok" || p.porEncimaDelRitmo).slice(0, 4);
  const revisar = porRevisar(datos);
  const serie = acumuladoDiario(datos, anio, mes);
  const nombreDelMes = nombreMes(anio, mes);
  const sinMonto = ocurrenciasDelMes(datos, anio, mes).filter((o) => !o.pagado && o.montoEsperado === null);
  const gastadoVariableFrac = plan.segmentos.variable + plan.segmentos.disponible > 0
    ? plan.segmentos.variable / (plan.segmentos.variable + plan.segmentos.disponible)
    : 0;

  const segmentos = [
    { nombre: "Fijos", valor: plan.segmentos.fijos, clase: "bg-[oklch(0.75_0.11_230)]" },
    { nombre: "Ahorro", valor: plan.segmentos.ahorro, clase: "bg-[oklch(0.75_0.11_185)]" },
    { nombre: "Deudas", valor: plan.segmentos.deudas, clase: "bg-[oklch(0.72_0.15_330)]" },
    { nombre: "Variable", valor: plan.segmentos.variable, clase: "bg-[oklch(0.85_0.1_270)]" },
    { nombre: "Disponible", valor: plan.segmentos.disponible, clase: "bg-white/15 ring-1 ring-inset ring-white/40" },
  ];

  const viajes = datos.proyectos
    .filter((p) => p.activo)
    .map((p) => ({ p, r: resumenProyecto(p, datos.movimientosProyectos, datos.categorias, datos.hoy) }))
    .filter((x) => x.r.estado !== "terminado");

  const semana = Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(datos.hoy, i);
    return { fecha, pagos: proximos.filter((p) => p.fecha === fecha) };
  });

  return (
    <>
      <Encabezado titulo="Hola, Miguel 👋" descripcion={`${saludo(datos.hoy)} · así va su mes`} />
      <BannerRecordatorios items={recordatorios(datos)} />

      <div className="escalonado grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="grid content-start gap-4 lg:col-span-2 lg:gap-6">
        {/* Héroe: disponible + plan del mes */}
        <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,oklch(0.33_0.13_270),oklch(0.21_0.06_270)_60%,oklch(0.17_0.03_260))] p-5 text-white shadow-lg sm:p-6">
          <div className="blob pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-[oklch(0.6_0.2_280/0.35)] blur-3xl" />
          <div className="blob-2 pointer-events-none absolute -bottom-24 left-1/4 size-56 rounded-full bg-[oklch(0.65_0.15_200/0.22)] blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1 text-sm text-white/75">
                Disponible para gastar
                <span title="Ingreso del mes − lo ya gastado − fijos que faltan por pagar. Lemon y pagos de tarjeta no cuentan." className="cursor-help">
                  <AlertCircle className="size-3.5" />
                </span>
              </p>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">{nombreDelMes[0].toUpperCase() + nombreDelMes.slice(1)}</span>
            </div>
            <MontoAnimado
              valor={plan.disponible}
              className={cn("mt-2 block text-[2.6rem] leading-none font-semibold tracking-tight sm:text-5xl", plan.disponible < 0 && "text-[oklch(0.8_0.15_25)]")}
            />
            <p className="mt-3 text-sm text-white/75">
              <Monto valor={plan.porDia} className="font-medium text-white" /> por día · {plan.diasRestantes} días restantes
            </p>

            {/* Barra del plan (de la propuesta C) */}
            <div className="animate-llenar mt-6 flex h-3 gap-0.5 overflow-hidden rounded-full">
              {segmentos.filter((s) => s.valor > 0).map((s) => (
                <div key={s.nombre} className={cn("h-full first:rounded-l-full last:rounded-r-full", s.clase)} style={{ flexGrow: s.valor }} title={s.nombre} />
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-5">
              {segmentos.map((s) => (
                <li key={s.nombre} className="text-xs">
                  <span className="flex items-center gap-1.5 text-white/70">
                    <span className={cn("size-2 rounded-sm", s.clase)} />
                    {s.nombre}
                  </span>
                  <Monto valor={s.valor} className="mt-0.5 block text-[13px] font-semibold text-white" />
                </li>
              ))}
            </ul>

            {/* Ritmo (de la propuesta A) */}
            <div className="mt-5 grid gap-1.5 border-t border-white/10 pt-4">
              <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                <div className="animate-llenar h-full rounded-full bg-[oklch(0.85_0.1_270)]" style={{ width: `${Math.min(gastadoVariableFrac, 1) * 100}%` }} />
                <div className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-white" style={{ left: `${plan.ritmo * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-white/65">
                <span>Gastado {pct(gastadoVariableFrac)} del variable</span>
                <span>Mes al {pct(plan.ritmo)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/55">
              Ingreso del plan <Monto valor={plan.ingreso} /> · fijos pendientes <Monto valor={plan.fijosPendientes} />
            </p>
          </div>
        </section>

        {/* Gasto acumulado (de la propuesta A) */}
        <Tarjeta className="hidden lg:block">
          <TituloTarjeta href="/reportes" accion="Reportes">Gasto acumulado del mes</TituloTarjeta>
          <GraficoAcumulado datos={serie} alto={160} />
        </Tarjeta>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
          <div className="col-span-2 lg:col-span-1">
            <TarjetaLemon lemon={lemon} />
          </div>
          {viajes.map(({ p, r }) => (
            <Link
              key={p.id}
              href={`/proyectos/${p.id}`}
              className="group relative col-span-2 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-fuchsia-600 to-indigo-700 p-4 text-white shadow-md lg:col-span-1"
            >
              <span className="blob pointer-events-none absolute -top-10 -right-8 size-32 rounded-full bg-white/15 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <span className="text-3xl">{p.emoji ?? "✈️"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.nombre}</p>
                  <p className="text-xs text-white/80">
                    {r.estado === "planeando" && r.diasParaEmpezar !== null ? `Faltan ${r.diasParaEmpezar} días` : r.estado === "en_curso" ? `Día ${r.diaActual} de ${r.duracion}` : "Ponga fechas y presupuesto"}
                  </p>
                </div>
                <div className="text-right">
                  <MontoAnimado valor={r.gastado} className="text-sm font-semibold" />
                  {r.presupuesto !== null && <p className="text-[11px] text-white/75">de <Monto valor={r.presupuesto} /></p>}
                </div>
              </div>
              {r.porcentaje !== null && (
                <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div className="animate-llenar h-full rounded-full bg-white" style={{ width: `${Math.min(r.porcentaje, 1) * 100}%` }} />
                </div>
              )}
            </Link>
          ))}
          <Kpi
            titulo="Gasto personal"
            valor={<MontoAnimado valor={comp.actual} />}
            tendencia={
              comp.variacion === null
                ? null
                : { texto: pct(Math.abs(comp.variacion)), bueno: comp.variacion <= 0, sube: comp.variacion > 0 }
            }
            detalle="vs. mismo día del mes pasado"
            href="/reportes"
          />
          <Kpi
            titulo="Tasa de ahorro"
            valor={pct(plan.tasaAhorroProyectada)}
            detalle="proyectada · meta 20 %"
            ayuda="(Ingreso − fijos − deudas − gasto variable proyectado) ÷ ingreso. La Cadena cuenta como ahorro."
          />
          <Kpi titulo="Deuda total" valor={<MontoAnimado valor={deuda.total} />} detalle={<>cuotas <Monto valor={deuda.cuotas} />/mes</>} href="/deudas" />
          <Link href="/movimientos?revisar=1" className="bg-card hover:border-primary/40 flex items-center gap-3 rounded-2xl border p-4 shadow-xs transition-colors">
            <span className={cn("flex size-9 items-center justify-center rounded-xl text-sm font-semibold", revisar ? "bg-primary text-primary-foreground" : "bg-positive-soft text-positive")}>
              {revisar || <Inbox className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Por revisar</p>
              <p className="text-muted-foreground truncate text-xs">{revisar ? "Confirme categoría y bolsa" : "Todo al día"}</p>
            </div>
            <ChevronRight className="text-muted-foreground size-4" />
          </Link>
        </div>

        {/* Semana y próximos pagos (de la propuesta C) */}
        <Tarjeta className="lg:col-span-2">
          <TituloTarjeta href="/recurrentes" accion="Calendario">
            <CalendarDays className="size-4" />
            Próximos 7 días
          </TituloTarjeta>
          <div className="mb-4 grid grid-cols-7 gap-1.5">
            {semana.map((d, i) => (
              <div
                key={d.fecha}
                className={cn("flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs", i === 0 ? "bg-primary text-primary-foreground" : "bg-surface")}
              >
                <span className={cn("text-[10px]", i === 0 ? "opacity-80" : "text-muted-foreground")}>
                  {DIAS_SEMANA[new Date(`${d.fecha}T12:00:00Z`).getUTCDay()]}
                </span>
                <span className="font-semibold">{Number(d.fecha.slice(8))}</span>
                <span className="flex h-1.5 gap-0.5">
                  {d.pagos.slice(0, 3).map((p) => (
                    <span key={p.id} className={cn("size-1.5 rounded-full", i === 0 ? "bg-primary-foreground" : "bg-primary")} />
                  ))}
                </span>
              </div>
            ))}
          </div>
          <ListaProximos pagos={proximos} />
        </Tarjeta>

        <div className="grid content-start gap-4">
          <Tarjeta>
            <TituloTarjeta href="/presupuestos" accion="Todos" ayuda="La marca vertical es el ritmo ideal a la fecha">
              Presupuestos en riesgo
            </TituloTarjeta>
            {enRiesgo.length ? (
              <div className="grid gap-5">
                {enRiesgo.map((p) => (
                  <FilaPresupuesto
                    key={p.categoria.id}
                    emoji={p.categoria.icono}
                    nombre={p.categoria.nombre}
                    gastado={p.gastado}
                    presupuesto={p.presupuesto}
                    ritmo={plan.ritmo}
                    proyeccion={p.proyeccion}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">Todos los presupuestos van bien ✓</p>
            )}
          </Tarjeta>
          {sinMonto.length > 0 && (
            <Link href="/recurrentes" className="border-warning/50 bg-warning-soft flex items-start gap-3 rounded-2xl border p-4">
              <AlertCircle className="text-warning mt-0.5 size-4 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{sinMonto.length === 1 ? "1 pago fijo sin monto" : `${sinMonto.length} pagos fijos sin monto`}</p>
                <p className="text-muted-foreground text-xs">{sinMonto.map((o) => o.recurrente.nombre).slice(0, 4).join(", ")}{sinMonto.length > 4 ? "…" : ""}. Complételo(s) para un disponible exacto.</p>
              </div>
            </Link>
          )}
        </div>

        <Tarjeta className="lg:hidden">
          <TituloTarjeta href="/reportes" accion="Reportes">Gasto acumulado del mes</TituloTarjeta>
          <GraficoAcumulado datos={serie} />
        </Tarjeta>
      </div>
    </>
  );
}
