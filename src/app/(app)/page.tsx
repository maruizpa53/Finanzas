import { AlertCircle, CreditCard, HandCoins, Landmark, Repeat, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCOP, formatFecha, hoyBogota, nombreMes } from "@/lib/format";
import { calcularLemonMeDebe, equivalenteMensual, relacionDeudaIngresos } from "@/lib/finance/calculos";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TIPO_CUENTA: Record<string, string> = {
  debito: "Débito",
  credito: "Crédito",
  billetera: "Billetera",
  efectivo: "Efectivo",
};

export default async function InicioPage() {
  const supabase = await createClient();
  const hoy = hoyBogota();
  const [anio, mes] = hoy.split("-").map(Number);

  const [cuentas, deudas, recurrentes, ingresos, gastosLemon, cortes] = await Promise.all([
    supabase.from("account_balances").select("*"),
    supabase.from("debt_balances").select("*"),
    supabase.from("recurring_items").select("nombre, monto_esperado, es_variable, frecuencia, tipo").eq("activo", true),
    supabase.from("income_sources").select("nombre, monto_esperado, es_variable, frecuencia").eq("activa", true),
    supabase
      .from("transactions")
      .select("monto, reembolso_estado, lemon_settlement_id")
      .eq("bolsa", "lemon")
      .eq("tipo", "gasto"),
    supabase
      .from("lemon_settlements")
      .select("id, fecha_corte, monto_presentado, monto_reembolsado, estado")
      .order("fecha_corte", { ascending: false }),
  ]);

  const error = [cuentas, deudas, recurrentes, ingresos, gastosLemon, cortes].find((r) => r.error)?.error;
  if (error) {
    return (
      <p className="text-destructive">No se pudieron cargar los datos: {error.message}</p>
    );
  }

  const lemon = calcularLemonMeDebe(
    (gastosLemon.data ?? []).map((g) => ({
      monto: g.monto,
      reembolso_estado: g.reembolso_estado ?? "pendiente",
      lemon_settlement_id: g.lemon_settlement_id,
    })),
    cortes.data ?? [],
  );
  const ultimoCorte = cortes.data?.[0];

  const deudaTotal = (deudas.data ?? []).reduce((s, d) => s + (d.saldo_actual ?? 0), 0);
  const cuotasDeuda = (deudas.data ?? []).reduce((s, d) => s + (d.cuota ?? 0), 0);

  const gastosFijos = (recurrentes.data ?? []).filter((r) => r.tipo === "gasto");
  const fijosMes = gastosFijos.reduce(
    (s, r) => s + (r.monto_esperado ? equivalenteMensual(r.monto_esperado, r.frecuencia, anio, mes) : 0),
    0,
  );
  const fijosPorConfirmar = gastosFijos.filter((r) => r.monto_esperado === null);

  const ingresoEsperado = (ingresos.data ?? []).reduce(
    (s, i) => s + (i.monto_esperado ? equivalenteMensual(i.monto_esperado, i.frecuencia, anio, mes) : 0),
    0,
  );
  const relacionDeuda = relacionDeudaIngresos(cuotasDeuda, ingresoEsperado);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
        <p className="text-muted-foreground text-sm">
          {nombreMes(anio, mes)} · hoy {formatFecha(hoy)}
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          titulo="Lemon me debe"
          valor={formatCOP(lemon.total)}
          detalle={
            ultimoCorte
              ? `Último corte: ${formatFecha(ultimoCorte.fecha_corte)}`
              : "Sin cortes registrados"
          }
          icono={<HandCoins className="size-4" />}
          destacado
        />
        <Kpi
          titulo="Deuda total"
          valor={formatCOP(deudaTotal)}
          detalle={`Cuotas: ${formatCOP(cuotasDeuda)}/mes${
            relacionDeuda !== null ? ` · ${(relacionDeuda * 100).toFixed(1).replace(".", ",")} % del ingreso` : ""
          }`}
          icono={<Landmark className="size-4" />}
        />
        <Kpi
          titulo="Fijos del mes"
          valor={formatCOP(fijosMes)}
          detalle={`${gastosFijos.length} gastos fijos · ${fijosPorConfirmar.length} sin monto`}
          icono={<Repeat className="size-4" />}
        />
        <Kpi
          titulo="Ingreso esperado"
          valor={formatCOP(ingresoEsperado)}
          detalle="Sueldo Lemon (freelance variable)"
          icono={<TrendingUp className="size-4" />}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cuentas</CardTitle>
            <CardDescription>Saldo calculado con los movimientos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {(cuentas.data ?? []).map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <CreditCard className="text-muted-foreground size-4" />
                    <div>
                      <p className="text-sm font-medium">
                        {c.nombre}
                        {c.ultimos4 && <span className="text-muted-foreground"> ···{c.ultimos4}</span>}
                      </p>
                      <p className="text-muted-foreground text-xs">{TIPO_CUENTA[c.tipo ?? ""]}</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-semibold tabular-nums", (c.saldo ?? 0) < 0 && "text-destructive")}>
                    {formatCOP(c.saldo ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deudas</CardTitle>
            <CardDescription>Saldo de capital y cuota mensual</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {(deudas.data ?? []).map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{d.acreedor}</p>
                    <p className="text-muted-foreground text-xs">
                      {d.cuota ? `${formatCOP(d.cuota)}/mes` : "Sin cuota fija"}
                      {d.solo_intereses && " · solo intereses"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {d.saldo_actual !== null ? formatCOP(d.saldo_actual) : "Por confirmar"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {fijosPorConfirmar.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-warning size-5" />
              Montos por confirmar
            </CardTitle>
            <CardDescription>
              Estos gastos fijos aún no tienen monto. Los variables se toman del valor real de cada mes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {fijosPorConfirmar.map((r) => (
              <span key={r.nombre} className="bg-muted rounded-full px-3 py-1 text-xs">
                {r.nombre}
                {r.es_variable && " (variable)"}
              </span>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Kpi({
  titulo,
  valor,
  detalle,
  icono,
  destacado,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icono: React.ReactNode;
  destacado?: boolean;
}) {
  return (
    <Card className={cn("gap-2 py-4", destacado && "border-lemon bg-lemon/10")}>
      <CardHeader className="px-4">
        <CardDescription className="flex items-center justify-between">
          {titulo}
          {icono}
        </CardDescription>
        <CardTitle className="text-xl tabular-nums sm:text-2xl">{valor}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground px-4 text-xs">{detalle}</CardContent>
    </Card>
  );
}
