// Festivos de Colombia (Ley 51 de 1983, "Ley Emiliani") y días hábiles.
// Todas las fechas se manejan como "aaaa-mm-dd" y se calculan en UTC para evitar
// corrimientos por zona horaria.

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function utc(anio: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function sumarDias(d: Date, dias: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + dias);
  return r;
}

/** Traslada al lunes siguiente si no cae en lunes. */
function siguienteLunes(d: Date): Date {
  const dow = d.getUTCDay(); // 0 domingo … 6 sábado
  if (dow === 1) return d;
  return sumarDias(d, (8 - dow) % 7);
}

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher, calendario gregoriano). */
export function domingoDePascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(anio, mes, dia);
}

const cache = new Map<number, Set<string>>();

/** Festivos de Colombia del año, como "aaaa-mm-dd". */
export function festivosColombia(anio: number): Set<string> {
  const enCache = cache.get(anio);
  if (enCache) return enCache;

  const pascua = domingoDePascua(anio);
  const fechas: Date[] = [
    // Fijos
    utc(anio, 1, 1),
    utc(anio, 5, 1),
    utc(anio, 7, 20),
    utc(anio, 8, 7),
    utc(anio, 12, 8),
    utc(anio, 12, 25),
    // Trasladables al lunes
    siguienteLunes(utc(anio, 1, 6)),
    siguienteLunes(utc(anio, 3, 19)),
    siguienteLunes(utc(anio, 6, 29)),
    siguienteLunes(utc(anio, 8, 15)),
    siguienteLunes(utc(anio, 10, 12)),
    siguienteLunes(utc(anio, 11, 1)),
    siguienteLunes(utc(anio, 11, 11)),
    // Según la Pascua
    sumarDias(pascua, -3), // Jueves Santo
    sumarDias(pascua, -2), // Viernes Santo
    sumarDias(pascua, 43), // Ascensión (lunes)
    sumarDias(pascua, 64), // Corpus Christi (lunes)
    sumarDias(pascua, 71), // Sagrado Corazón (lunes)
  ];

  const set = new Set(fechas.map(iso));
  cache.set(anio, set);
  return set;
}

export function esFestivo(fecha: string): boolean {
  return festivosColombia(Number(fecha.slice(0, 4))).has(fecha);
}

/** Lunes a viernes que no son festivo. */
export function esDiaHabil(fecha: string): boolean {
  const [a, m, d] = fecha.split("-").map(Number);
  const dow = utc(a, m, d).getUTCDay();
  return dow !== 0 && dow !== 6 && !esFestivo(fecha);
}

export function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/** Días hábiles del mes (1-12), opcionalmente solo hasta un día dado (incluido). */
export function diasHabilesDelMes(anio: number, mes: number, hastaDia?: number): number {
  const ultimo = Math.min(hastaDia ?? diasDelMes(anio, mes), diasDelMes(anio, mes));
  let total = 0;
  for (let dia = 1; dia <= ultimo; dia++) {
    if (esDiaHabil(iso(utc(anio, mes, dia)))) total++;
  }
  return total;
}
