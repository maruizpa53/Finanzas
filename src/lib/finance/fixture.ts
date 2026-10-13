// Datos de prueba con la estructura real (seed del usuario + movimientos ilustrativos).
// Se usan en las pruebas automáticas y en las vistas previas de diseño. Nunca en producción.

import type { Categoria, Datos, Movimiento, Recurrente } from "./modelo";
import { saldoCuenta } from "./calculos";

const cat = (id: string, nombre: string, icono: string, parent: string | null, extra: Partial<Categoria> = {}): Categoria => ({
  id,
  parent_id: parent,
  nombre,
  tipo: "gasto",
  color: null,
  icono,
  es_fijo: false,
  bolsa_default: "personal",
  beneficiario_default: null,
  orden: 0,
  activa: true,
  ...extra,
});

export const CATEGORIAS: Categoria[] = [
  cat("g-casa", "Casa", "🏠", null, { color: "#0EA5E9" }),
  cat("g-hijos", "Hijos", "🧒", null, { color: "#F59E0B" }),
  cat("g-personal", "Personal", "🙋", null, { color: "#8B5CF6" }),
  cat("g-subs", "Suscripciones", "🔁", null, { color: "#EC4899" }),
  cat("g-deudas", "Deudas y ahorro", "⚖️", null, { color: "#EF4444" }),
  cat("g-lemon", "Lemon", "🍋", null, { color: "#EAB308", bolsa_default: "lemon" }),
  cat("g-ingresos", "Ingresos", "💰", null, { tipo: "ingreso", color: "#22C55E" }),
  cat("g-transf", "Transferencias", "🔄", null, { tipo: "transferencia", color: "#6366F1" }),
  cat("c-entre", "Entre mis cuentas", "🔄", "g-transf", { tipo: "transferencia" }),
  cat("c-pago-tc", "Pago de tarjeta", "💳", "g-transf", { tipo: "transferencia" }),
  cat("c-retiro", "Retiro de efectivo", "💵", "g-transf", { tipo: "transferencia" }),
  cat("c-divisas", "Cambio de divisas", "💱", "g-transf", { tipo: "transferencia" }),
  cat("c-apto", "Cuota apartamento", "🏢", "g-casa", { es_fijo: true, beneficiario_default: "hogar" }),
  cat("c-mercado", "Mercado", "🛒", "g-casa", { beneficiario_default: "hogar" }),
  cat("c-luz", "Luz", "💡", "g-casa", { es_fijo: true, beneficiario_default: "hogar" }),
  cat("c-internet", "Internet", "📶", "g-casa", { es_fijo: true, beneficiario_default: "hogar" }),
  cat("c-pension", "Pensión colegio Matías", "🏫", "g-hijos", { es_fijo: true, beneficiario_default: "matias" }),
  cat("c-ruta", "Ruta escolar Matías", "🚌", "g-hijos", { es_fijo: true, beneficiario_default: "matias" }),
  cat("c-panales", "Pañales", "👶", "g-hijos", { es_fijo: true, beneficiario_default: "hijo_menor" }),
  cat("c-sura", "Sura plan complementario", "🩺", "g-personal", { es_fijo: true, beneficiario_default: "yo" }),
  cat("c-milo", "Milo", "🐶", "g-personal", { es_fijo: true, beneficiario_default: "milo" }),
  cat("c-rest", "Restaurantes", "🍽️", "g-personal", { beneficiario_default: "yo" }),
  cat("c-transp", "Transporte", "🚕", "g-personal", { beneficiario_default: "yo" }),
  cat("c-viajes", "Viajes", "✈️", "g-personal", { beneficiario_default: "yo" }),
  cat("c-netflix", "Netflix", "📺", "g-subs", { es_fijo: true, beneficiario_default: "hogar" }),
  cat("c-sandra", "Sandra Ballesteros", "🤝", "g-deudas", { es_fijo: true }),
  cat("c-martha", "Martha Sánchez", "🤝", "g-deudas", { es_fijo: true }),
  cat("c-cadena", "Cadena (ahorro)", "🐷", "g-deudas", { es_fijo: true }),
  cat("c-meta", "Meta – bots de WhatsApp", "🤖", "g-lemon", { bolsa_default: "lemon" }),
  cat("c-sueldo", "Sueldo Lemon", "💼", "g-ingresos", { tipo: "ingreso" }),
  cat("c-reembolso", "Reembolso Lemon", "↩️", "g-ingresos", { tipo: "ingreso", bolsa_default: "lemon" }),
];

