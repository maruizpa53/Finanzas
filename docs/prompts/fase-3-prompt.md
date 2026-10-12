# Prompt Fase 3 – Reportes, alertas, metas y pulido final

> Prompt para Claude Code. Requiere las Fases 1 y 2 terminadas.
> Objetivo: que el portal **me hable a mí** (alertas y resúmenes) y produzca documentos listos para usar (informes,
> cuenta de cobro), y que la visión de largo plazo (patrimonio, metas, deudas) quede completa.
> Nota: el modo oscuro se adelantó a la Fase 1; aquí solo se pule.

---

## 1. Rol

Diseñador de producto, ingeniero full-stack y asesor financiero. Háblame en español, presenta el plan de cada
sub-fase y espera mi aprobación. No inventes montos.

## 2. Referentes

- **Copilot Money:** "mes y año en revisión" (resumen visual tipo historia).
- **Monarch Money:** pronóstico de presupuesto, metas compartidas e individuales, patrimonio neto en el tiempo.
- **YNAB:** educación financiera concreta y accionable.
- **Emma:** alertas de suscripciones y de gastos inusuales.

## 3. Reportes e informes

### 3.1 Informe mensual (PDF + vista web)
- Portada con el mes y los KPIs: ingresos, gasto personal, flujo neto, tasa de ahorro, disponible que sobró y
  Lemon me debe.
