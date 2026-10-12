# Prompt Fase 1 – Portal de Finanzas Personales de clase mundial

> Prompt para Claude Code. Se ejecuta sobre el repositorio `maruizpa53/Finanzas`, que ya tiene la Fase 0 terminada.
> Preparado a partir de una revisión de los mejores portales de finanzas personales (Copilot Money, Monarch Money,
> YNAB, Lunch Money, Emma, Simple/Monzo) y de buenas prácticas de UX fintech y de dashboards.

---

## 1. Rol

Actúa como **equipo de producto completo**: diseñador de producto senior (nivel Copilot Money / Mercury),
ingeniero full-stack senior en Next.js + Supabase y asesor financiero personal. El objetivo de esta fase **no es
"agregar pantallas"**, es que el portal se sienta como un producto premium que da gusto abrir todos los días.
Háblame siempre en español. Antes de escribir código de cada sub-fase, preséntame un plan corto y espera mi
aprobación. No inventes montos ni datos: pregúntame.

## 2. Punto de partida (ya existe; no rehacer)

- Next.js 15 (App Router) + TypeScript, Tailwind v4, shadcn/ui (escrito a mano: `ui.shadcn.com` está bloqueado
  en el entorno de desarrollo, así que los componentes se copian manualmente), lucide-react, Vitest.
- Supabase `finanzas-personales` (`hcaaoyxndonryheodzfu`) con el esquema completo, RLS, bucket privado
  `extractos`, trigger de usuario único y seed cargado (9 cuentas, 52 categorías, 21 recurrentes, 7 presupuestos,
  3 deudas, Cadena, ingresos, corte Lemon de junio).
- Vercel: proyecto `finanzas` → https://finanzas-ten-gray.vercel.app (cada push a la rama de producción despliega).
- Librería de cálculos probada en `src/lib/finance/calculos.ts` y `dias-habiles.ts` (saldos, resumen del mes,
  presupuestos con días hábiles, proyección, Lemon me debe, equivalente mensual). **Reutilizarla; no duplicar
  lógica de dinero en componentes.**
- Login con contraseña, página "Mi cuenta" e inicio básico.

## 3. Lo que tomamos de los mejores (referentes)