const rec = (id: string, nombre: string, categoria_id: string, monto: number | null, extra: Partial<Recurrente> = {}): Recurrente => ({
  id,
  nombre,
  tipo: "gasto",
  categoria_id,
  cuenta_id: null,
  monto_esperado: monto,
  es_variable: false,
  frecuencia: "mensual",
  dia_pago: null,
  bolsa: "personal",
  beneficiario: null,
  activo: true,
  notas: null,
  ...extra,
});

export const RECURRENTES: Recurrente[] = [
  rec("r-apto", "Cuota apartamento", "c-apto", 1_100_588, { dia_pago: 5 }),
  rec("r-pension", "Pensión colegio Matías", "c-pension", 760_150, { dia_pago: 15 }),
  rec("r-ruta", "Ruta escolar Matías", "c-ruta", 290_000, { dia_pago: 5 }),
  rec("r-panales", "Pañales", "c-panales", 100_000, { frecuencia: "quincenal", dia_pago: 1 }),
  rec("r-onces", "Onces Matías", "c-mercado", 13_000, { frecuencia: "diaria_habil" }),
  rec("r-sura", "Sura plan complementario", "c-sura", 167_076, { dia_pago: 10 }),
  rec("r-luz", "Luz", "c-luz", null, { es_variable: true, dia_pago: 20 }),
  rec("r-internet", "Internet", "c-internet", null, { es_variable: true }),
  rec("r-netflix", "Netflix", "c-netflix", null),
  rec("r-milo", "Milo – peluquería y aseo", "c-milo", 100_000),
  rec("r-sandra", "Cuota Sandra Ballesteros", "c-sandra", 390_000, { dia_pago: 18 }),
  rec("r-martha", "Intereses Martha Sánchez", "c-martha", 165_000, { dia_pago: 25 }),
  rec("r-cadena", "Cadena", "c-cadena", 1_400_000, { dia_pago: 19 }),
];

let n = 0;
const mov = (fecha: string, descripcion: string, monto: number, categoria_id: string | null, extra: Partial<Movimiento> = {}): Movimiento => ({
  id: `m-${++n}`,
  fecha,
  descripcion,
  comercio: null,
  monto,
  tipo: "gasto",
  cuenta_id: "a-bancolombia",
  cuenta_destino_id: null,
  categoria_id,
  bolsa: "personal",
  beneficiario: null,
  origen: "manual",
  notas: null,
  reembolso_estado: null,
  lemon_settlement_id: null,
  recurring_item_id: null,
  revisado: true,
  grupo_id: null,
  moneda_original: null,
  monto_original: null,
  etiquetas: [],
  ...extra,
});

const lemon = (fecha: string, monto: number, extra: Partial<Movimiento> = {}) =>
  mov(fecha, "Meta Platforms – WhatsApp", monto, "c-meta", {
    bolsa: "lemon",
    cuenta_id: "a-nu-tc",
    comercio: "FACEBK *META",
    reembolso_estado: "pendiente",
    ...extra,
  });

export const MOVIMIENTOS: Movimiento[] = [
  // Septiembre (mes anterior)
  mov("2026-09-01", "Sueldo Lemon First", 15_000_000, "c-sueldo", { tipo: "ingreso" }),
  mov("2026-09-02", "Pañales", 100_000, "c-panales"),
  mov("2026-09-05", "Cuota apartamento", 1_100_588, "c-apto", { recurring_item_id: "r-apto" }),
  mov("2026-09-05", "Ruta escolar", 290_000, "c-ruta"),
  mov("2026-09-07", "Éxito", 380_000, "c-mercado", { comercio: "Éxito" }),
  mov("2026-09-10", "Sura", 167_076, "c-sura"),
  mov("2026-09-12", "Crepes & Waffles", 145_000, "c-rest", { comercio: "Crepes & Waffles" }),
  mov("2026-09-15", "Pensión colegio", 760_150, "c-pension"),
  mov("2026-09-16", "Pañales", 100_000, "c-panales"),
  mov("2026-09-18", "Cuota Sandra", 390_000, "c-sandra"),
  mov("2026-09-19", "Cadena", 1_400_000, "c-cadena"),
  mov("2026-09-20", "Enel – luz", 182_000, "c-luz", { comercio: "Enel" }),
  mov("2026-09-21", "Carulla", 420_000, "c-mercado", { comercio: "Carulla" }),
  mov("2026-09-22", "Internet ETB", 115_000, "c-internet", { comercio: "ETB" }),
  mov("2026-09-25", "Intereses Martha", 165_000, "c-martha"),
  // Octubre (mes actual en las pruebas: hoy = 2026-10-12)
  mov("2026-10-01", "Sueldo Lemon First", 15_000_000, "c-sueldo", { tipo: "ingreso" }),
  mov("2026-10-01", "Pañales", 100_000, "c-panales"),
  mov("2026-10-03", "D1", 210_000, "c-mercado", { comercio: "D1" }),
  mov("2026-10-05", "Cuota apartamento", 1_100_588, "c-apto"),
  mov("2026-10-05", "Ruta escolar", 290_000, "c-ruta"),
  mov("2026-10-06", "Uber", 38_000, "c-transp", { comercio: "Uber" }),
  mov("2026-10-08", "Éxito", 465_000, "c-mercado", { comercio: "Éxito" }),
  mov("2026-10-09", "Andrés Carne de Res", 320_000, "c-rest", { comercio: "Andrés Carne de Res" }),
  mov("2026-10-10", "Sura", 167_076, "c-sura"),
  mov("2026-10-11", "Rappi – almuerzo", 45_000, "c-rest", { comercio: "Rappi", cuenta_id: "a-nequi", revisado: false }),
  mov("2026-10-11", "Pago tarjeta Nu", 1_200_000, null, { tipo: "pago_tarjeta", cuenta_destino_id: "a-nu-tc" }),
  mov("2026-10-12", "Transferencia a Nequi", 300_000, null, { tipo: "transferencia", cuenta_destino_id: "a-nequi" }),
  lemon("2026-09-28", 820_000),
  lemon("2026-10-04", 380_000),
  lemon("2026-10-09", 480_000),
];

