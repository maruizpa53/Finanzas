"use server";

import { createClient } from "@/lib/supabase/server";

export type CambioState = { error: string | null; ok: boolean };

export async function cambiarContrasena(_prev: CambioState, formData: FormData): Promise<CambioState> {
  const actual = String(formData.get("actual") ?? "");
  const nueva = String(formData.get("nueva") ?? "");
  const confirmacion = String(formData.get("confirmacion") ?? "");

  if (nueva.length < 12) return { error: "La nueva contraseña debe tener al menos 12 caracteres.", ok: false };
  if (nueva !== confirmacion) return { error: "Las contraseñas nuevas no coinciden.", ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Su sesión expiró. Vuelva a entrar.", ok: false };

  // Verificar la contraseña actual antes de cambiarla.
  const { error: errorActual } = await supabase.auth.signInWithPassword({ email: user.email, password: actual });
  if (errorActual) return { error: "La contraseña actual no es correcta.", ok: false };

  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) return { error: "No se pudo cambiar la contraseña. Intente de nuevo.", ok: false };

  return { error: null, ok: true };
}
