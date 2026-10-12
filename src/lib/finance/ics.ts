// Genera un calendario iCalendar (RFC 5545) con los pagos fijos, deudas, tarjetas y viajes.
// Google Calendar lo lee con "Otros calendarios → Desde URL".
import { formatCOP } from "@/lib/format";

export interface FeedCalendario {
  recurrentes: { id: string; nombre: string; monto: number | null; variable: boolean; frecuencia: string; dia: number; tipo: string }[];
  deudas: { id: string; nombre: string; monto: number | null; dia: number }[];
  tarjetas: { id: string; nombre: string; corte: number | null; pago: number | null }[];
  proyectos: { id: string; nombre: string; emoji: string | null; inicio: string; fin: string | null }[];
}

const escapar = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const fechaIcs = (iso: string) => iso.replaceAll("-", "");

/** Parte líneas largas a 75 octetos como pide el estándar. */
function plegar(linea: string) {
  const bytes = new TextEncoder().encode(linea);
  if (bytes.length <= 75) return linea;
  const partes: string[] = [];
  let actual = "";
  for (const ch of linea) {
    if (new TextEncoder().encode(actual + ch).length > (partes.length ? 74 : 75)) {
      partes.push(actual);
      actual = ch;
    } else actual += ch;
  }
  partes.push(actual);
  return partes.join("\r\n ");
}

/** Primer día (≥ desde) que cae en el día del mes indicado. */
function primeraFecha(desde: string, dia: number) {
  const [a, m, d] = desde.split("-").map(Number);
  let anio = a;
  let mes = m;
  if (d > dia) {
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return `${anio}-${String(mes).padStart(2, "0")}-${String(Math.min(dia, ultimo)).padStart(2, "0")}`;
}

/** Día del mes para RRULE: el 29, 30 y 31 se pasan a "último día" para que no se salte febrero. */
const diaRegla = (dia: number) => (dia >= 29 ? "-1" : String(dia));

function regla(frecuencia: string, dia: number) {
  switch (frecuencia) {
    case "semanal":
      return "FREQ=WEEKLY";
    case "quincenal":
      return `FREQ=MONTHLY;BYMONTHDAY=${dia > 15 ? dia - 15 : dia},${dia > 15 ? diaRegla(dia) : dia + 15}`;
    case "bimestral":
      return `FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=${diaRegla(dia)}`;
    case "anual":
      return "FREQ=YEARLY";
    default:
      return `FREQ=MONTHLY;BYMONTHDAY=${diaRegla(dia)}`;
  }
}

function evento(o: { uid: string; inicio: string; fin?: string; resumen: string; descripcion?: string; rrule?: string; alarma?: boolean }, sello: string) {
  const finExclusivo = (() => {
    const d = new Date(`${o.fin ?? o.inicio}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const l = [
    "BEGIN:VEVENT",
    `UID:${o.uid}@finanzas`,
    `DTSTAMP:${sello}`,
    `DTSTART;VALUE=DATE:${fechaIcs(o.inicio)}`,
    `DTEND;VALUE=DATE:${fechaIcs(finExclusivo)}`,
    `SUMMARY:${escapar(o.resumen)}`,
    ...(o.descripcion ? [`DESCRIPTION:${escapar(o.descripcion)}`] : []),
    ...(o.rrule ? [`RRULE:${o.rrule}`] : []),
    "TRANSP:TRANSPARENT",
    ...(o.alarma ? ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapar(o.resumen)}`, "TRIGGER:-PT15H", "END:VALARM"] : []),
    "END:VEVENT",
  ];
  return l.map(plegar).join("\r\n");
}

export function generarIcs(feed: FeedCalendario, hoy: string, urlPortal: string, ahora = new Date()) {
  const sello = ahora.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ev: string[] = [];
  const monto = (m: number | null, variable = false) => (m ? `${variable ? "≈ " : ""}${formatCOP(m)}` : "monto variable");

  for (const r of feed.recurrentes) {
    ev.push(
      evento(
        {
          uid: `rec-${r.id}`,
          inicio: primeraFecha(hoy, r.dia),
          resumen: `${r.tipo === "ingreso" ? "💰" : "💸"} ${r.nombre} · ${monto(r.monto, r.variable)}`,
          descripcion: `Registrar en el portal: ${urlPortal}/movimientos/nuevo?recurrente=${r.id}`,
          rrule: regla(r.frecuencia, r.dia),
          alarma: true,
        },
        sello,
      ),
    );
  }
  for (const d of feed.deudas) {
    ev.push(evento({ uid: `deu-${d.id}`, inicio: primeraFecha(hoy, d.dia), resumen: `🤝 Pago ${d.nombre} · ${monto(d.monto)}`, descripcion: `${urlPortal}/deudas`, rrule: regla("mensual", d.dia), alarma: true }, sello));
  }
  for (const t of feed.tarjetas) {
    if (t.corte) ev.push(evento({ uid: `cor-${t.id}`, inicio: primeraFecha(hoy, t.corte), resumen: `✂️ Corte ${t.nombre}`, rrule: regla("mensual", t.corte) }, sello));
    if (t.pago) ev.push(evento({ uid: `pag-${t.id}`, inicio: primeraFecha(hoy, t.pago), resumen: `💳 Pagar ${t.nombre}`, rrule: regla("mensual", t.pago), alarma: true }, sello));
  }
  for (const p of feed.proyectos) {
    ev.push(evento({ uid: `pro-${p.id}`, inicio: p.inicio, fin: p.fin ?? p.inicio, resumen: `${p.emoji ?? "✈️"} ${p.nombre}`, descripcion: `${urlPortal}/proyectos/${p.id}` }, sello));
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Finanzas personales//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Mis pagos (Finanzas)",
    "X-WR-TIMEZONE:America/Bogota",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    ...ev,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/** Enlace "Agregar a Google Calendar" para un solo pago (no requiere conectar nada). */
export function enlaceGoogleCalendar(titulo: string, fecha: string, detalle?: string) {
  const d = fechaIcs(fecha);
  const sig = new Date(`${fecha}T00:00:00Z`);
  sig.setUTCDate(sig.getUTCDate() + 1);
  const p = new URLSearchParams({ action: "TEMPLATE", text: titulo, dates: `${d}/${fechaIcs(sig.toISOString().slice(0, 10))}`, ctz: "America/Bogota" });
  if (detalle) p.set("details", detalle);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
