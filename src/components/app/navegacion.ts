import {
  ArrowLeftRight,
  BarChart3,
  CalendarClock,
  Citrus,
  Home,
  Landmark,
  MessageCircle,
  PiggyBank,
  Settings,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface ItemNav {
  href: string;
  titulo: string;
  icono: LucideIcon;
  /** Sub-fase en la que la pantalla queda lista (para el aviso "en construcción"). */
  subfase?: string;
}

export const NAV_PRINCIPAL: ItemNav[] = [
  { href: "/", titulo: "Inicio", icono: Home },
  { href: "/movimientos", titulo: "Movimientos", icono: ArrowLeftRight, subfase: "1b" },
  { href: "/presupuestos", titulo: "Presupuestos", icono: Target, subfase: "1c" },
  { href: "/recurrentes", titulo: "Pagos y calendario", icono: CalendarClock, subfase: "1c" },
  { href: "/lemon", titulo: "Lemon", icono: Citrus, subfase: "1d" },
];

export const NAV_SECUNDARIA: ItemNav[] = [
  { href: "/deudas", titulo: "Deudas", icono: Landmark, subfase: "1e" },
  { href: "/ahorro", titulo: "Ahorro y metas", icono: PiggyBank, subfase: "1e" },
  { href: "/reportes", titulo: "Reportes", icono: BarChart3, subfase: "1e" },
  { href: "/cuentas", titulo: "Cuentas", icono: Wallet, subfase: "1e" },
  { href: "/chat", titulo: "Chat", icono: MessageCircle, subfase: "1f" },
  { href: "/ajustes", titulo: "Ajustes", icono: Settings, subfase: "1g" },
];

export const TODAS = [...NAV_PRINCIPAL, ...NAV_SECUNDARIA];

/** Barra inferior en móvil: 4 destinos + botón central (+). */
export const NAV_MOVIL = {
  izquierda: [NAV_PRINCIPAL[0], NAV_PRINCIPAL[1]],
  derecha: [NAV_PRINCIPAL[4]],
};

export function esActivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
