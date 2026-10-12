import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronRight, Citrus, Info } from "lucide-react";
import { Monto } from "@/components/app/monto";
import { formatFecha } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PagoProximo } from "@/lib/finance/mes";
import type { LemonMeDebe } from "@/lib/finance/calculos";
import type { Bolsa } from "@/lib/finance/modelo";

export function Tarjeta({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("bg-card rounded-2xl border p-5 shadow-xs", className)} {...props} />;
}

export function TituloTarjeta({
  children,
  href,
  accion,
  ayuda,
}: {
  children: React.ReactNode;
  href?: string;
  accion?: string;
  ayuda?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        {children}
        {ayuda && (
          <span title={ayuda} className="text-muted-foreground cursor-help">
            <Info className="size-3.5" />
            <span className="sr-only">{ayuda}</span>
          </span>
        )}
      </h2>
      {href && accion && (
        <Link href={href} className="text-primary flex items-center text-xs font-medium hover:underline">
          {accion}
          <ChevronRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

export function Kpi({
  titulo,
  valor,
  detalle,
  tendencia,
  href,
  ayuda,
  className,
}: {
  titulo: string;
  valor: React.ReactNode;
  detalle?: React.ReactNode;
  tendencia?: { texto: string; bueno: boolean; sube: boolean } | null;
  href?: string;
  ayuda?: string;
  className?: string;
}) {
  const contenido = (
    <>
      <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
        {titulo}
        {ayuda && (
          <span title={ayuda} className="cursor-help">
            <Info className="size-3" />
          </span>
        )}
      </p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight tabular sm:text-2xl">{valor}</p>
      {(detalle || tendencia) && (
        <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1 text-xs">
          {tendencia && (
            <span className={cn("inline-flex items-center font-medium", tendencia.bueno ? "text-positive" : "text-negative")}>
              {tendencia.sube ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {tendencia.texto}
            </span>
          )}
          {detalle}
        </p>
      )}
    </>
  );
  const clases = cn("bg-card block rounded-2xl border p-4 shadow-xs", href && "hover:border-primary/40 transition-colors", className);
  return href ? (
    <Link href={href} className={clases}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  );
}

export function EmojiCategoria({ emoji, className }: { emoji?: string | null; className?: string }) {
  return (
    <span className={cn("bg-surface flex size-9 shrink-0 items-center justify-center rounded-xl text-base", className)}>
      {emoji || "📌"}
    </span>
  );
}

export function ListaProximos({ pagos, vacio }: { pagos: PagoProximo[]; vacio?: string }) {
  if (!pagos.length)
    return <p className="text-muted-foreground py-6 text-center text-sm">{vacio ?? "Nada por pagar en estos días ✓"}</p>;
  return (
    <ul className="-mx-1 divide-y">
      {pagos.map((p) => (
        <li key={p.id} className="flex items-center gap-3 px-1 py-2.5">
          <EmojiCategoria emoji={p.emoji} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{p.nombre}</p>
            <p className="text-muted-foreground text-xs">
              {formatFecha(p.fecha)} · {p.dias === 0 ? "hoy" : p.dias === 1 ? "mañana" : `en ${p.dias} días`}
            </p>
          </div>
          {p.monto !== null ? (
            <Monto valor={p.monto} className="text-sm font-semibold" />
          ) : (
            <span className="text-muted-foreground text-xs">{p.tipo === "corte" ? "Corte" : p.tipo === "pago_tarjeta" ? "Pagar" : "Sin monto"}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Barra de progreso con marca del ritmo ideal. */
export function BarraRitmo({
  consumido,
  ritmo,
  alto = "h-2",
  className,
}: {
  consumido: number;
  ritmo?: number;
  alto?: string;
  className?: string;
}) {
  const color =
    consumido >= 1 ? "bg-negative" : consumido >= 0.8 ? "bg-warning" : ritmo !== undefined && consumido > ritmo + 0.05 ? "bg-warning" : "bg-positive";
  return (
    <div className={cn("bg-muted relative overflow-hidden rounded-full", alto, className)}>
      <div className={cn("h-full rounded-full transition-[width]", color)} style={{ width: `${Math.min(consumido, 1) * 100}%` }} />
      {ritmo !== undefined && (
        <div
          className="bg-foreground/70 absolute top-1/2 h-[180%] w-0.5 -translate-y-1/2 rounded-full"
          style={{ left: `${Math.min(ritmo, 1) * 100}%` }}
          title="Ritmo ideal a hoy"
        />
      )}
    </div>
  );
}

export function FilaPresupuesto({
  emoji,
  nombre,
  gastado,
  presupuesto,
  ritmo,
  proyeccion,
}: {
  emoji?: string | null;
  nombre: string;
  gastado: number;
  presupuesto: number;
  ritmo: number;
  proyeccion?: number;
}) {
  const consumido = presupuesto > 0 ? gastado / presupuesto : gastado > 0 ? 1 : 0;
  const riesgo = consumido >= 0.8 || consumido > ritmo + 0.05;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2 font-medium">
          <span>{emoji}</span>
          <span className="truncate">{nombre}</span>
        </span>
        <span className="text-muted-foreground shrink-0 text-xs">
          <Monto valor={gastado} className="text-foreground font-semibold" /> de <Monto valor={presupuesto} />
        </span>
      </div>
      <BarraRitmo consumido={consumido} ritmo={ritmo} />
      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
        {riesgo && <AlertTriangle className="text-warning size-3" />}
        {Math.round(consumido * 100)} % · ideal {Math.round(ritmo * 100)} %
        {proyeccion !== undefined && proyeccion > presupuesto && (
          <>
            {" "}
            · cierre ≈ <Monto valor={proyeccion} />
          </>
        )}
      </p>
    </div>
  );
}

export function TarjetaLemon({ lemon, href = "/lemon" }: { lemon: LemonMeDebe; href?: string }) {
  return (
    <Link href={href} className="border-lemon/60 bg-lemon-soft hover:border-lemon block rounded-2xl border p-4 transition-colors">
      <p className="text-lemon-foreground flex items-center gap-1.5 text-xs font-semibold">
        <Citrus className="size-3.5" />
        Lemon me debe
      </p>
      <Monto valor={lemon.total} className="mt-1.5 block text-xl font-semibold tracking-tight sm:text-2xl" />
      <p className="text-muted-foreground mt-1 text-xs">
        <Monto valor={lemon.pendienteSinCorte} /> sin presentar · <Monto valor={lemon.presentadoSinPagar} /> por pagar
      </p>
    </Link>
  );
}

const BOLSAS: Record<Bolsa, { nombre: string; clase: string }> = {
  personal: { nombre: "Personal", clase: "bg-secondary text-secondary-foreground" },
  lemon: { nombre: "Lemon", clase: "bg-lemon-soft text-lemon-foreground" },
  freelance: { nombre: "Freelance", clase: "bg-freelance-soft text-freelance" },
};

export function ChipBolsa({ bolsa, ocultarPersonal = true }: { bolsa: Bolsa; ocultarPersonal?: boolean }) {
  if (ocultarPersonal && bolsa === "personal") return null;
  const b = BOLSAS[bolsa];
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", b.clase)}>{b.nombre}</span>;
}

export function Vacio({ icono, titulo, texto, accion }: { icono?: React.ReactNode; titulo: string; texto?: string; accion?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      {icono && <span className="bg-accent text-accent-foreground flex size-11 items-center justify-center rounded-2xl">{icono}</span>}
      <p className="font-medium">{titulo}</p>
      {texto && <p className="text-muted-foreground max-w-sm text-sm">{texto}</p>}
      {accion}
    </div>
  );
}

export const pct = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${Math.round(n * 100)} %`);
