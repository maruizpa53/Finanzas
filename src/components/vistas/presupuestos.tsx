import { Encabezado } from "@/components/app/encabezado";
import { Monto } from "@/components/app/monto";
import { EditorPresupuesto } from "@/components/fin/editor-presupuesto";
import { FilaPresupuesto, Kpi, Tarjeta, TituloTarjeta, pct } from "@/components/fin/piezas";
import { tituloMes } from "@/lib/format";
import { diasHabilesDelMes } from "@/lib/finance/dias-habiles";
import type { Datos } from "@/lib/finance/modelo";
import { claveMes, movimientosDelMes, partesFecha, planDelMes, presupuestosDelMes, totalesPor } from "@/lib/finance/mes";

export function VistaPresupuestos({ datos }: { datos: Datos }) {
  const { anio, mes } = partesFecha(datos.hoy);
  const plan = planDelMes(datos, anio, mes);
  const estados = presupuestosDelMes(datos, anio, mes);
  const mesClave = `${claveMes(anio, mes)}-01`;
  const porId = new Map(datos.categorias.map((c) => [c.id, c]));
  const vigentePorCat = new Map<string, Datos["presupuestos"][number]>();
  for (const p of datos.presupuestos) if (p.mes === null && !vigentePorCat.has(p.categoria_id)) vigentePorCat.set(p.categoria_id, p);
  for (const p of datos.presupuestos) if (p.mes === mesClave) vigentePorCat.set(p.categoria_id, p);

  const totalPresupuesto = estados.reduce((s, e) => s + e.presupuesto, 0);
  const totalGastado = estados.reduce((s, e) => s + e.gastado, 0);
  const conPresupuesto = new Set(estados.map((e) => e.categoria.id));
  const sinPresupuesto = totalesPor(
    movimientosDelMes(datos.movimientos, anio, mes).filter((m) => m.tipo === "gasto" && m.bolsa === "personal"),
    (m) => (m.categoria_id && !conPresupuesto.has(m.categoria_id) && !conPresupuesto.has(porId.get(m.categoria_id)?.parent_id ?? "") ? m.categoria_id : null),
  );

  return (
    <>
      <Encabezado
        titulo="Presupuestos"
        descripcion={`${tituloMes(anio, mes)} · ${diasHabilesDelMes(anio, mes)} días hábiles · mes al ${pct(plan.ritmo)}`}
        acciones={<EditorPresupuesto categorias={datos.categorias} mesClave={mesClave} />}
      />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Kpi titulo="Presupuestado" valor={<Monto valor={totalPresupuesto} />} />
        <Kpi titulo="Gastado" valor={<Monto valor={totalGastado} />} detalle={pct(totalPresupuesto ? totalGastado / totalPresupuesto : 0)} />
        <Kpi titulo="Disponible" valor={<Monto valor={totalPresupuesto - totalGastado} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta>
          <TituloTarjeta ayuda="La marca vertical es el ritmo ideal a la fecha">Con presupuesto</TituloTarjeta>
          {estados.length ? (
            <ul className="grid gap-5">
              {estados.map((e) => {
                const p = vigentePorCat.get(e.categoria.id)!;
                return (
                  <li key={e.categoria.id} className="flex items-start gap-1">
                    <div className="min-w-0 flex-1">
                      <FilaPresupuesto
                        emoji={e.categoria.icono}
                        nombre={`${e.categoria.nombre}${e.categoria.parent_id ? "" : " (grupo)"}`}
                        gastado={e.gastado}
                        presupuesto={e.presupuesto}
                        ritmo={plan.ritmo}
                        proyeccion={e.proyeccion}
                      />
                      {p.monto_diario_habil > 0 && (
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          <Monto valor={p.monto} /> + <Monto valor={p.monto_diario_habil} /> × {diasHabilesDelMes(anio, mes)} días hábiles
                        </p>
                      )}
                    </div>
                    <EditorPresupuesto categorias={datos.categorias} inicial={p} mesClave={mesClave} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground py-6 text-center text-sm">Aún no hay presupuestos.</p>
          )}
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta ayuda="Gasto personal de este mes en categorías sin presupuesto">Sin presupuesto</TituloTarjeta>
          {sinPresupuesto.length ? (
            <ul className="-mx-1 divide-y">
              {sinPresupuesto.map((s) => {
                const c = porId.get(s.clave);
                return (
                  <li key={s.clave} className="flex items-center justify-between gap-2 px-1 py-2.5 text-sm">
                    <span>
                      {c?.icono} {c?.nombre}
                    </span>
                    <Monto valor={s.total} className="font-semibold" />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground py-6 text-center text-sm">Todo el gasto del mes tiene presupuesto ✓</p>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
