import { CreditCard, HandCoins, Pencil, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Encabezado } from "@/components/app/encabezado";
import { Monto } from "@/components/app/monto";
import { HojaFormulario } from "@/components/fin/hoja-formulario";
import { PlanDeudas } from "@/components/fin/plan-deudas";
import { BarraRitmo, Kpi, Tarjeta, TituloTarjeta, pct } from "@/components/fin/piezas";
import { nombreCuenta } from "@/lib/finance/etiquetas";
import { formAbono, formAhorro, formAporte, formCuenta, formDeuda } from "@/lib/acciones/formularios";
import { formatFecha } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Datos } from "@/lib/finance/modelo";
import { usoDeCupo, relacionDeudaIngresos, equivalenteMensual } from "@/lib/finance/calculos";
import { saldoActualDeuda, tasaMensual } from "@/lib/finance/deudas";
import { partesFecha } from "@/lib/finance/mes";

const opcionesCuentas = (datos: Datos) => datos.cuentas.filter((c) => c.activa).map((c) => ({ valor: c.id, nombre: nombreCuenta(c) }));

// ---------------------------------------------------------------------------
// Deudas
// ---------------------------------------------------------------------------

export function VistaDeudas({ datos }: { datos: Datos }) {
  const { anio, mes } = partesFecha(datos.hoy);
  const activas = datos.deudas.filter((d) => d.estado === "activa");
  const filas = activas.map((d) => {
    const saldo = saldoActualDeuda(d, datos.pagosDeuda);
    const tasa = tasaMensual(d, saldo);
    const pagado = datos.pagosDeuda.filter((p) => p.debt_id === d.id);
    return { d, saldo, tasa, pagadoCapital: pagado.reduce((s, p) => s + p.capital, 0), pagadoInteres: pagado.reduce((s, p) => s + p.interes, 0) };
  });
  const total = filas.reduce((s, f) => s + (f.saldo ?? 0), 0);
  const cuotas = activas.reduce((s, d) => s + (d.cuota ?? 0), 0);
  const ingreso = datos.ingresos.filter((i) => i.activa && i.monto_esperado).reduce((s, i) => s + equivalenteMensual(i.monto_esperado!, i.frecuencia, anio, mes), 0);
  const relacion = relacionDeudaIngresos(cuotas, ingreso);
  const interesesAnuales = filas.reduce((s, f) => s + Math.round((f.saldo ?? 0) * f.tasa * 12), 0);
  const cuentas = opcionesCuentas(datos);

  return (
    <>
      <Encabezado titulo="Deudas" descripcion="Saldo, avance y plan para salir de deudas" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi titulo="Deuda total" valor={<Monto valor={total} />} detalle={`${activas.length} activas`} />
        <Kpi titulo="Cuotas al mes" valor={<Monto valor={cuotas} />} />
        <Kpi
          titulo="Cuotas / ingreso"
          valor={pct(relacion)}
          detalle={relacion === null ? undefined : relacion < 0.15 ? "Sano (< 15 %)" : relacion < 0.3 ? "Cuidado (15–30 %)" : "Alto (> 30 %)"}
          ayuda="Cuotas mensuales de deuda ÷ ingreso esperado del mes"
        />
        <Kpi titulo="Intereses al año" valor={<Monto valor={interesesAnuales} />} detalle="si nada cambia" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {filas.map(({ d, saldo, tasa, pagadoCapital, pagadoInteres }) => {
          const original = d.monto_original ?? (saldo !== null ? saldo + pagadoCapital : null);
          const avance = original && saldo !== null ? 1 - saldo / original : 0;
          return (
            <Tarjeta key={d.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{d.acreedor}</p>
                  <p className="text-muted-foreground text-xs">
                    {d.solo_intereses ? "Préstamo al interés" : d.cuota ? "Cuota fija" : "Sin cuota fija"}
                    {tasa > 0 && ` · ${(tasa * 100).toFixed(1).replace(".", ",")} % mensual`}
                    {d.dia_pago && ` · paga el ${d.dia_pago}`}
                  </p>
                </div>
                <HojaFormulario
                  titulo={`Editar ${d.acreedor}`}
                  disparador={
                    <Button variant="ghost" size="icon" aria-label="Editar">
                      <Pencil />
                    </Button>
                  }
                  accion={formDeuda.bind(null, d.id)}
                  campos={[
                    { nombre: "saldo", etiqueta: "Saldo de hoy", tipo: "monto", inicial: saldo, ayuda: "Lo que debe hoy, después de los pagos de hoy." },
                    { nombre: "cuota", etiqueta: "Cuota mensual", tipo: "monto", inicial: d.cuota },
                    { nombre: "tasa", etiqueta: "Interés mensual (%)", tipo: "decimal", inicial: d.tasa_mensual !== null ? Number(d.tasa_mensual) * 100 : null, placeholder: "Ej. 3" },
                    { nombre: "dia_pago", etiqueta: "Día de pago", tipo: "numero", inicial: d.dia_pago },
                    { nombre: "solo_intereses", etiqueta: "Solo se pagan intereses (el capital se abona aparte)", tipo: "check", inicial: d.solo_intereses },
                    { nombre: "notas", etiqueta: "Notas", tipo: "texto", inicial: d.notas },
                  ]}
                />
              </div>
              <Monto valor={saldo ?? 0} className="mt-3 block text-2xl font-semibold tracking-tight" />
              {saldo === null && <p className="text-warning text-xs">Saldo por confirmar</p>}
              {original ? (
                <>
                  <BarraRitmo consumido={avance} className="mt-3" />
                  <p className="text-muted-foreground mt-1 text-xs">
                    {pct(avance)} pagado de <Monto valor={original} />
                  </p>
                </>
              ) : null}
              {d.solo_intereses && saldo ? (
                <p className="bg-warning-soft mt-3 rounded-lg p-2 text-xs">
                  Paga <Monto valor={Math.round(saldo * tasa)} /> al mes solo en intereses (<Monto valor={Math.round(saldo * tasa * 12)} /> al año) y el capital no baja. Abonar a capital es la mejor inversión que tiene.
                </p>
              ) : null}
              {(pagadoCapital > 0 || pagadoInteres > 0) && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Pagado: <Monto valor={pagadoCapital} /> a capital · <Monto valor={pagadoInteres} /> de intereses
                </p>
              )}
              <HojaFormulario
                titulo={`Pago a ${d.acreedor}`}
                descripcion="Se registra como gasto y descuenta el capital de la deuda."
                disparador={
                  <Button className="mt-4 w-full" variant="outline">
                    <HandCoins />
                    Registrar pago
                  </Button>
                }
                accion={formAbono.bind(null, d.id)}
                textoBoton="Registrar pago"
                campos={[
                  { nombre: "monto", etiqueta: "Monto pagado", tipo: "monto", inicial: d.cuota },
                  {
                    nombre: "capital",
                    etiqueta: "De eso, abono a capital",
                    tipo: "monto",
                    inicial: d.solo_intereses ? 0 : d.cuota,
                    ayuda: d.solo_intereses ? "Si solo pagó los intereses, deje 0." : "Si no hay intereses, es igual al monto.",
                  },
                  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", inicial: datos.hoy },
                  { nombre: "cuenta_id", etiqueta: "Pagado desde", tipo: "select", opciones: cuentas, inicial: cuentas[0]?.valor },
                ]}
              />
            </Tarjeta>
          );
        })}
      </div>

      <Tarjeta className="mt-6">
        <TituloTarjeta ayuda="Simulación mes a mes con sus cuotas actuales más el aporte extra">Plan para salir de deudas</TituloTarjeta>
        <PlanDeudas
          deudas={filas
            .filter((f) => f.saldo)
            .map((f) => ({ acreedor: f.d.acreedor, saldo: f.saldo!, tasaMensual: f.tasa, cuota: f.d.cuota ?? 0, soloIntereses: f.d.solo_intereses }))}
        />
      </Tarjeta>
    </>
  );
}

