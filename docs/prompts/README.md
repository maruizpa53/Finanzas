# Plan maestro – Portal de Finanzas Personales

Hoja de ruta completa del portal. Cada fase tiene su prompt detallado para Claude Code.

| Fase | Prompt | Objetivo | Estado |
| --- | --- | --- | --- |
| 0 – Base | (documento original en Google Docs) | Esquema, seguridad, login, seed, despliegue | ✅ Terminada |
| 1 – Producto de clase mundial | [fase-1-prompt.md](fase-1-prompt.md) | Diseño premium, registro en 3 toques, Lemon, presupuestos, recurrentes, dashboard, chat, PWA | Por aprobar |
| 2 – Importación inteligente | [fase-2-prompt.md](fase-2-prompt.md) | Extractos de los 6 bancos sin duplicados y auto-categorizados | Por aprobar |
| 3 – Reportes, alertas y metas | [fase-3-prompt.md](fase-3-prompt.md) | Informes PDF/Excel, alertas por correo, metas, patrimonio, 2FA | Por aprobar |

## Orden de trabajo

```
Fase 1:  1a Diseño → 1b Registro → 1c Recurrentes/Presupuestos → 1d Lemon → 1e Inicio/Reportes → 1f Chat → 1g PWA
Fase 2:  2a Infraestructura → 2b Primer banco → 2c Categorización IA → 2d Nu → 2e Resto de bancos → 2f Respaldo IA PDF
Fase 3:  3a Informe mensual → 3b Exportaciones → 3c Alertas → 3d Metas/Patrimonio → 3e Anual/Deudas → 3f 2FA y pulido
```

Cada sub-fase termina con: pruebas en verde → despliegue en Vercel → explicación sencilla de qué quedó y cómo
probarlo → aprobación para seguir.

## Lo que se necesita del dueño, por fase

| Momento | Qué |
| --- | --- |
| Antes de 1a | Elegir una de las 2–3 propuestas visuales del Inicio |
| Antes de 1f (chat) | API key de Anthropic, cargada directamente en Vercel |
| Durante la Fase 1 | Datos pendientes: tarjeta de la esposa, cupo y pago de la Nu, corte de junio con Lemon, suscripciones, saldos actuales |
| Antes de cada banco (Fase 2) | Un extracto real de muestra de ese banco |
| Antes de 3c | Aprobar Resend (gratis) desde el Vercel Marketplace |
| Antes de 3a / 3.4 | Datos para la cuenta de cobro de Lemon |

## Reglas que aplican a todas las fases

- Español de Colombia, montos `$1.234.567`, fechas `dd/mm/aaaa`, zona `America/Bogota`.
- Toda la lógica de dinero vive en `src/lib/finance` y tiene pruebas.
- RLS en todo; ningún secreto en el cliente ni en el repositorio; advisors de Supabase en cero al cerrar cada fase.
- Commits pequeños, con `user.email = maruizpa53@gmail.com`.
- No inventar montos: preguntar.