| Referente | Qué lo hace el mejor | Qué adoptamos aquí |
| --- | --- | --- |
| **Copilot Money** (finalista Apple Design Award, Editor's Choice) | Interfaz limpia que premia revisar a diario; categorización que aprende de las correcciones; recurrentes con "pagado / falta por pagar"; categorías con color y emoji; ritmo (pacing) del presupuesto | Bandeja de **"Por revisar"**; recurrentes con estado pagado/pendiente del mes; categorías personalizables con color + emoji; barras de presupuesto con marca del "ritmo ideal" según el día del mes |
| **Monarch Money** | Flujo de caja con **diagrama Sankey** (ingresos → grupos → categorías); calendario de recurrentes; etiquetas "mío / tuyo / nuestro" para hogares; pronóstico de presupuesto; metas | Sankey de ingresos → bolsas → grupos; **calendario de pagos**; nuestras **bolsas** (personal, Lemon, freelance) y **beneficiarios** como equivalente de "mine/yours/ours"; proyección de cierre de mes; metas de ahorro |
| **YNAB** | Cada peso tiene un trabajo; educación financiera | Vista de **"Plan del mes"**: ingreso esperado − fijos − ahorro − deudas = disponible para variables |
| **Lunch Money** | Motor de reglas con prioridades; al corregir un movimiento pregunta "¿aplicar a los similares?"; revisado vs. no revisado | Reglas con prioridad y origen (manual/aprendida); diálogo **"¿Aplicar a movimientos similares y crear regla?"** |
| **Simple / Monzo** | **"Seguro para gastar" / "Te queda para gastar"** | KPI héroe **"Disponible para gastar"**, cuidando los errores conocidos de Monzo: no contar dos veces transferencias y no tratar anuales como mensuales |
| **Emma** | Detección de suscripciones y gastos "desperdiciados" | Panel de **suscripciones** con total mensual/anual y alerta de aumentos de precio |
| **Mercury** (banca) | Estética sobria, tipografía impecable, números tabulares | Sistema visual (sección 5) |

## 4. Principios de diseño (no negociables)

1. **Una pregunta por pantalla.** Inicio responde "¿cómo voy este mes y cuánto puedo gastar?". Lemon responde
   "¿cuánto me debe Lemon?". No mezclar.
2. **Jerarquía clara:** un número héroe por vista, de 2 a 4 KPIs secundarios y luego el detalle. Los números
   importantes son grandes; las etiquetas, pequeñas y en gris.
3. **Mobile-first real (iPhone):** navegación inferior con pulgar, hojas que suben desde abajo (bottom sheets) en
   lugar de modales, zonas táctiles ≥ 44 px y respeto de `safe-area-inset-*`. En escritorio: barra lateral y
   rejilla de 12 columnas que aprovecha el ancho.
4. **Transparencia:** cada KPI calculado tiene un ícono (i) que explica la fórmula en una línea ("Disponible =
   ingreso esperado − fijos pendientes − ahorro − cuotas − gastado"). Las proyecciones dicen que lo son.
5. **Estados vacíos útiles:** explican qué pasa, tranquilizan si no hay nada malo y ofrecen una acción solo si
   existe ("Aún no registras gastos de Lemon este mes. Todo al día ✓").
6. **Velocidad percibida:** Server Components para leer, actualizaciones optimistas al registrar, skeletons (nunca
   spinners de página completa) y transiciones de 150–250 ms.
7. **Privacidad:** **modo discreto** (ojo en la barra superior) que cambia todos los montos por `$•••••`, útil
   para abrir el portal en público. Se recuerda por dispositivo.
8. **Accesibilidad WCAG 2.2 AA:** contraste ≥ 4.5:1, foco visible, el color nunca es la única señal (ícono +
   texto en alertas) y gráficos con tabla equivalente accesible.

## 5. Sistema visual

- **Tipografía:** Geist Sans (UI) y Geist Mono solo para referencias, cargadas con `next/font` (en Vercel funciona;
  si el entorno local bloquea Google Fonts, usar `next/font/local` con los archivos del paquete `geist`). **Todos los
  números con `tabular-nums`** para que las columnas de montos alineen.
- **Escala:** número héroe 40/48 px semibold con tracking −0.02em; KPI 24–28 px; cuerpo 14–15 px; etiquetas 12 px.
- **Color, con tokens semánticos** (claro y oscuro desde el día 1):
  - Base neutra fría (fondos `zinc/slate`), acento índigo profundo para la marca.
  - Semánticos: `positive` (verde, ingresos y bajo presupuesto), `warning` (ámbar, ≥ 80 %), `negative` (rojo,
    excedido y deuda), `lemon` (amarillo limón exclusivo de la bolsa Lemon), `freelance` (teal).
  - Gastos **no** en rojo por defecto (gastar es normal); el rojo solo para excesos y alertas.
- **Superficies:** tarjetas con borde sutil y sombra mínima; radio 12–16 px; en oscuro, superficies escalonadas
  en lugar de sombras.
- **Iconos:** lucide; las categorías usan **emoji + color** editable (como Copilot).
- **Movimiento:** `motion` solo para la entrada de hojas, el contador animado del número héroe y la reordenación de
  listas. Respetar `prefers-reduced-motion`.
- **Componentes shadcn a agregar:** sheet, drawer (vaul), dialog, tabs, select, command (buscador ⌘K), popover,
  calendar, toggle-group, progress, tooltip, skeleton, badge, sonner (toasts), dropdown-menu, chart.
- **Gráficos:** shadcn/ui Charts (Recharts) con los mismos tokens; Sankey con `recharts` (`Sankey`). Ejes y
  cuadrículas casi invisibles, tooltips con el formato $1.234.567 y leyendas directas sobre la serie cuando sea
  posible. Línea/área para tendencias; barras para comparar categorías; nada de tortas de más de 5 porciones
  (usar barras horizontales).

## 6. Arquitectura de información

**Móvil, barra inferior:** Inicio · Movimientos · **(+)** botón central · Lemon · Más.
**Escritorio, barra lateral:** Inicio, Movimientos, Presupuestos, Recurrentes y calendario, Lemon, Deudas, Ahorro,
Reportes, Cuentas, Chat, Ajustes. Buscador global **⌘K** (movimientos, categorías, acciones como "registrar gasto").
**Chat:** botón flotante en todas las pantallas que abre un panel lateral en escritorio o una hoja completa en móvil.

## 7. Pantallas y contenido

### 7.1 Inicio
- **Héroe: "Disponible para gastar"** este mes = ingreso esperado del mes − fijos aún no pagados − aportes de ahorro
  pendientes − cuotas de deuda pendientes − gasto personal variable ya hecho. Debajo: **"$X por día"** = disponible
  ÷ días restantes. Las transferencias y los pagos de tarjeta se excluyen. Los anuales se prorratean. Probar con
  casos de borde.
- KPIs: **Lemon me debe** · **Gasto personal del mes vs. mes anterior** · **Tasa de ahorro** · **Deuda total**.
- **Próximos 7 días:** pagos con días restantes y monto (servicios, cuotas, suscripciones, tarjetas, Cadena).
- **Presupuestos en riesgo:** solo los que van ≥ 80 % o por encima del ritmo ideal.
- **Por revisar (N):** movimientos nuevos sin categoría o sin bolsa confirmada.
- Mini gráfico: gasto acumulado del mes vs. el mismo día del mes pasado (línea).

### 7.2 Registro rápido (botón +) – meta: **3 toques**
- Hoja inferior con teclado numérico propio y montos grandes. Atajos: "000", y una vista previa que formatea en
  vivo ($45.000).
- Rejilla de las 8 categorías más usadas (emoji + nombre) y "más…" para buscar.
- Chips de **cuenta** y **bolsa** con el último valor usado (de `user_settings`). Lemon resaltado en amarillo.
- Tipo: gasto / ingreso / transferencia / pago de tarjeta (pagar la tarjeta = transferencia, nunca gasto).
- Fecha (hoy por defecto), nota y beneficiario (sugerido por la categoría).
- Al guardar: toast "Guardado · Deshacer" (10 s) y actualización optimista. Si coincide con un recurrente del mes,
  preguntar "¿Marcar *Cuota apartamento* como pagada?".

### 7.3 Movimientos
- Lista agrupada por día con el total diario; cada fila muestra emoji de categoría, comercio/descripción, cuenta,
  chip de bolsa y monto.
- Filtros en chips: mes / rango, cuenta, categoría, bolsa, beneficiario, tipo y "por revisar". Búsqueda por
  texto y monto.
- Edición en hoja lateral. Al cambiar categoría o bolsa: **"¿Aplicar a N movimientos similares y crear regla?"**
  (regla con origen `aprendida`).
- Acciones masivas: recategorizar, cambiar bolsa, marcar revisado.

### 7.4 Presupuestos
- Por grupo y categoría: barra con lo gastado, **marca vertical del ritmo ideal** (día del mes / días del mes) y
  proyección al cierre. Colores: ok / ≥ 80 % / excedido.
- Mercado = $1.000.000 + $13.000 × días hábiles; mostrar el desglose.
- Editar el monto del mes o el monto por defecto; copiar del mes anterior.

### 7.5 Recurrentes y calendario
- Calendario mensual con los pagos del mes (estilo Monarch); lista "Pagados / Faltan" con total pendiente (estilo
  Copilot).
- Generación de `recurring_occurrences` por período (mensual, quincenal, diaria hábil, bimestral, anual) con un
  job idempotente; al registrar la transacción se vinculan y quedan pagadas.
- Variables (luz, gas, internet, Claro, acueducto): el monto esperado = promedio de los últimos 3 pagos reales
  cuando existan.
- **Suscripciones:** total mensual y anual, y alerta si el cargo sube respecto al anterior.

### 7.6 Lemon (módulo central)
- Héroe **"Lemon me debe"**, con el desglose: pendiente sin corte + presentado sin pagar.
- Lista de gastos pendientes (fecha, concepto, tarjeta ···4 dígitos y monto) con selección.
- **Crear corte** (asistente de 3 pasos): seleccionar gastos → revisar total → generar cuenta de cobro. Los gastos
  pasan a "presentado".
- **Registrar reembolso**, total o parcial; los gastos quedan "reembolsados" y el ingreso queda con bolsa Lemon
  (no es ingreso personal).
- Historial de cortes y **días promedio que tarda Lemon en pagar**.
- Exportar la cuenta de cobro en **PDF y Excel** (detalle por fecha, concepto, tarjeta y total), generada en el
  servidor.

### 7.7 Deudas
- Tarjeta por deuda: saldo, avance (barra desde el monto original), cuota, interés y fecha de pago.
- Martha (solo intereses): mostrar el costo anual de los intereses ($1.980.000) y cuánto se ahorraría abonando a
  capital.
- **Plan sugerido:** comparar avalancha (mayor interés primero) vs. bola de nieve (menor saldo primero) con la
  fecha estimada de libertad de deudas.
- Relación cuotas / ingreso con semáforo (< 15 % verde, 15–30 % ámbar, > 30 % rojo).

### 7.8 Ahorro
- Cadena: aportes del año, acumulado y próximo aporte. Metas con barra de avance y fecha objetivo.
- **Colchón de emergencia:** meses de gasto esencial cubiertos por el ahorro líquido (meta: 3–6 meses).

### 7.9 Reportes
- **Flujo de caja Sankey:** ingresos (sueldo, freelance) → bolsas → grupos → categorías.
- Tendencia de 12 meses de ingresos vs. gastos (barras + línea de ahorro).
- Gasto por **beneficiario** (hogar, Matías, hijo menor, esposa, Milo, yo), **fijos vs. variables**, top
  categorías y **top comercios**.
- Comparación con el mes anterior y con el promedio de 3 meses.
- Exportar cualquier vista a CSV / Excel / PDF (Excel y PDF pueden quedar para la Fase 3 si se acuerda).

### 7.10 Cuentas
- Saldo por cuenta; tarjetas de crédito con **uso de cupo**, fecha de corte, fecha de pago y "pagar tarjeta"
  (transferencia). Ajuste de saldo con movimiento de ajuste explícito.

### 7.11 Chat dentro del portal
- API de Anthropic **solo desde el servidor** (route handler), modelo `claude-sonnet-5-5`, con streaming.
  `ANTHROPIC_API_KEY` solo en Vercel. Antes de implementarlo, revisar la documentación vigente del SDK.
- **Herramientas (tool use), nunca SQL libre:** `proponer_movimiento` (no guarda), `consultar_gasto` (por
  categoría, grupo, bolsa, beneficiario y periodo), `lemon_me_debe`, `estado_presupuesto`, `proximos_pagos`,
  `buscar_movimientos` y `resumen_mes`. Cada herramienta usa el cliente con la sesión del usuario (RLS) y las
  funciones de `calculos.ts`.
- **Español colombiano:** "lucas" = mil, "palo"/"palos" = millón(es), "medio palo" = $500.000, "quincena", "la Nu",
  "la de mi esposa". Probar el parser con una tabla de casos.
- Siempre muestra una **tarjeta de confirmación** con lo detectado (monto, cuenta, categoría, bolsa y fecha),
  editable, con botones Guardar / Corregir. Solo guarda al confirmar.
- Historial en `chat_messages`. Límite de uso diario configurable para controlar el costo.

### 7.12 Ajustes
- Categorías (emoji, color, orden, activar/desactivar) · Reglas (prioridad, probar regla) · **Montos por
  confirmar** (formulario para completar los datos pendientes) · Cuentas · Tema claro/oscuro/sistema · Modo discreto.

## 8. KPIs del asesor financiero (definiciones exactas, con pruebas)

| KPI | Fórmula | Meta / semáforo |
| --- | --- | --- |
| Disponible para gastar | ver 7.1 | > 0 verde |
| Gasto diario permitido | disponible ÷ días restantes | — |
| Tasa de ahorro | (ingresos − gasto personal − freelance) ÷ ingresos | ≥ 20 % verde, 10–20 % ámbar |
| % gastos fijos | fijos ÷ gasto personal | < 50 % ideal |
| Relación cuotas/ingreso | cuotas ÷ ingreso | < 15 % verde |
| Colchón de emergencia | ahorro líquido ÷ gasto esencial mensual | 3–6 meses |
| Lemon me debe / días promedio de reembolso | ya definido | < 30 días |
| Proyección de cierre | gastado ÷ días transcurridos × días del mes | ≤ presupuesto |
| Costo de intereses del año | Σ intereses pagados y proyectados | ↓ |

## 9. Ingeniería

- **Datos:** Server Components para leer; Server Actions con validación **zod** para escribir; `revalidatePath`
  tras cada mutación. Nada de lógica de dinero en el cliente que no venga de `src/lib/finance`.
- **Migraciones** nuevas en `supabase/migrations` y aplicadas por MCP. Tras cada sub-fase: advisors de seguridad
  y rendimiento de Supabase en cero alertas de seguridad. Regenerar `database.types.ts`.
- **Funciones SQL** (si hacen falta, p. ej. agregados del dashboard) con `security invoker` y `search_path = ''`.
- **PWA:** `app/manifest.ts` (standalone, íconos 192/512 + maskable + apple-touch-icon), service worker con Serwist
  (caché de la app; los datos siempre frescos), splash y `theme-color` claro/oscuro. iOS no tiene Background Sync:
  si no hay red, el registro se guarda en una cola local y se envía al volver.
- **Pruebas:** Vitest para todo cálculo nuevo (disponible para gastar, recurrentes, parser colombiano, cortes Lemon,
  avalancha vs. bola de nieve); Playwright para el flujo de 3 toques, crear corte y login, en viewport iPhone y
  escritorio.
- **Calidad:** `typecheck`, `lint`, `test` y `build` en verde antes de cada push. Lighthouse móvil ≥ 90 en
  rendimiento y accesibilidad.
- **Seguridad:** sin secretos en el cliente; el chat valida que cada herramienta solo lea datos del usuario de la
  sesión; límite de tasa en el endpoint del chat.

## 10. Sub-fases y entregables

| Sub-fase | Contenido | Demo |
| --- | --- | --- |
| **1a – Sistema de diseño y layout** | Tokens claro/oscuro, tipografía, navegación (barra inferior + lateral), ⌘K, modo discreto, componentes shadcn | Capturas móvil y escritorio, claro y oscuro |
| **1b – Registro y movimientos** | Botón +, registro en 3 toques, lista, filtros, edición, reglas aprendidas, por revisar | Video/capturas del flujo de 3 toques |
| **1c – Recurrentes, presupuestos y calendario** | Ocurrencias, pagado/falta, ritmo ideal, suscripciones | — |
| **1d – Lemon** | Pendientes, corte, reembolso, historial, PDF/Excel | Cuenta de cobro de ejemplo |
| **1e – Inicio y reportes** | Disponible para gastar, KPIs, Sankey, tendencias, beneficiarios, deudas, ahorro | — |
| **1f – Chat** | Tool use, parser colombiano, tarjeta de confirmación | Conversación de ejemplo |
| **1g – PWA y pulido** | Manifest, service worker, íconos, Lighthouse, accesibilidad | Instalada en el iPhone |

Al cerrar cada sub-fase: explicarme en lenguaje sencillo qué quedó, cómo probarlo y qué sigue; commits pequeños y
descriptivos; desplegar a Vercel y confirmar que la URL funciona.

## 11. Criterios de aceptación de la Fase 1

- [ ] Registro de un gasto común en **≤ 3 toques** desde el iPhone.
- [ ] "Disponible para gastar" y "Lemon me debe" cuadran con pruebas automatizadas y con una verificación manual.
- [ ] Pagar la tarjeta no aparece como gasto en ningún reporte.
- [ ] Los gastos Lemon nunca cuentan como gasto personal.
- [ ] Modo oscuro, modo discreto y PWA instalable funcionando.
- [ ] Todo en español de Colombia, montos `$1.234.567` y fechas `dd/mm/aaaa`.
- [ ] Supabase sin alertas de seguridad; ningún secreto en el cliente ni en el repositorio.

## 12. Datos por confirmar (preguntarme antes de cargarlos)

- Tarjeta de la esposa: banco y últimos 4 dígitos; cupo, corte y pago.
- Nu: cupo y día de pago (corte: día 15).
- Lemon: día exacto, monto y estado del corte de junio de 2026.
- Montos de Netflix, Spotify, DataCrédito, Google One, iCloud y YouTube Premium.
- Presupuesto de ropa del hijo menor.
- Frecuencia del acueducto (mensual o bimestral).
- Cuenta y día de pago del sueldo; saldos actuales de cada cuenta (para arrancar con saldos reales).
- Acumulado actual de la Cadena y su fecha de entrega.
- API key de Anthropic (se carga directamente en Vercel, nunca en el chat).

**Empieza presentándome el plan de la sub-fase 1a, con 2 o 3 propuestas visuales (descripción o capturas) del
Inicio en móvil, para elegir la dirección antes de construir.**
