"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarPlus, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renovarTokenCalendario } from "@/lib/acciones/etiquetas";

/** Suscripción del calendario de pagos en Google Calendar (feed ICS con token secreto). */
export function SincronizarCalendario({ tokenInicial }: { tokenInicial: string | null }) {
  const [token, setToken] = useState(tokenInicial);
  const [origen, setOrigen] = useState("");
  const [pendiente, iniciar] = useTransition();
  useEffect(() => setOrigen(window.location.origin), []);

  const url = token && origen ? `${origen}/cal/${token}.ics` : "";
  const google = url ? `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(url.replace(/^https?:/, "webcal:"))}` : "";

  function generar(renovar: boolean) {
    if (renovar && !confirm("El enlace anterior dejará de funcionar. ¿Continuar?")) return;
    iniciar(async () => {
      const r = await renovarTokenCalendario();
      if (!r.ok) return void toast.error(r.error);
      setToken(r.id ?? null);
      toast.success(renovar ? "Enlace renovado: vuelva a agregarlo en Google Calendar" : "Listo: ahora agréguelo a Google Calendar");
    });
  }

  if (!token)
    return (
      <div className="grid gap-3">
        <p className="text-muted-foreground text-sm">
          Vea en Google Calendar sus pagos fijos, cuotas de deudas, cortes de tarjeta y viajes. Se actualiza solo cuando cambia algo aquí.
        </p>
        <Button onClick={() => generar(false)} disabled={pendiente}>
          <CalendarPlus /> {pendiente ? "Creando…" : "Conectar con Google Calendar"}
        </Button>
      </div>
    );

  return (
    <div className="grid gap-3">
      <Button asChild disabled={!google}>
        <a href={google} target="_blank" rel="noreferrer">
          <CalendarPlus /> Agregar a Google Calendar
        </a>
      </Button>
      <div className="bg-surface flex items-center gap-2 rounded-lg p-2">
        <code className="min-w-0 flex-1 truncate text-xs">{url || "…"}</code>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Copiar enlace"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            toast.success("Enlace copiado");
          }}
        >
          <Copy />
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        Si el botón no abre la app: en Google Calendar (computador) → Otros calendarios → “+” → Desde URL → pegue el enlace. Google lo refresca cada pocas horas.
        Este enlace es privado: no lo comparta.
      </p>
      <Button variant="ghost" size="sm" className="justify-start" onClick={() => generar(true)} disabled={pendiente}>
        <RefreshCw /> Renovar enlace secreto
      </Button>
    </div>
  );
}
