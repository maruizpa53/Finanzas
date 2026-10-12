import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronRight, Citrus, Info } from "lucide-react";
import { Monto } from "@/components/app/monto";
import { formatFecha } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PagoProximo, PresupuestoRiesgo, ResumenInicio } from "./datos-ejemplo";

export function Tarjeta({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("bg-card rounded-2xl border p-5 shadow-xs", className)} {...props} />;
}

export function TituloTarjeta({
  children,
  accion,
  ayuda,
}: {
  children: React.ReactNode;
  accion?: string;
  ayuda?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        {children}
        {ayuda && (
          <span title={ayuda} className="text-muted-foreground">
            <Info className="size-3.5" />
          </span>
        )}
      </h2>
      {accion && (
        <span className="text-primary flex items-center text-xs font-medium">
          {accion}
          <ChevronRight className="size-3.5" />
        </span>
      )}
    </div>
  );
}

export function Kpi({
  titulo,
  valor,
  detalle,
  tendencia,
  className,
}: {
  titulo: string;
  valor: React.ReactNode;
  detalle?: React.ReactNode;
  tendencia?: { texto: string; bueno: boolean; sube: boolean };
  className?: string;
}) {
  return (
    <div className={cn("bg-card rounded-2xl border p-4 shadow-xs", className)}>
      <p className="text-muted-foreground text-xs font-medium">{titulo}</p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl">{valor}</p>
      {(detalle || tendencia) && (
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
          {tendencia && (
            <span
              className={cn(
                "inline-flex items-center font-medium",
                tendencia.bueno ? "text-positive" : "text-negative",
              )}
            >
              {tendencia.sube ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {tendencia.texto}
            </span>
          )}
          {detalle}
        </p>
      )}
    </div>
  );
}

export function ListaProximos({ pagos }: { pagos: PagoProximo[] }) {
  return (
    <ul className="-mx-1 divide-y">
      {pagos.map((p) => (
        <li key={p.nombre} className="flex items-center gap-3 px-1 py-2.5">
          <span className="bg-surface flex size-9 shrink-0 items-center justify-center rounded-xl text-base">
            {p.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{p.nombre}</p>
            <p className="text-muted-foreground text-xs">
              {formatFecha(p.fecha)} · {p.dias === 0 ? "hoy" : p.dias === 1 ? "mañana" : `en ${p.dias} días`}
            </p>
          </div>
          {p.monto !== null ? (
            <Monto valor={p.monto} className="text-sm font-semibold" />
          ) : (
            <span className="text-muted-foreground text-xs">Corte</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Barra de presupuesto con marca del ritmo ideal (día del mes / días del mes). */
export function BarraPresupuesto({
  item,
  ritmoIdeal,
}: {
  item: PresupuestoRiesgo;
  ritmoIdeal: number;
}) {
  const consumido = item.gastado / item.presupuesto;
  const nivel = consumido >= 1 ? "excedido" : consumido >= 0.8 ? "alerta" : consumido > ritmoIdeal ? "rapido" : "ok";
  const color =
    nivel === "excedido" ? "bg-negative" : nivel === "alerta" ? "bg-warning" : nivel === "rapido" ? "bg-warning" : "bg-positive";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <span>{item.emoji}</span>
          {item.nombre}
        </span>
        <span className="text-muted-foreground text-xs">
          <Monto valor={item.gastado} className="text-foreground font-semibold" /> de{" "}
          <Monto valor={item.presupuesto} />
        </span>
      </div>
      <div className="bg-muted relative h-2 overflow-hidden rounded-full">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(consumido, 1) * 100}%` }} />
        <div
          className="bg-foreground/70 absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full"
          style={{ left: `${ritmoIdeal * 100}%` }}
          title="Ritmo ideal a hoy"
        />
      </div>
      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
        {nivel !== "ok" && <AlertTriangle className="text-warning size-3" />}
        {Math.round(consumido * 100)} % usado · ritmo ideal {Math.round(ritmoIdeal * 100)} %
      </p>
    </div>
  );
}

export function TarjetaLemon({ lemon, destacada = false }: { lemon: ResumenInicio["lemon"]; destacada?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        destacada ? "border-lemon/60 bg-lemon-soft" : "bg-card shadow-xs",
      )}
    >
      <p className="text-lemon-foreground flex items-center gap-1.5 text-xs font-semibold">
        <Citrus className="size-3.5" />
        Lemon me debe
      </p>
      <Monto valor={lemon.total} className="mt-1.5 block text-xl font-semibold tracking-tight sm:text-2xl" />
      <p className="text-muted-foreground mt-1 text-xs">
        <Monto valor={lemon.pendienteSinCorte} /> sin presentar · <Monto valor={lemon.presentadoSinPagar} /> por
        pagar
      </p>
    </div>
  );
}

export function AvisoEjemplo() {
  return (
    <p className="bg-accent text-accent-foreground mb-4 rounded-lg px-3 py-2 text-xs">
      Vista previa de diseño con <strong>datos de ejemplo</strong>. Sus montos fijos son reales; los gastos variables
      y los de Lemon son ilustrativos.
    </p>
  );
}

export function PorRevisar({ n }: { n: number }) {
  return (
    <div className="bg-card flex items-center gap-3 rounded-2xl border p-4 shadow-xs">
      <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl text-sm font-semibold">
        {n}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium">Movimientos por revisar</p>
        <p className="text-muted-foreground text-xs">Confirme categoría y bolsa en un toque</p>
      </div>
      <ChevronRight className="text-muted-foreground size-4" />
    </div>
  );
}