// ---------------------------------------------------------------------------
// Ahorro
// ---------------------------------------------------------------------------

export function VistaAhorro({ datos }: { datos: Datos }) {
  const cuentas = opcionesCuentas(datos);
  const liquido = datos.cuentas.filter((c) => c.activa && c.tipo !== "credito").reduce((s, c) => s + Math.max(datos.saldos[c.id] ?? 0, 0), 0);
  const { anio, mes } = partesFecha(datos.hoy);
  const fijosMes = datos.recurrentes
    .filter((r) => r.activo && r.tipo === "gasto" && r.monto_esperado)
    .reduce((s, r) => s + equivalenteMensual(r.monto_esperado!, r.frecuencia, anio, mes), 0);
  const colchon = fijosMes > 0 ? liquido / fijosMes : null;

  return (
    <>
      <Encabezado titulo="Ahorro y metas" />
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Kpi titulo="Dinero disponible en cuentas" valor={<Monto valor={liquido} />} detalle="sin tarjetas de crédito" href="/cuentas" />
        <Kpi
          titulo="Colchón de emergencia"
          valor={colchon === null ? "—" : `${colchon.toFixed(1).replace(".", ",")} meses`}
          detalle="de gastos fijos cubiertos · meta 3 a 6"
          ayuda="Saldo en cuentas ÷ gastos fijos del mes"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {datos.ahorros.map((a) => {
          const aportes = datos.aportes.filter((x) => x.saving_id === a.id);
          const aportado = aportes.reduce((s, x) => s + x.monto, 0);
          const acumulado = a.acumulado_inicial + aportado;
          const meta = a.meta_monto;
          return (
            <Tarjeta key={a.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="bg-positive-soft text-positive flex size-10 items-center justify-center rounded-xl">
                    <PiggyBank className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{a.nombre}</p>
                    <p className="text-muted-foreground text-xs">
                      {a.tipo === "programado" ? "Ahorro programado" : "Meta"}
                      {a.organizador && ` · organiza ${a.organizador}`}
                    </p>
                  </div>
                </div>
                <HojaFormulario
                  titulo={`Editar ${a.nombre}`}
                  disparador={
                    <Button variant="ghost" size="icon" aria-label="Editar">
                      <Pencil />
                    </Button>
                  }
                  accion={formAhorro.bind(null, a.id)}
                  campos={[
                    { nombre: "acumulado", etiqueta: "Acumulado antes de usar el portal", tipo: "monto", inicial: a.acumulado_inicial },
                    { nombre: "aporte", etiqueta: "Aporte mensual", tipo: "monto", inicial: a.aporte_mensual },
                    { nombre: "dia_aporte", etiqueta: "Día del aporte", tipo: "numero", inicial: a.dia_aporte },
                    { nombre: "meta", etiqueta: "Monto que recibirá / meta", tipo: "monto", inicial: a.meta_monto },
                    { nombre: "fecha_inicio", etiqueta: "Fecha de inicio", tipo: "fecha", inicial: a.fecha_inicio },
                    { nombre: "fecha_entrega", etiqueta: "Fecha de entrega", tipo: "fecha", inicial: a.fecha_entrega },
                  ]}
                />
              </div>
              <Monto valor={acumulado} className="mt-4 block text-3xl font-semibold tracking-tight" />
              <p className="text-muted-foreground text-xs">
                acumulado · aporte de <Monto valor={a.aporte_mensual ?? 0} /> al mes
              </p>
              {meta ? (
                <>
                  <BarraRitmo consumido={acumulado / meta} className="mt-3" />
                  <p className="text-muted-foreground mt-1 text-xs">
                    {pct(acumulado / meta)} de <Monto valor={meta} />
                  </p>
                </>
              ) : null}
              <p className="text-muted-foreground mt-2 text-xs">
                {a.fecha_entrega ? `Entrega: ${formatFecha(a.fecha_entrega)}` : "Fecha de entrega por confirmar"}
              </p>
              {aportes.length > 0 && (
                <ul className="mt-3 divide-y text-sm">
                  {aportes
                    .slice(-4)
                    .reverse()
                    .map((x) => (
                      <li key={x.id} className="flex justify-between py-1.5">
                        <span className="text-muted-foreground">{formatFecha(x.fecha)}</span>
                        <Monto valor={x.monto} />
                      </li>
                    ))}
                </ul>
              )}
              <HojaFormulario
                titulo={`Aporte a ${a.nombre}`}
                descripcion="Se registra como gasto de la categoría del ahorro y suma al acumulado."
                disparador={
                  <Button className="mt-4 w-full" variant="outline">
                    Registrar aporte
                  </Button>
                }
                accion={formAporte.bind(null, a.id)}
                textoBoton="Registrar aporte"
                campos={[
                  { nombre: "monto", etiqueta: "Monto", tipo: "monto", inicial: a.aporte_mensual },
                  { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", inicial: datos.hoy },
                  { nombre: "cuenta_id", etiqueta: "Desde", tipo: "select", opciones: cuentas, inicial: cuentas[0]?.valor },
                ]}
              />
            </Tarjeta>
          );
        })}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Cuentas
// ---------------------------------------------------------------------------

export function VistaCuentas({ datos }: { datos: Datos }) {
  const activas = datos.cuentas.filter((c) => c.activa);
  const credito = activas.filter((c) => c.tipo === "credito");
  const otras = activas.filter((c) => c.tipo !== "credito");
  const totalLiquido = otras.reduce((s, c) => s + (datos.saldos[c.id] ?? 0), 0);
  const totalTarjetas = credito.reduce((s, c) => s + Math.min(datos.saldos[c.id] ?? 0, 0), 0);

  const editor = (c: Datos["cuentas"][number]) => (
    <HojaFormulario
      titulo={`Editar ${c.nombre}`}
      disparador={
        <Button variant="ghost" size="icon" aria-label="Editar">
          <Pencil />
        </Button>
      }
      accion={formCuenta.bind(null, c.id)}
      campos={[
        { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", inicial: c.nombre },
        { nombre: "saldo", etiqueta: c.tipo === "credito" ? "Deuda de hoy (negativa, ej. -1200000)" : "Saldo de hoy", tipo: "numero", inicial: datos.saldos[c.id] ?? 0, ayuda: "Ajusta el saldo para que cuadre con el banco." },
        { nombre: "ultimos4", etiqueta: "Últimos 4 dígitos", tipo: "numero", inicial: c.ultimos4, placeholder: "Opcional" },
        ...(c.tipo === "credito"
          ? ([
              { nombre: "cupo", etiqueta: "Cupo", tipo: "monto", inicial: c.cupo },
              { nombre: "dia_corte", etiqueta: "Día de corte", tipo: "numero", inicial: c.dia_corte },
              { nombre: "dia_pago", etiqueta: "Día de pago", tipo: "numero", inicial: c.dia_pago },
            ] as const)
          : []),
      ]}
    />
  );

  return (
    <>
      <Encabezado titulo="Cuentas" descripcion="Saldos calculados con los movimientos registrados" />
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Kpi titulo="En cuentas y efectivo" valor={<Monto valor={totalLiquido} />} />
        <Kpi titulo="Deuda en tarjetas" valor={<Monto valor={-totalTarjetas} />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta>
          <TituloTarjeta>Cuentas y billeteras</TituloTarjeta>
          <ul className="-mx-1 divide-y">
            {otras.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-1 py-2.5">
                <span className="size-3 shrink-0 rounded-full" style={{ background: c.color ?? "var(--color-muted)" }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{nombreCuenta(c)}</p>
                  <p className="text-muted-foreground text-xs">{{ debito: "Cuenta", billetera: "Billetera", efectivo: "Efectivo", credito: "Crédito" }[c.tipo]}</p>
                </div>
                <Monto valor={datos.saldos[c.id] ?? 0} className={cn("text-sm font-semibold", (datos.saldos[c.id] ?? 0) < 0 && "text-negative")} />
                {editor(c)}
              </li>
            ))}
          </ul>
        </Tarjeta>
        <Tarjeta>
          <TituloTarjeta>Tarjetas de crédito</TituloTarjeta>
          <ul className="grid gap-5">
            {credito.map((c) => {
              const saldo = datos.saldos[c.id] ?? 0;
              const uso = usoDeCupo(saldo, c.cupo);
              return (
                <li key={c.id}>
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-muted-foreground size-4" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{nombreCuenta(c)}</p>
                      <p className="text-muted-foreground text-xs">
                        {c.dia_corte ? `Corte el ${c.dia_corte}` : "Corte por confirmar"} · {c.dia_pago ? `pago el ${c.dia_pago}` : "pago por confirmar"}
                      </p>
                    </div>
                    <Monto valor={-Math.min(saldo, 0)} className="text-sm font-semibold" />
                    {editor(c)}
                  </div>
                  {uso !== null ? (
                    <>
                      <BarraRitmo consumido={uso} className="mt-2" />
                      <p className="text-muted-foreground mt-1 text-xs">
                        {pct(uso)} del cupo de <Monto valor={c.cupo ?? 0} />
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground mt-1 text-xs">Agregue el cupo para ver el uso.</p>
                  )}
                </li>
              );
            })}
          </ul>
        </Tarjeta>
      </div>
    </>
  );
}