/** Gastos del viaje a Corea (solo para la vista del proyecto; no alteran los totales de las pruebas). */
export const MOVIMIENTOS_COREA: Movimiento[] = [
  mov("2026-08-20", "Tiquetes Bogotá – Seúl", 6_800_000, "c-viajes", { comercio: "Avianca", cuenta_id: "a-nu-tc", etiquetas: ["t-corea", "t-mio"] }),
  mov("2026-09-14", "Boletas partido", 1_250_000, "c-viajes", { comercio: "FIFA", cuenta_id: "a-nu-tc", etiquetas: ["t-corea"], moneda_original: "USD", monto_original: 300 }),
  mov("2026-10-02", "Hotel Seúl (anticipo)", 1_900_000, "c-viajes", { comercio: "Booking", cuenta_id: "a-nu-tc", etiquetas: ["t-corea"] }),
];

export const DATOS_EJEMPLO: Datos = {
  hoy: "2026-10-12",
  cuentas: [
    { id: "a-bancolombia", nombre: "Bancolombia", institucion: "Bancolombia", tipo: "debito", ultimos4: null, cupo: null, dia_corte: null, dia_pago: null, saldo_inicial: 4_200_000, saldo_inicial_fecha: "2026-09-01", color: "#FDDA24", orden: 1, activa: true },
    { id: "a-nu-tc", nombre: "Nu tarjeta de crédito", institucion: "Nu", tipo: "credito", ultimos4: "3688", cupo: 8_000_000, dia_corte: 15, dia_pago: null, saldo_inicial: 0, saldo_inicial_fecha: "2026-09-01", color: "#820AD1", orden: 3, activa: true },
    { id: "a-nequi", nombre: "Nequi", institucion: "Bancolombia", tipo: "billetera", ultimos4: null, cupo: null, dia_corte: null, dia_pago: null, saldo_inicial: 150_000, saldo_inicial_fecha: "2026-09-01", color: "#DA0081", orden: 5, activa: true },
    { id: "a-efectivo", nombre: "Efectivo", institucion: null, tipo: "efectivo", ultimos4: null, cupo: null, dia_corte: null, dia_pago: null, saldo_inicial: 80_000, saldo_inicial_fecha: "2026-09-01", color: "#16A34A", orden: 9, activa: true },
  ],
  categorias: CATEGORIAS,
  movimientos: MOVIMIENTOS,
  recurrentes: RECURRENTES,
  presupuestos: [
    { id: "p-mercado", categoria_id: "c-mercado", mes: null, monto: 1_000_000, monto_diario_habil: 13_000 },
    { id: "p-rest", categoria_id: "c-rest", mes: null, monto: 600_000, monto_diario_habil: 0 },
    { id: "p-milo", categoria_id: "c-milo", mes: null, monto: 100_000, monto_diario_habil: 0 },
    { id: "p-panales", categoria_id: "c-panales", mes: null, monto: 200_000, monto_diario_habil: 0 },
  ],
  deudas: [
    { id: "d-sandra", acreedor: "Sandra Ballesteros", monto_original: null, saldo_inicial: 1_170_000, saldo_fecha: "2026-10-11", cuota: 390_000, tasa_mensual: null, interes_mensual: null, solo_intereses: false, dia_pago: 18, categoria_id: "c-sandra", estado: "activa", notas: null },
    { id: "d-martha", acreedor: "Martha Sánchez", monto_original: 5_500_000, saldo_inicial: 5_500_000, saldo_fecha: "2026-10-11", cuota: 165_000, tasa_mensual: 0.03, interes_mensual: 165_000, solo_intereses: true, dia_pago: 25, categoria_id: "c-martha", estado: "activa", notas: null },
    { id: "d-giovanni", acreedor: "Giovanni García", monto_original: null, saldo_inicial: 1_500_000, saldo_fecha: "2026-10-11", cuota: null, tasa_mensual: null, interes_mensual: null, solo_intereses: false, dia_pago: null, categoria_id: null, estado: "activa", notas: "Saldo aproximado." },
  ],
  pagosDeuda: [],
  cortes: [
    { id: "corte-junio", fecha_corte: "2026-06-30", periodo_desde: null, periodo_hasta: null, monto_presentado: null, monto_reembolsado: 0, fecha_reembolso: null, estado: "presentado", notas: "Por confirmar" },
  ],
  ingresos: [
    { id: "i-sueldo", nombre: "Sueldo Lemon First", tipo: "sueldo", monto_esperado: 15_000_000, es_variable: false, frecuencia: "mensual", dia_pago: 1, activa: true },
    { id: "i-freelance", nombre: "Trabajos freelance", tipo: "freelance", monto_esperado: null, es_variable: true, frecuencia: "mensual", dia_pago: null, activa: true },
  ],
  ahorros: [
    { id: "s-cadena", nombre: "Cadena", tipo: "programado", aporte_mensual: 1_400_000, meta_monto: null, acumulado_inicial: 0, fecha_inicio: null, fecha_entrega: null, dia_aporte: 19, organizador: "Mamá", categoria_id: "c-cadena", notas: null },
  ],
  aportes: [],
  gastosLemon: [],
  saldos: {},
  etiquetas: [
    { id: "t-mio", nombre: "Mío", grupo: "Para quién", descripcion: null, emoji: "🙋", color: "#6366F1", orden: 1, activa: true },
    { id: "t-familia", nombre: "Familia", grupo: "Para quién", descripcion: null, emoji: "👨‍👩‍👦", color: "#F59E0B", orden: 2, activa: true },
    { id: "t-carro", nombre: "Carro", grupo: "Actividad", descripcion: null, emoji: "🚗", color: "#0EA5E9", orden: 3, activa: true },
    { id: "t-billar", nombre: "Billar", grupo: "Actividad", descripcion: null, emoji: "🎱", color: "#16A34A", orden: 4, activa: true },
    { id: "t-torneos", nombre: "Torneos", grupo: "Actividad", descripcion: null, emoji: "🏆", color: "#EAB308", orden: 5, activa: true },
    { id: "t-necesario", nombre: "Necesario", grupo: "Tipo de gasto", descripcion: "Necesidad (regla 50/30/20)", emoji: "✅", color: "#22C55E", orden: 30, activa: true },
    { id: "t-gusto", nombre: "Gusto", grupo: "Tipo de gasto", descripcion: null, emoji: "🎈", color: "#F472B6", orden: 31, activa: true },
    { id: "t-reembolsable", nombre: "Reembolsable", grupo: "Seguimiento", descripcion: null, emoji: "🔁", color: "#0EA5E9", orden: 40, activa: true },
    { id: "t-corea", nombre: "Corea – World Cup", grupo: "Viajes y proyectos", descripcion: null, emoji: "🇰🇷", color: "#E11D48", orden: 6, activa: true },
  ],
  proyectos: [
    { id: "pr-corea", nombre: "World Cup Corea", emoji: "🇰🇷", tag_id: "t-corea", presupuesto: 18_000_000, fecha_inicio: "2026-11-20", fecha_fin: "2026-12-05", moneda: "KRW", tasa_cambio: 2.95, notas: null, activo: true },
  ],
  movimientosProyectos: [],
};
DATOS_EJEMPLO.movimientosProyectos = MOVIMIENTOS_COREA;
DATOS_EJEMPLO.gastosLemon = MOVIMIENTOS.filter((m) => m.bolsa === "lemon");
DATOS_EJEMPLO.saldos = Object.fromEntries(
  DATOS_EJEMPLO.cuentas.map((c) => [c.id, saldoCuenta(c.saldo_inicial, MOVIMIENTOS.filter((m) => m.fecha >= c.saldo_inicial_fecha), c.id)]),
);
