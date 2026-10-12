import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Monto en pesos con números tabulares. Respeta el modo discreto (clase .discreto en <html>).
 * Es un componente de servidor: no necesita estado.
 */
export function Monto({
  valor,
  signo = false,
  className,
}: {
  valor: number;
  /** Mostrar "+" en positivos (útil para ingresos). */
  signo?: boolean;
  className?: string;
}) {
  const texto = signo && valor > 0 ? `+${formatCOP(valor)}` : formatCOP(valor);
  return (
    <span className={cn("monto whitespace-nowrap", className)}>
      <span>{texto}</span>
    </span>
  );
}
