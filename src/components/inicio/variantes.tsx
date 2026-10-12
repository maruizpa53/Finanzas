import { CalendarDays } from "lucide-react";
import { Monto } from "@/components/app/monto";
import { formatFecha, nombreMes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ResumenInicio } from "./datos-ejemplo";
import { GraficoAcumulado } from "./grafico-acumulado";
import {
  BarraPresupuesto,
  Kpi,
  ListaProximos,
  PorRevisar,
  Tarjeta,
  TarjetaLemon,
  TituloTarjeta,
} from "./piezas";

const pct = (n: number) => `${Math.round(n * 100)} %`;
const ancho = (n: number) => `${Math.min(Math.max(n, 0), 1) * 100}%`;

function variacion(d: ResumenInicio) {
  const v = d.gastoPersonal / d.gastoPersonalMesAnterior - 1;
  return { texto: `${Math.abs(Math.round(v * 100))} %`, bueno: v <= 0, sube: v > 0 };
}

// ---------------------------------------------------------------------------
// A · Claridad (inspirada en Copilot Money)
// ---------------------------------------------------------------------------
export function InicioA({ d }: { d: ResumenInicio }) {
  const ritmo = d.diaDelMes / d.diasDelMes;
  const gastadoDelPlan = d.plan.gastadoVariable / (d.plan.gastadoVariable + d.disponible);
  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      <Tarjeta className="lg:col-span-2">
        <p className="text-muted-foreground text-sm">Disponible para gastar en {nombreMes(2026, 10).split(" ")[0]}</p>
        <Monto valor={d.disponible} className="mt-1 block text-[2.75rem] leading-none font-semibold tracking-tight" />
        <p className="text-muted-foreground mt-2 text-sm">
          ≈ <Monto valor={d.porDia} className="text-foreground font-medium" /> por día · {d.diasRestantes} días
          restantes
        </p>
        <div className="mt-5 grid gap-2">
          <div className="bg-muted relative h-2.5 overflow-hidden rounded-full">
            <div className="bg-primary h-full rounded-full" style={{ width: ancho(gastadoDelPlan) }} />
            <div
              className="bg-foreground/70 absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full"
              style={{ left: ancho(ritmo) }}
            />
          </div>
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>Gastado {pct(gastadoDelPlan)} del variable</span>
            <span>Mes al {pct(ritmo)}</span>
          </div>
        </div>
        <div className="mt-5 border-t pt-4">
          <GraficoAcumulado datos={d.acumulado} alto={150} />
        </div>
      </Tarjeta>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
        <TarjetaLemon lemon={d.lemon} destacada />
        <Kpi
          titulo="Gasto personal"
          valor={<Monto valor={d.gastoPersonal} />}
          tendencia={variacion(d)}
          detalle="vs. mes pasado"
        />
        <Kpi titulo="Tasa de ahorro" valor={pct(d.tasaAhorroProyectada)} detalle="proyectada · meta 20 %" />
        <Kpi titulo="Deuda total" valor={<Monto valor={d.deudaTotal} />} detalle="3 acreedores" />
      </div>

      <div className="lg:col-span-3">
        <PorRevisar n={d.porRevisar} />
      </div>

      <Tarjeta className="lg:col-span-2">
        <TituloTarjeta accion="Calendario">Próximos 7 días</TituloTarjeta>
        <ListaProximos pagos={d.proximos} />
      </Tarjeta>
      <Tarjeta>
        <TituloTarjeta accion="Todos" ayuda="La marca vertical es el ritmo ideal a la fecha">
          Presupuestos en riesgo
        </TituloTarjeta>
        <div className="grid gap-5">
          {d.enRiesgo.map((p) => (
            <BarraPresupuesto key={p.nombre} item={p} ritmoIdeal={ritmo} />
          ))}
        </div>
      </Tarjeta>
    </div>
  );
}

