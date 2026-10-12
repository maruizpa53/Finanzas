import { Wallet } from "lucide-react";

/** Preloader entre pantallas: logo que late, barra de progreso y esqueletos con brillo. */
export default function Cargando() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-entrada">
      <span className="sr-only">Cargando…</span>
      <div className="mb-6 flex items-center gap-3">
        <span className="bg-primary text-primary-foreground animate-latido flex size-10 items-center justify-center rounded-xl shadow-lg">
          <Wallet className="size-5" />
        </span>
        <div className="grid flex-1 gap-2">
          <div className="esqueleto h-5 w-40" />
          <div className="barra-progreso bg-muted relative h-1 w-full max-w-60 overflow-hidden rounded-full" />
        </div>
      </div>
      <div className="esqueleto mb-4 h-16 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="esqueleto h-64 rounded-3xl lg:col-span-2" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <div className="esqueleto h-24 rounded-2xl" />
          <div className="esqueleto h-24 rounded-2xl" />
          <div className="esqueleto h-24 rounded-2xl" />
          <div className="esqueleto h-24 rounded-2xl" />
        </div>
        <div className="esqueleto h-48 rounded-2xl lg:col-span-2" />
        <div className="esqueleto h-48 rounded-2xl" />
      </div>
    </div>
  );
}
