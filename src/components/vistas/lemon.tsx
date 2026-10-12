import { Citrus } from "lucide-react";
import { Encabezado } from "@/components/app/encabezado";
import { Monto } from "@/components/app/monto";
import { AccionesCorte, EstadoCorte, PendientesLemon } from "@/components/fin/lemon-acciones";
import { Kpi, Tarjeta, TituloTarjeta } from "@/components/fin/piezas";
import { formatFecha } from "@/lib/format";
import type { Datos } from "@/lib/finance/modelo";
import { diasPromedioReembolso } from "@/lib/finance/deudas";
import { diasEntre, movimientosDelMes, partesFecha } from "@/lib/finance/mes";
import { lemonDe } from "@/lib/finance/resumen";

export function VistaLemon({ datos }: { datos: Datos }) {
  const lemon = lemonDe(datos);
  const { anio, mes } = partesFecha(datos.hoy);
  const pendientes = datos.gastosLemon.filter((g) => g.tipo === "gasto" && g.reembolso_estado === "pendiente" && !g.lemon_settlement_id);
  const delMes = movimientosDelMes(datos.gastosLemon, anio, mes).filter((g) => g.tipo === "gasto").reduce((s, g) => s + g.monto, 0);
  const promedio = diasPromedioReembolso(datos.cortes);
  const ultimo = datos.cortes[0];
  const abiertos = datos.cortes.filter((c) => c.estado !== "reembolsado");

  return (
    <>
      <Encabezado titulo="Lemon" descripcion="Gastos que paga con sus tarjetas por cuenta de Lemon First S.A.S." />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <section className="border-lemon/60 bg-lemon-soft rounded-3xl border p-6 lg:col-span-2">
          <p className="text-lemon-foreground flex items-center gap-1.5 text-sm font-semibold">
            <Citrus className="size-4" />
            Lemon me debe
          </p>
          <Monto valor={lemon.total} className="mt-2 block text-5xl leading-none font-semibold tracking-tight" />
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Sin presentar</p>
              <Monto valor={lemon.pendienteSinCorte} className="font-semibold" />
              <p className="text-muted-foreground text-xs">{pendientes.length} gastos</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Presentado sin pagar</p>
              <Monto valor={lemon.presentadoSinPagar} className="font-semibold" />
              <p className="text-muted-foreground text-xs">{abiertos.length === 1 ? "1 corte abierto" : `${abiertos.length} cortes abiertos`}</p>
            </div>
          </div>
          <ol className="border-lemon/40 mt-6 grid gap-2 border-t pt-4 text-sm sm:grid-cols-3">
            {[
              ["1", "Registre", "cada gasto que paga por Lemon con la bolsa 🍋 Lemon."],
              ["2", "Cree el corte", "con los pendientes y descargue la cuenta de cobro."],
              ["3", "Registre el pago", "cuando Lemon le consigne: se cierra el corte."],
            ].map(([n, t, d]) => (
              <li key={n} className="flex gap-2">
                <span className="bg-lemon text-black flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">{n}</span>
                <span>
                  <strong>{t}</strong> <span className="text-muted-foreground">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
          <Kpi titulo="Gastos Lemon este mes" valor={<Monto valor={delMes} />} />
          <Kpi
            titulo="Lemon tarda en pagar"
            valor={promedio === null ? "—" : `${promedio} días`}
            detalle={promedio === null ? "Se calcula con los cortes pagados" : "promedio por corte"}
          />
          <Kpi
            className="col-span-2 lg:col-span-1"
            titulo="Último corte"
            valor={ultimo ? formatFecha(ultimo.fecha_corte) : "—"}
            detalle={ultimo ? `hace ${diasEntre(ultimo.fecha_corte, datos.hoy)} días` : undefined}
          />
        </div>

        <Tarjeta className="lg:col-span-2">
          <TituloTarjeta ayuda="Seleccione los gastos y cree el corte para presentarlo a Lemon">Pendientes por presentar</TituloTarjeta>
          <PendientesLemon gastos={pendientes} cuentas={datos.cuentas} hoy={datos.hoy} />
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta>Historial de cortes</TituloTarjeta>
          {datos.cortes.length ? (
            <ul className="grid gap-4">
              {datos.cortes.map((c) => {
                const n = datos.gastosLemon.filter((g) => g.lemon_settlement_id === c.id && g.tipo === "gasto").length;
                return (
                  <li key={c.id} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Corte {formatFecha(c.fecha_corte)}</p>
                        <p className="text-muted-foreground text-xs">
                          {n ? `${n} gastos` : "Sin gastos registrados"}
                          {c.fecha_reembolso ? ` · pagado ${formatFecha(c.fecha_reembolso)}` : ""}
                        </p>
                      </div>
                      <EstadoCorte estado={c.estado} />
                    </div>
                    <div className="mt-2 flex items-baseline justify-between text-sm">
                      <span>
                        {c.monto_presentado !== null ? <Monto valor={c.monto_presentado} className="font-semibold" /> : <span className="text-muted-foreground">Monto por confirmar</span>}
                      </span>
                      {c.monto_reembolsado > 0 && (
                        <span className="text-muted-foreground text-xs">
                          pagado <Monto valor={c.monto_reembolsado} />
                        </span>
                      )}
                    </div>
                    {c.notas && <p className="text-muted-foreground mt-1 text-xs">{c.notas}</p>}
                    <div className="mt-3">
                      <AccionesCorte corte={c} cuentas={datos.cuentas} hoy={datos.hoy} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground py-6 text-center text-sm">Aún no hay cortes.</p>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
