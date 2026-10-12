import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Encabezado } from "@/components/app/encabezado";
import { Monto } from "@/components/app/monto";
import { ListaMovimientos } from "@/components/fin/lista-movimientos";
import { nombreCuenta } from "@/lib/finance/etiquetas";
import { tituloMes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Datos } from "@/lib/finance/modelo";
import { claveMes, movimientosDelMes, partesFecha, sumarMeses } from "@/lib/finance/mes";

export interface FiltrosMovimientos {
  mes?: string;
  q?: string;
  cuenta?: string;
  grupo?: string;
  bolsa?: string;
  revisar?: string;
  etiqueta?: string;
}

export function VistaMovimientos({ datos, filtros }: { datos: Datos; filtros: FiltrosMovimientos }) {
  const hoy = partesFecha(datos.hoy);
  const [anio, mes] = filtros.mes && /^\d{4}-\d{2}$/.test(filtros.mes) ? filtros.mes.split("-").map(Number) : [hoy.anio, hoy.mes];
  const revision = filtros.revisar === "1";
  const porId = new Map(datos.categorias.map((c) => [c.id, c]));
  const q = (filtros.q ?? "").trim().toLowerCase();

  let movs = revision ? datos.movimientos.filter((m) => !m.revisado) : movimientosDelMes(datos.movimientos, anio, mes);
  if (q) movs = movs.filter((m) => `${m.descripcion} ${m.comercio ?? ""} ${m.notas ?? ""} ${m.monto}`.toLowerCase().includes(q.replace(/\./g, "")));
  if (filtros.cuenta) movs = movs.filter((m) => m.cuenta_id === filtros.cuenta || m.cuenta_destino_id === filtros.cuenta);
  if (filtros.etiqueta) movs = movs.filter((m) => m.etiquetas.includes(filtros.etiqueta!));
  if (filtros.bolsa) movs = movs.filter((m) => m.bolsa === filtros.bolsa);
  if (filtros.grupo) movs = movs.filter((m) => m.categoria_id && (m.categoria_id === filtros.grupo || porId.get(m.categoria_id)?.parent_id === filtros.grupo));

  const gastos = movs.filter((m) => m.tipo === "gasto" && m.bolsa !== "lemon").reduce((s, m) => s + m.monto, 0);
  const ingresos = movs.filter((m) => m.tipo === "ingreso" && m.bolsa !== "lemon").reduce((s, m) => s + m.monto, 0);
  const lemon = movs.filter((m) => m.tipo === "gasto" && m.bolsa === "lemon").reduce((s, m) => s + m.monto, 0);

  const ant = sumarMeses(anio, mes, -1);
  const sig = sumarMeses(anio, mes, 1);
  const esActual = anio === hoy.anio && mes === hoy.mes;
  const conMes = (a: number, m: number) => {
    const p = new URLSearchParams(Object.entries({ ...filtros, mes: claveMes(a, m) }).filter(([, v]) => v) as [string, string][]);
    return `/movimientos?${p.toString()}`;
  };
  const porRevisar = datos.movimientos.filter((m) => !m.revisado).length;
  const sel = "border-input bg-card h-9 rounded-lg border px-2.5 text-sm";

  return (
    <>
      <Encabezado
        titulo={revision ? "Por revisar" : "Movimientos"}
        descripcion={revision ? "Confirme categoría y bolsa de lo importado o registrado sin revisar." : undefined}
        acciones={
          <Button asChild>
            <Link href="/movimientos/nuevo">
              <Plus />
              Registrar
            </Link>
          </Button>
        }
      />

      {!revision && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href={conMes(ant.anio, ant.mes)} aria-label="Mes anterior">
                <ChevronLeft />
              </Link>
            </Button>
            <p className="min-w-40 text-center font-semibold">{tituloMes(anio, mes)}</p>
            <Button variant="outline" size="icon" asChild disabled={esActual}>
              <Link href={esActual ? "#" : conMes(sig.anio, sig.mes)} aria-label="Mes siguiente" className={cn(esActual && "pointer-events-none opacity-40")}>
                <ChevronRight />
              </Link>
            </Button>
            {porRevisar > 0 && (
              <Link href="/movimientos?revisar=1" className="bg-primary text-primary-foreground ml-auto rounded-full px-3 py-1.5 text-xs font-medium">
                {porRevisar} por revisar
              </Link>
            )}
          </div>

          <form className="mb-4 flex flex-wrap gap-2" action="/movimientos">
            <input type="hidden" name="mes" value={claveMes(anio, mes)} />
            <div className="relative min-w-48 flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <input name="q" defaultValue={filtros.q} placeholder="Buscar comercio, nota o monto" className={cn(sel, "w-full pl-8")} />
            </div>
            <select name="cuenta" defaultValue={filtros.cuenta ?? ""} className={sel} aria-label="Cuenta">
              <option value="">Todas las cuentas</option>
              {datos.cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {nombreCuenta(c)}
                </option>
              ))}
            </select>
            <select name="grupo" defaultValue={filtros.grupo ?? ""} className={sel} aria-label="Categoría">
              <option value="">Todas las categorías</option>
              {datos.categorias
                .filter((c) => !c.parent_id)
                .map((g) => (
                  <optgroup key={g.id} label={`${g.icono ?? ""} ${g.nombre}`}>
                    <option value={g.id}>Todo {g.nombre}</option>
                    {datos.categorias
                      .filter((c) => c.parent_id === g.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icono} {c.nombre}
                        </option>
                      ))}
                  </optgroup>
                ))}
            </select>
            <select name="bolsa" defaultValue={filtros.bolsa ?? ""} className={sel} aria-label="Bolsa">
              <option value="">Todas las bolsas</option>
              <option value="personal">Personal</option>
              <option value="lemon">Lemon</option>
              <option value="freelance">Freelance</option>
            </select>
            {datos.etiquetas.length > 0 && (
              <select name="etiqueta" defaultValue={filtros.etiqueta ?? ""} className={sel} aria-label="Etiqueta">
                <option value="">Todas las etiquetas</option>
                {datos.etiquetas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.emoji} {e.nombre}
                  </option>
                ))}
              </select>
            )}
            <Button type="submit" variant="secondary" size="sm" className="h-9">
              Filtrar
            </Button>
          </form>

          <div className="mb-5 grid grid-cols-3 gap-2 text-center">
            <Resumen titulo="Gastos" valor={gastos} />
            <Resumen titulo="Ingresos" valor={ingresos} positivo />
            <Resumen titulo="Lemon" valor={lemon} />
          </div>
        </>
      )}

      <ListaMovimientos movimientos={movs} cuentas={datos.cuentas} categorias={datos.categorias} etiquetas={datos.etiquetas} hoy={datos.hoy} modoRevision={revision} />
    </>
  );
}

function Resumen({ titulo, valor, positivo }: { titulo: string; valor: number; positivo?: boolean }) {
  return (
    <div className="bg-card rounded-xl border px-2 py-2.5">
      <p className="text-muted-foreground text-[11px]">{titulo}</p>
      <Monto valor={valor} className={cn("text-sm font-semibold", positivo && valor > 0 && "text-positive")} />
    </div>
  );
}
