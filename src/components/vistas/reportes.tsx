import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Encabezado } from "@/components/app/encabezado";
import { Monto } from "@/components/app/monto";
import { FlujoSankey, GraficoTendencia } from "@/components/fin/graficos-reportes";
import { Kpi, Tarjeta, TituloTarjeta, pct } from "@/components/fin/piezas";
import { BENEFICIARIOS } from "@/lib/finance/etiquetas";
import { tituloMes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Datos } from "@/lib/finance/modelo";
import { resumenMes } from "@/lib/finance/calculos";
import { claveMes, indexarCategorias, movimientosDelMes, partesFecha, sumarMeses, tendencia, totalesPor } from "@/lib/finance/mes";

export function VistaReportes({ datos, mesParam }: { datos: Datos; mesParam?: string }) {
  const hoy = partesFecha(datos.hoy);
  const [anio, mes] = mesParam && /^\d{4}-\d{2}$/.test(mesParam) ? mesParam.split("-").map(Number) : [hoy.anio, hoy.mes];
  const { porId, grupoDe } = indexarCategorias(datos.categorias);
  const movs = movimientosDelMes(datos.movimientos, anio, mes);
  const gastos = movs.filter((m) => m.tipo === "gasto" && m.bolsa !== "lemon");
  const r = resumenMes(movs);
  const ant = sumarMeses(anio, mes, -1);
  const rAnt = resumenMes(movimientosDelMes(datos.movimientos, ant.anio, ant.mes));
  const varGasto = rAnt.gastoPersonal ? r.gastoPersonal / rAnt.gastoPersonal - 1 : null;

  const porGrupo = totalesPor(gastos, (m) => grupoDe(m.categoria_id)?.id ?? "sin");
  const porCategoria = totalesPor(gastos, (m) => m.categoria_id ?? "sin").slice(0, 8);
  const porBeneficiario = totalesPor(gastos, (m) => m.beneficiario ?? porId.get(m.categoria_id ?? "")?.beneficiario_default ?? "sin");
  const porComercio = totalesPor(gastos, (m) => (m.comercio || m.descripcion).trim()).slice(0, 8);
  const fijos = gastos.filter((m) => m.categoria_id && porId.get(m.categoria_id)?.es_fijo).reduce((s, m) => s + m.monto, 0);
  const variables = r.gastoPersonal + r.gastoFreelance - fijos;

  const esActual = anio === hoy.anio && mes === hoy.mes;
  // Sankey: ingresos → grupos de gasto (+ lo no gastado)
  const nodos = [{ name: "Ingresos" }, ...porGrupo.map((g) => ({ name: g.clave === "sin" ? "Sin categoría" : (porId.get(g.clave)?.nombre ?? "Otro") }))];
  const enlaces = porGrupo.map((g, i) => ({ source: 0, target: i + 1, value: g.total }));
  const sobrante = r.ingresos - porGrupo.reduce((s, g) => s + g.total, 0);
  if (sobrante > 0 && enlaces.length) {
    nodos.push({ name: esActual ? "Sin gastar (aún)" : "Sin gastar" });
    enlaces.push({ source: 0, target: nodos.length - 1, value: sobrante });
  }

  const sig = sumarMeses(anio, mes, 1);

  return (
    <>
      <Encabezado
        titulo="Reportes"
        descripcion="Lemon, transferencias y pagos de tarjeta no cuentan como gasto personal."
        acciones={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/reportes?mes=${claveMes(ant.anio, ant.mes)}`} aria-label="Mes anterior">
                <ChevronLeft />
              </Link>
            </Button>
            <span className="min-w-36 text-center text-sm font-semibold">{tituloMes(anio, mes)}</span>
            <Button variant="outline" size="icon" asChild>
              <Link href={esActual ? "#" : `/reportes?mes=${claveMes(sig.anio, sig.mes)}`} aria-label="Mes siguiente" className={cn(esActual && "pointer-events-none opacity-40")}>
                <ChevronRight />
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi titulo="Ingresos" valor={<Monto valor={r.ingresos} />} />
        <Kpi
          titulo="Gasto personal"
          valor={<Monto valor={r.gastoPersonal} />}
          tendencia={varGasto === null ? null : { texto: pct(Math.abs(varGasto)), bueno: varGasto <= 0, sube: varGasto > 0 }}
          detalle="vs. mes anterior"
        />
        <Kpi titulo="Flujo neto" valor={<Monto valor={r.flujoNeto} />} />
        <Kpi titulo="Tasa de ahorro" valor={pct(r.tasaAhorro)} detalle={esActual ? "a la fecha · meta 20 %" : "meta 20 %"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta className="lg:col-span-2">
          <TituloTarjeta ayuda="Cómo se reparte el ingreso del mes entre los grupos de gasto">Flujo de caja</TituloTarjeta>
          <FlujoSankey nodos={nodos} enlaces={enlaces} />
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta>Últimos 6 meses</TituloTarjeta>
          <GraficoTendencia datos={tendencia(datos, anio, mes, 6)} />
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta>Por grupo</TituloTarjeta>
          <Barras filas={porGrupo.map((g) => ({ nombre: g.clave === "sin" ? "Sin categoría" : `${porId.get(g.clave)?.icono ?? ""} ${porId.get(g.clave)?.nombre ?? ""}`, valor: g.total }))} />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Gastos fijos</p>
              <Monto valor={fijos} className="font-semibold" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Gastos variables</p>
              <Monto valor={variables} className="font-semibold" />
            </div>
          </div>
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta>Por beneficiario</TituloTarjeta>
          <Barras filas={porBeneficiario.map((b) => ({ nombre: BENEFICIARIOS.find((x) => x.valor === b.clave)?.nombre ?? "Sin asignar", valor: b.total }))} />
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta>Top categorías</TituloTarjeta>
          <Barras filas={porCategoria.map((c) => ({ nombre: c.clave === "sin" ? "Sin categoría" : `${porId.get(c.clave)?.icono ?? ""} ${porId.get(c.clave)?.nombre ?? ""}`, valor: c.total }))} />
        </Tarjeta>

        <Tarjeta className="lg:col-span-2">
          <TituloTarjeta>Top comercios</TituloTarjeta>
          <Barras filas={porComercio.map((c) => ({ nombre: c.clave, valor: c.total }))} />
        </Tarjeta>
      </div>
    </>
  );
}

function Barras({ filas }: { filas: { nombre: string; valor: number }[] }) {
  if (!filas.length) return <p className="text-muted-foreground py-6 text-center text-sm">Sin datos este mes.</p>;
  const max = Math.max(...filas.map((f) => f.valor));
  const total = filas.reduce((s, f) => s + f.valor, 0);
  return (
    <ul className="grid gap-3">
      {filas.map((f) => (
        <li key={f.nombre}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate">{f.nombre}</span>
            <span className="shrink-0 text-xs">
              <Monto valor={f.valor} className="font-semibold" /> <span className="text-muted-foreground">· {pct(f.valor / total)}</span>
            </span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div className="bg-chart-1 h-full rounded-full" style={{ width: `${(f.valor / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
