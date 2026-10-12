import Link from "next/link";
import { Check, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Encabezado } from "@/components/app/encabezado";
import { Monto } from "@/components/app/monto";
import { EditorRecurrente } from "@/components/fin/editor-recurrente";
import { EmojiCategoria, Kpi, Tarjeta, TituloTarjeta } from "@/components/fin/piezas";
import { formatFecha, nombreMes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { diasDelMes } from "@/lib/finance/dias-habiles";
import type { Datos } from "@/lib/finance/modelo";
import { equivalenteMensual } from "@/lib/finance/calculos";
import { fechaDelMes, ocurrenciasDelMes, partesFecha, type Ocurrencia } from "@/lib/finance/mes";

export function VistaRecurrentes({ datos }: { datos: Datos }) {
  const { anio, mes, dia } = partesFecha(datos.hoy);
  const oc = ocurrenciasDelMes(datos, anio, mes);
  const catPorId = new Map(datos.categorias.map((c) => [c.id, c]));
  const valor = (o: Ocurrencia) => (o.pagado ? o.montoPagado : (o.montoEsperado ?? 0));
  const pagadas = oc.filter((o) => o.pagado);
  const faltan = oc.filter((o) => !o.pagado);
  const total = oc.reduce((s, o) => s + valor(o), 0);
  const pagado = pagadas.reduce((s, o) => s + o.montoPagado, 0);

  // Calendario (semanas que empiezan en lunes)
  const totalDias = diasDelMes(anio, mes);
  const primerDow = (new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay() + 6) % 7;
  const celdas: (number | null)[] = [...Array(primerDow).fill(null), ...Array.from({ length: totalDias }, (_, i) => i + 1)];
  while (celdas.length % 7) celdas.push(null);

  const subsGrupo = datos.categorias.find((c) => !c.parent_id && c.nombre === "Suscripciones");
  const subs = datos.recurrentes.filter((r) => r.activo && r.categoria_id && catPorId.get(r.categoria_id)?.parent_id === subsGrupo?.id);
  const subsMensual = subs.reduce((s, r) => s + (r.monto_esperado ? equivalenteMensual(r.monto_esperado, r.frecuencia, anio, mes) : 0), 0);
  const diarios = datos.recurrentes.filter((r) => r.activo && r.frecuencia === "diaria_habil");

  return (
    <>
      <Encabezado
        titulo="Pagos y calendario"
        descripcion={`Gastos fijos de ${nombreMes(anio, mes)}`}
        acciones={<EditorRecurrente categorias={datos.categorias} />}
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Kpi titulo="Total del mes" valor={<Monto valor={total} />} />
        <Kpi titulo="Pagado" valor={<Monto valor={pagado} />} detalle={`${pagadas.length} de ${oc.length}`} />
        <Kpi titulo="Falta" valor={<Monto valor={total - pagado} />} detalle={`${faltan.length} pagos`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Tarjeta className="lg:col-span-2 lg:self-start">
          <TituloTarjeta>Calendario</TituloTarjeta>
          <div className="text-muted-foreground mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celdas.map((d, i) => {
              if (!d) return <span key={i} />;
              const f = fechaDelMes(anio, mes, d);
              const delDia = oc.filter((o) => o.fecha === f);
              const todosPagados = delDia.length > 0 && delDia.every((o) => o.pagado);
              return (
                <div
                  key={i}
                  title={delDia.map((o) => o.recurrente.nombre).join(", ")}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-lg text-xs",
                    d === dia ? "bg-primary text-primary-foreground font-semibold" : delDia.length ? "bg-accent" : "bg-surface",
                  )}
                >
                  {d}
                  {delDia.length > 0 && (
                    <span className={cn("mt-0.5 size-1.5 rounded-full", todosPagados ? "bg-positive" : d === dia ? "bg-primary-foreground" : "bg-warning")} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="bg-warning size-1.5 rounded-full" /> Pendiente
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-positive size-1.5 rounded-full" /> Pagado
            </span>
          </p>
        </Tarjeta>

        <div className="grid content-start gap-6 lg:col-span-3">
          <Tarjeta>
            <TituloTarjeta>Faltan por pagar</TituloTarjeta>
            <ListaOcurrencias lista={faltan} datos={datos} />
          </Tarjeta>
          <Tarjeta>
            <TituloTarjeta>Pagados este mes</TituloTarjeta>
            <ListaOcurrencias lista={pagadas} datos={datos} />
          </Tarjeta>
        </div>

        <Tarjeta className="lg:col-span-3">
          <TituloTarjeta ayuda="Suscripciones activas y su costo total">Suscripciones</TituloTarjeta>
          <p className="text-sm">
            <Monto valor={subsMensual} className="font-semibold" /> al mes · <Monto valor={subsMensual * 12} className="font-semibold" /> al año
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {subs.filter((s) => !s.monto_esperado).length > 0 && `${subs.filter((s) => !s.monto_esperado).length} sin monto: complételos para ver el total real.`}
          </p>
        </Tarjeta>

        {diarios.length > 0 && (
          <Tarjeta className="lg:col-span-2">
            <TituloTarjeta>Gastos por día hábil</TituloTarjeta>
            {diarios.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {(r.categoria_id && catPorId.get(r.categoria_id)?.icono) || "📌"} {r.nombre} · <Monto valor={r.monto_esperado ?? 0} /> por día
                </span>
                <span className="flex items-center">
                  <Monto valor={equivalenteMensual(r.monto_esperado ?? 0, "diaria_habil", anio, mes)} className="font-semibold" />
                  <EditorRecurrente recurrente={r} categorias={datos.categorias} />
                </span>
              </div>
            ))}
            <p className="text-muted-foreground mt-2 text-xs">Se suman al presupuesto de su categoría, no como pago aparte.</p>
          </Tarjeta>
        )}
      </div>
    </>
  );
}

function ListaOcurrencias({ lista, datos }: { lista: Ocurrencia[]; datos: Datos }) {
  const catPorId = new Map(datos.categorias.map((c) => [c.id, c]));
  if (!lista.length) return <p className="text-muted-foreground py-4 text-center text-sm">Nada aquí ✓</p>;
  return (
    <ul className="-mx-1 divide-y">
      {lista.map((o, i) => (
        <li key={`${o.recurrente.id}-${i}`} className="flex items-center gap-3 px-1 py-2.5">
          <EmojiCategoria emoji={o.recurrente.categoria_id ? catPorId.get(o.recurrente.categoria_id)?.icono : null} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{o.recurrente.nombre}</p>
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              {o.pagado ? <Check className="text-positive size-3" /> : <CircleDashed className="size-3" />}
              {o.fecha ? formatFecha(o.fecha) : "Sin día de pago"}
              {o.recurrente.es_variable && " · variable"}
              {o.recurrente.frecuencia === "quincenal" && " · quincenal"}
            </p>
          </div>
          {o.pagado ? (
            <Monto valor={o.montoPagado} className="text-sm font-semibold" />
          ) : o.montoEsperado !== null ? (
            <Monto valor={o.montoEsperado} className="text-muted-foreground text-sm font-semibold" />
          ) : (
            <span className="bg-warning-soft text-warning rounded-full px-2 py-0.5 text-[10px] font-semibold">Sin monto</span>
          )}
          {!o.pagado && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/movimientos/nuevo?recurrente=${o.recurrente.id}`}>Pagar</Link>
            </Button>
          )}
          <EditorRecurrente recurrente={o.recurrente} categorias={datos.categorias} />
        </li>
      ))}
    </ul>
  );
}