// ---------------------------------------------------------------------------
// B · Premium (inspirada en Mercury)
// ---------------------------------------------------------------------------
export function InicioB({ d }: { d: ResumenInicio }) {
  const ritmo = d.diaDelMes / d.diasDelMes;
  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,oklch(0.32_0.12_270),oklch(0.2_0.05_270)_60%,oklch(0.17_0.03_260))] p-6 text-white shadow-lg lg:col-span-2 lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-[oklch(0.6_0.2_280/0.35)] blur-3xl" />
        <div className="relative lg:flex lg:flex-1 lg:flex-col">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/70">Disponible para gastar</p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">Octubre</span>
          </div>
          <Monto valor={d.disponible} className="mt-2 block text-5xl leading-none font-semibold tracking-tight" />
          <p className="mt-3 text-sm text-white/70">
            <Monto valor={d.porDia} className="font-medium text-white" /> por día · {d.diasRestantes} días restantes
          </p>
          <div className="mt-6 -mx-2 lg:mt-auto">
            <GraficoAcumulado datos={d.acumulado} alto={110} compacto sobreOscuro />
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-[oklch(0.85_0.1_270)]" />
              Gasto acumulado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-white/40" />
              Mes anterior
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-3 lg:gap-4">
        <TarjetaLemon lemon={d.lemon} destacada />
        <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:overflow-visible lg:px-0">
          <Kpi
            className="min-w-[160px] snap-start"
            titulo="Gasto personal"
            valor={<Monto valor={d.gastoPersonal} />}
            tendencia={variacion(d)}
          />
          <Kpi className="min-w-[160px] snap-start" titulo="Tasa de ahorro" valor={pct(d.tasaAhorroProyectada)} detalle="meta 20 %" />
          <Kpi className="min-w-[160px] snap-start" titulo="Deuda total" valor={<Monto valor={d.deudaTotal} />} />
        </div>
      </div>

      <Tarjeta className="lg:col-span-2">
        <TituloTarjeta accion="Calendario">Próximos pagos</TituloTarjeta>
        <ListaProximos pagos={d.proximos} />
      </Tarjeta>
      <div className="grid content-start gap-4">
        <PorRevisar n={d.porRevisar} />
        <Tarjeta>
          <TituloTarjeta accion="Todos">Presupuestos en riesgo</TituloTarjeta>
          <div className="grid gap-5">
            {d.enRiesgo.map((p) => (
              <BarraPresupuesto key={p.nombre} item={p} ritmoIdeal={ritmo} />
            ))}
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// C · Plan del mes (inspirada en YNAB + Monarch)
// ---------------------------------------------------------------------------
export function InicioC({ d }: { d: ResumenInicio }) {
  const ritmo = d.diaDelMes / d.diasDelMes;
  const segmentos = [
    { nombre: "Gastos fijos", valor: d.plan.fijos, clase: "bg-chart-2" },
    { nombre: "Ahorro (Cadena)", valor: d.plan.ahorro, clase: "bg-chart-3" },
    { nombre: "Cuotas de deuda", valor: d.plan.deudas, clase: "bg-chart-5" },
    { nombre: "Variable gastado", valor: d.plan.gastadoVariable, clase: "bg-chart-1" },
    { nombre: "Disponible", valor: d.disponible, clase: "bg-positive/25 ring-positive/50 ring-1 ring-inset" },
  ];
  const dias = Array.from({ length: 7 }, (_, i) => d.diaDelMes + i);

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
      <Tarjeta className="lg:col-span-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">Plan de octubre · ingreso esperado</p>
            <Monto valor={d.ingresoEsperado} className="mt-1 block text-3xl font-semibold tracking-tight" />
          </div>
          <div className="sm:text-right">
            <p className="text-muted-foreground text-sm">Disponible para gastar</p>
            <Monto valor={d.disponible} className="text-positive mt-1 block text-3xl font-semibold tracking-tight" />
            <p className="text-muted-foreground text-xs">
              <Monto valor={d.porDia} /> por día · {d.diasRestantes} días
            </p>
          </div>
        </div>
        <div className="mt-5 flex h-4 gap-0.5 overflow-hidden rounded-full">
          {segmentos.map((s) => (
            <div
              key={s.nombre}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", s.clase)}
              style={{ flexGrow: s.valor }}
              title={s.nombre}
            />
          ))}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
          {segmentos.map((s) => (
            <li key={s.nombre} className="text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-sm", s.clase)} />
                {s.nombre}
              </span>
              <Monto valor={s.valor} className="mt-0.5 block text-sm font-semibold" />
            </li>
          ))}
        </ul>
      </Tarjeta>

      <div className="grid grid-cols-2 gap-3 lg:col-span-3 lg:grid-cols-4 lg:gap-4">
        <TarjetaLemon lemon={d.lemon} destacada />
        <Kpi titulo="Gasto personal" valor={<Monto valor={d.gastoPersonal} />} tendencia={variacion(d)} />
        <Kpi titulo="Tasa de ahorro" valor={pct(d.tasaAhorroProyectada)} detalle="meta 20 %" />
        <Kpi titulo="Deuda total" valor={<Monto valor={d.deudaTotal} />} />
      </div>

      <Tarjeta className="lg:col-span-2">
        <TituloTarjeta accion="Calendario">
          <CalendarDays className="size-4" />
          Esta semana
        </TituloTarjeta>
        <div className="mb-4 grid grid-cols-7 gap-1.5">
          {dias.map((dia) => {
            const pagos = d.proximos.filter((p) => Number(p.fecha.slice(8)) === dia);
            return (
              <div
                key={dia}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-2 text-xs",
                  dia === d.diaDelMes ? "bg-primary text-primary-foreground" : "bg-surface",
                )}
              >
                <span className="font-semibold">{dia}</span>
                <span className="flex h-2 gap-0.5">
                  {pagos.map((p) => (
                    <span
                      key={p.nombre}
                      className={cn("size-1.5 rounded-full", dia === d.diaDelMes ? "bg-primary-foreground" : "bg-primary")}
                    />
                  ))}
                </span>
              </div>
            );
          })}
        </div>
        <ListaProximos pagos={d.proximos} />
      </Tarjeta>
      <div className="grid content-start gap-4">
        <PorRevisar n={d.porRevisar} />
        <Tarjeta>
          <TituloTarjeta accion="Todos">Presupuestos en riesgo</TituloTarjeta>
          <div className="grid gap-5">
            {d.enRiesgo.map((p) => (
              <BarraPresupuesto key={p.nombre} item={p} ritmoIdeal={ritmo} />
            ))}
          </div>
        </Tarjeta>
        <p className="text-muted-foreground text-xs">Actualizado {formatFecha(d.hoy)}</p>
      </div>
    </div>
  );
}