- Gráficos: Sankey de flujo, gasto por grupo vs. presupuesto, tendencia de 6 meses y gasto por beneficiario.
- **Desviaciones contra el presupuesto:** tabla ordenada por exceso, con la explicación ("Mercado +$180.000: 4
  compras grandes en Éxito").
- **Recomendaciones generadas por el modelo:** máximo 5, concretas, con número y acción ("Si mantienes restaurantes
  en $400.000 en vez de $650.000, ahorras $3.000.000 al año"). El modelo recibe **solo agregados** (no movimientos
  crudos) y se le indica que no invente cifras: cada número debe salir de los datos enviados.
- Generado en el servidor con `@react-pdf/renderer` (gráficos como SVG) y guardado en Storage para el historial.

### 3.2 Informe anual
- Todo lo gastado en el año por grupo, categoría, beneficiario y comercio; meses mejor y peor; evolución del ahorro
  y de la deuda; total pagado en intereses; total reembolsado por Lemon.
- Versión web tipo **"Tu año en números"** (tarjetas deslizables en móvil) y versión PDF.

### 3.3 Reporte de deudas
- Saldo y avance de cada una, intereses pagados y proyectados.
- **Plan de pago sugerido:** avalancha vs. bola de nieve con fecha de libertad de deudas, y simulador "¿y si abono
  $X extra al mes?". Caso especial: Martha (solo intereses, 3 % mensual = 36 % anual; priorizar su capital).

### 3.4 Cuenta de cobro Lemon
- Si no quedó en la Fase 1: PDF con membrete sencillo (mis datos y los de Lemon First S.A.S.), detalle por fecha,
  concepto, tarjeta ···4 dígitos y total; Excel con el mismo detalle. Numeración consecutiva de cortes.

### 3.5 Exportaciones
- Botón **Exportar** en cada vista con filtros: CSV, Excel (`exceljs`, con formato $ y fechas dd/mm/aaaa) y PDF.
- **Respaldo completo:** descargar todos mis datos (JSON + CSV por tabla) desde Ajustes.

## 4. Alertas por correo (y notificaciones push en el iPhone)

- **Proveedor:** Resend (integración del Vercel Marketplace, que crea la API key como variable de entorno) con
  plantillas en **React Email**. Envío a maruizpa53@gmail.com. Revisar la documentación vigente antes de implementar.
- **Programación:** Vercel Cron diario a las 7:00 a. m. Bogotá (12:00 UTC); el endpoint se protege con
  `CRON_SECRET`.
- **Alertas:**

| Alerta | Cuándo |
| --- | --- |
| Pagos próximos | 3 días antes y el mismo día (servicios, cuotas, suscripciones, Cadena) |
| Corte y pago de tarjeta | 2 días antes del corte y del pago (Nu: corte día 15) |
| Presupuesto al 80 % y al 100 % | Al cruzar el umbral (una sola vez por categoría y mes) |
| Ritmo de gasto | Si la proyección de cierre supera el presupuesto total en más de 10 % |
| Lemon sin reembolsar | Corte presentado hace > 30 días sin pago; y "llevas $X sin presentar" cada 15 días |
| Suscripción que subió de precio | Al detectar el cargo |
| Gasto inusual | Movimiento > 3× el promedio de su categoría |
| Resumen semanal | Domingos 7 p. m.: semana en 5 líneas |
| Resumen mensual | Día 1: enlace al informe del mes anterior |

- **Sin repetir:** tabla `notification_log` (tipo, referencia, periodo) y clave de idempotencia por envío.
- **Preferencias:** en Ajustes, activar/desactivar cada alerta, elegir correo y/o push y fijar horario de silencio.
- **Push web en el iPhone** (iOS 16.4+ con el portal instalado como PWA): mismas alertas, opcional.

## 5. Metas de ahorro y patrimonio

- **Metas:** nombre, monto objetivo, fecha, aporte mensual requerido (calculado), avance, proyección ("al ritmo
  actual llegas en marzo") y vinculación a una cuenta o a la Cadena.
- **Fondo de emergencia** como meta sugerida: 3–6 meses de gasto esencial (calculado con datos reales).
- **Cadena:** calendario de aportes y fecha de entrega; al recibirla, sugerir a qué meta o deuda destinarla.
- **Patrimonio neto en el tiempo:** tabla `net_worth_snapshots` (cierre mensual automático): cuentas − deudas −
  saldos de tarjetas + ahorros; gráfico de 12 meses.
- **Simulador "¿qué pasa si…?":** abonar a capital, recortar una categoría, subir el aporte de ahorro; muestra el
  efecto en 12 meses.

## 6. Pulido final

- Revisión completa de modo oscuro, modo discreto y estados vacíos en todas las pantallas.
- **Seguridad:** activar **2FA (TOTP) de Supabase Auth** con app autenticadora (recomendado para un portal
  financiero), cierre de sesión por inactividad configurable y registro de accesos.
- Rendimiento: Lighthouse móvil ≥ 90 en todas las pantallas; consultas pesadas con índices o vistas.
- Accesibilidad WCAG 2.2 AA verificada con axe.
- Documentación final en el README: cómo usar cada módulo, respaldos y cómo rotar llaves.

## 7. Sub-fases

| Sub-fase | Contenido |
| --- | --- |
| 3a | Informe mensual (web + PDF) con recomendaciones del modelo |
| 3b | Exportaciones CSV / Excel / PDF + respaldo completo |
| 3c | Alertas por correo (Resend + Cron) y preferencias |
| 3d | Metas, fondo de emergencia, patrimonio neto y simulador |
| 3e | Informe anual, reporte de deudas y plan de pago |
| 3f | Push en iPhone, 2FA, pulido y auditoría final |

## 8. Criterios de aceptación

- [ ] El día 1 de cada mes llega un correo con el informe del mes anterior.
- [ ] Ninguna alerta se repite para el mismo evento.
- [ ] Las recomendaciones del modelo solo usan cifras reales del periodo.
- [ ] Los PDF y Excel muestran $1.234.567 y dd/mm/aaaa, y los totales cuadran con el portal.
- [ ] 2FA activo y advisors de Supabase sin alertas de seguridad.

## 9. Lo que voy a necesitar de ti

- Aprobar la creación de la cuenta de Resend desde el Vercel Marketplace (plan gratuito suficiente).
- Datos para la cuenta de cobro: tu nombre o cédula como aparecen ante Lemon y los datos de Lemon First S.A.S.
- Horarios preferidos para las alertas.
