"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const CLAVE = "finanzas:discreto";

/** Script que aplica el modo discreto antes de pintar (evita ver montos un instante). */
export const scriptDiscreto = `try{if(localStorage.getItem("${CLAVE}")==="1")document.documentElement.classList.add("discreto")}catch(e){}`;

export function BotonDiscreto() {
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    setActivo(document.documentElement.classList.contains("discreto"));
  }, []);

  function alternar() {
    const nuevo = !activo;
    document.documentElement.classList.toggle("discreto", nuevo);
    try {
      localStorage.setItem(CLAVE, nuevo ? "1" : "0");
    } catch {}
    setActivo(nuevo);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={alternar}
      aria-pressed={activo}
      aria-label={activo ? "Mostrar montos" : "Ocultar montos"}
      title={activo ? "Mostrar montos" : "Ocultar montos"}
    >
      {activo ? <EyeOff /> : <Eye />}
    </Button>
  );
}
