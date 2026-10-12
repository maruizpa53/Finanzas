// Datos de EJEMPLO para comparar propuestas visuales del Inicio (sub-fase 1a).
// Montos fijos tomados del seed real; gastos variables y Lemon son ilustrativos.

export interface PagoProximo {
  nombre: string;
  fecha: string; // aaaa-mm-dd
  dias: number;
  monto: number | null;
  emoji: string;
  tipo: "fijo" | "tarjeta" | "deuda" | "ahorro";
}

export interface PresupuestoRiesgo {
  nombre: string;
  emoji: string;
  gastado: number;
  presupuesto: number;
}

export interface ResumenInicio {
  hoy: string;
  diaDelMes: number;
  diasDelMes: number;
  ingresoEsperado: number;
  plan: { fijos: number; ahorro: number; deudas: number; gastadoVariable: number };
  disponible: number;
  diasRestantes: number;
  porDia: number;
  lemon: { total: number; pendienteSinCorte: number; presentadoSinPagar: number; diasDesdeCorte: number };
  gastoPersonal: number;
  gastoPersonalMesAnterior: number;
  tasaAhorroProyectada: number;
  deudaTotal: number;
  porRevisar: number;
  acumulado: { dia: number; esteMes: number | null; mesAnterior: number }[];
  proximos: PagoProximo[];
  enRiesgo: PresupuestoRiesgo[];
}

const mesAnterior = [
  0, 1_850_000, 1_990_000, 2_120_000, 2_380_000, 2_460_000, 2_700_000, 2_910_000, 3_050_000, 3_220_000,
  3_480_000, 4_100_000, 4_380_000, 4_520_000, 5_640_000, 5_810_000, 5_990_000, 6_120_000, 6_510_000,
  6_700_000, 6_880_000, 7_020_000, 7_250_000, 7_410_000, 7_690_000, 7_880_000, 8_020_000, 8_240_000,
  8_390_000, 8_560_000, 8_710_000,
];
const esteMes = [
  0, 1_920_000, 2_310_000, 2_410_000, 2_690_000, 2_840_000, 3_160_000, 3_420_000, 4_480_000, 4_710_000,
  5_120_000, 5_640_000, 6_050_000,
];

export const EJEMPLO: ResumenInicio = {
  hoy: "2026-10-12",
  diaDelMes: 12,
  diasDelMes: 31,
  ingresoEsperado: 15_000_000,
  plan: { fijos: 3_640_814, ahorro: 1_400_000, deudas: 555_000, gastadoVariable: 3_250_000 },
  disponible: 6_154_186,
  diasRestantes: 20,
  porDia: 307_709,
  lemon: { total: 2_480_000, pendienteSinCorte: 1_680_000, presentadoSinPagar: 800_000, diasDesdeCorte: 104 },
  gastoPersonal: 6_050_000,
  gastoPersonalMesAnterior: 5_400_000,
  tasaAhorroProyectada: 0.24,
  deudaTotal: 8_170_000,
  porRevisar: 7,
  acumulado: Array.from({ length: 31 }, (_, i) => ({
    dia: i + 1,
    esteMes: i < esteMes.length - 1 ? esteMes[i + 1] : null,
    mesAnterior: mesAnterior[i + 1] ?? mesAnterior[mesAnterior.length - 1],
  })),
  proximos: [
    { nombre: "Pensión colegio Matías", fecha: "2026-10-15", dias: 3, monto: 760_150, emoji: "🏫", tipo: "fijo" },
    { nombre: "Corte tarjeta Nu ···3688", fecha: "2026-10-15", dias: 3, monto: null, emoji: "💳", tipo: "tarjeta" },
    { nombre: "Pañales", fecha: "2026-10-15", dias: 3, monto: 100_000, emoji: "👶", tipo: "fijo" },
    { nombre: "Cuota Sandra Ballesteros", fecha: "2026-10-18", dias: 6, monto: 390_000, emoji: "🤝", tipo: "deuda" },
    { nombre: "Cadena", fecha: "2026-10-19", dias: 7, monto: 1_400_000, emoji: "🐷", tipo: "ahorro" },
  ],
  enRiesgo: [
    { nombre: "Restaurantes", emoji: "🍽️", gastado: 520_000, presupuesto: 600_000 },
    { nombre: "Mercado", emoji: "🛒", gastado: 1_010_000, presupuesto: 1_273_000 },
  ],
};
