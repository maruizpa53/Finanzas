"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cambiarContrasena, type CambioState } from "./actions";

const inicial: CambioState = { error: null, ok: false };

export function CambioContrasenaForm() {
  const [estado, accion, pendiente] = useActionState(cambiarContrasena, inicial);

  return (
    <form action={accion} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="actual">Contraseña actual</Label>
        <Input id="actual" name="actual" type="password" autoComplete="current-password" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="nueva">Nueva contraseña</Label>
        <Input id="nueva" name="nueva" type="password" autoComplete="new-password" minLength={12} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmacion">Repita la nueva contraseña</Label>
        <Input id="confirmacion" name="confirmacion" type="password" autoComplete="new-password" minLength={12} required />
      </div>
      {estado.error && <p role="alert" className="text-destructive text-sm">{estado.error}</p>}
      {estado.ok && <p className="text-positive text-sm">Contraseña cambiada.</p>}
      <Button type="submit" disabled={pendiente}>
        {pendiente ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
