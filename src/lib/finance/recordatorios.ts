// Recordatorios del banner de Inicio: lo más urgente primero.
import { formatCOP } from "@/lib/format";
import type { Datos } from "./modelo";
import { ocurrenciasDelMes, partesFecha, presupuestosDelMes, proximosPagos } from "./mes";
import { resumenProyecto } from "./proyectos";
import { lemonDe, porRevisar } from "./resumen";

export interface RecordatorioDatos {
  id: string;
  emoji: string;
  titulo: string;
  texto: string;
  href: string;
  tono: "violeta" | "ambar" | "rosa" | "verde" | "azul" | "rojo";
}

const cuando = (dias: number) => (dias === 0 ? "hoy" : dias === 1 ? "mañana" : `en ${dias} días`);

export function recordatorios(datos: Datos): RecordatorioDatos[] {
  const r: RecordatorioDatos[] = [];
  const { anio, mes } = partesFecha(datos.hoy);

  const pagos = proximosPagos(datos, 3).filter((p) => p.tipo !== "corte");
  if (pagos.length) {
    const p = pagos[0];
    const otros = pagos.length - 1;
    r.push({
      id: `pago-${p.id}`,
      emoji: p.emoji,
      titulo: `${p.nombre} vence ${cuando(p.dias)}`,
      texto: `${p.monto ? formatCOP(p.monto) : "Monto variable"}${otros ? ` · y ${otros} pago${otros > 1 ? "s" : ""} más esta semana` : ""}`,
      href: p.recurrenteId ? `/movimientos/nuevo?recurrente=${p.recurrenteId}` : "/recurrentes",
      tono: p.dias === 0 ? "rojo" : "ambar",
    });
  }

  const corte = proximosPagos(datos, 5).find((p) => p.tipo === "corte");
  if (corte) r.push({ id: `corte-${corte.id}`, emoji: "✂️", titulo: `${corte.nombre} ${cuando(corte.dias)}`, texto: "Lo que compre después entra en el siguiente extracto", href: "/cuentas", tono: "azul" });

  const revisar = porRevisar(datos);
  if (revisar) r.push({ id: "revisar", emoji: "📥", titulo: `${revisar} movimientos por revisar`, texto: "Confirme categoría y bolsa para que los números cuadren", href: "/movimientos?revisar=1", tono: "violeta" });

  const lemon = lemonDe(datos);
  if (lemon.pendienteSinCorte > 0) r.push({ id: "lemon", emoji: "🍋", titulo: `Lemon le debe ${formatCOP(lemon.total)}`, texto: `${formatCOP(lemon.pendienteSinCorte)} aún sin corte: preséntelo para que le reembolsen`, href: "/lemon", tono: "ambar" });

  for (const p of datos.proyectos.filter((x) => x.activo)) {
    const res = resumenProyecto(p, datos.movimientosProyectos, datos.categorias, datos.hoy);
    if (res.estado === "planeando" && res.diasParaEmpezar !== null) {
      r.push({
        id: `proy-${p.id}`,
        emoji: p.emoji ?? "✈️",
        titulo: `${p.nombre}: faltan ${res.diasParaEmpezar} días`,
        texto: res.presupuesto !== null ? `Lleva ${formatCOP(res.gastado)} de ${formatCOP(res.presupuesto)}` : `Lleva ${formatCOP(res.gastado)} · póngale presupuesto`,
        href: `/proyectos/${p.id}`,
        tono: "rosa",
      });
    } else if (res.estado === "en_curso") {
      r.push({
        id: `proy-${p.id}`,
        emoji: p.emoji ?? "✈️",
        titulo: `${p.nombre}: día ${res.diaActual} de ${res.duracion}`,
        texto: res.porDiaDisponible !== null ? `Puede gastar ${formatCOP(res.porDiaDisponible)} por día` : `Lleva ${formatCOP(res.gastado)}`,
        href: `/proyectos/${p.id}`,
        tono: "rosa",
      });
    } else if (res.estado === "sin_fechas") {
      r.push({ id: `proy-${p.id}`, emoji: p.emoji ?? "✈️", titulo: `${p.nombre}`, texto: "Ponga fechas y presupuesto del viaje", href: `/proyectos/${p.id}`, tono: "rosa" });
    }
  }

  const pasados = presupuestosDelMes(datos, anio, mes).filter((p) => p.nivel === "excedido");
  if (pasados.length) r.push({ id: "presupuestos", emoji: "🎯", titulo: `${pasados.length} presupuesto${pasados.length > 1 ? "s" : ""} pasado${pasados.length > 1 ? "s" : ""}`, texto: pasados.map((p) => p.categoria.nombre).slice(0, 3).join(", "), href: "/presupuestos", tono: "rojo" });

  const sinMonto = ocurrenciasDelMes(datos, anio, mes).filter((o) => !o.pagado && o.montoEsperado === null);
  if (sinMonto.length) r.push({ id: "sin-monto", emoji: "🧾", titulo: `${sinMonto.length} pagos fijos sin monto`, texto: sinMonto.map((o) => o.recurrente.nombre).slice(0, 3).join(", "), href: "/recurrentes", tono: "azul" });

  if (!r.length) r.push({ id: "al-dia", emoji: "✅", titulo: "Todo al día", texto: "No hay pagos urgentes ni movimientos por revisar", href: "/reportes", tono: "verde" });
  return r;
}
