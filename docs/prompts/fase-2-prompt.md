# Prompt Fase 2 – Importación inteligente de extractos

> Prompt para Claude Code. Requiere la Fase 1 terminada (registro, movimientos, reglas, "por revisar", Lemon).
> Objetivo: que traer un mes completo de un banco tome **menos de 2 minutos**, sin duplicados y con la gran mayoría
> de movimientos ya categorizados y con la bolsa correcta.

---

## 1. Rol

Actúa como ingeniero senior de datos financieros y diseñador de producto. Háblame en español. Antes de cada banco,
presenta el plan y **pídeme un extracto real de muestra**: nunca adivines el formato. Los extractos reales jamás se
suben al repositorio; para las pruebas se crean versiones anonimizadas (montos y nombres alterados, misma estructura).

## 2. Qué hacen los mejores (referentes)

- **Copilot Money:** la categorización aprende de las correcciones; los usuarios reportan que a las 2–3 semanas casi
  no hay trabajo manual. → Meta: **≥ 85 % de movimientos auto-categorizados** desde el segundo mes.
- **Lunch Money:** reglas con prioridad; al corregir pregunta "¿aplicar a similares?"; estados revisado / no revisado.
  → La importación cae en la bandeja **"Por revisar"** de la Fase 1.
- **Lección general de la industria:** los parsers de PDF por expresiones regulares se rompen en silencio cuando el
  banco cambia el formato. → **Toda importación se valida contra los totales del extracto** y, si no cuadra, se
  detiene y avisa.

## 3. Formatos por banco (lo que se sabe hoy; confirmar con el archivo real)

| Banco | Cómo se descarga | Formato | Notas |
| --- | --- | --- | --- |
| **Bancolombia** | Sucursal Virtual Personas → Menú → Documentos → Extractos → ⋮ → "Descargar en XLS" o "en PDF" (con clave dinámica) | **XLS** (preferido) y PDF | Extractos disponibles hasta 2 años; la app muestra movimientos de hasta 2 años |
| **Nequi** | Web nequi.com.co → Certificados → Extractos → mes/año | PDF | Disponible 3 días después de cerrar el mes; algunos documentos llegan con **clave = número de cédula** |
| **Daviplata** | Desde la app (Servicios → certificados/extractos) | PDF | — |
| **Nu (tarjeta y cuenta)** | Desde la app | PDF (por confirmar) | Tarjeta ···3688: compras en dólares (Meta) → monto en COP + monto original |
| **RappiCuenta** | App Rappi / RappiPay | Por confirmar | Pedir muestra |
| **Global66** | App / web | Por confirmar | Movimientos en varias monedas |

**Orden:** empezar por el banco que yo diga. Si no digo, empezar por **Bancolombia (XLS)**, que es el más
estructurado, y luego por la **Nu** (donde están los gastos de Lemon).

## 4. Flujo de usuario

1. **Subir:** pantalla "Importar" → elegir cuenta → arrastrar o elegir archivo (CSV / XLS / XLSX / PDF; en iPhone
   desde Archivos). Si el PDF tiene clave, pedirla en el formulario; **se usa solo en memoria y nunca se guarda**.
2. **Procesando:** barra de progreso por etapas (leer → interpretar → validar → categorizar → buscar duplicados).
3. **Vista previa** (tabla en escritorio y tarjetas en móvil):
   - Resumen arriba: N movimientos, total débitos/créditos, **saldo inicial + movimientos = saldo final ✓** (o ✗ con
     la diferencia), periodo y cuenta.
   - Cada fila: fecha, descripción original, comercio limpio, monto, tipo, categoría sugerida, bolsa y beneficiario,
     y una **etiqueta de origen** (Regla · IA 92 % · Manual) más la **marca de duplicado** cuando aplica.
   - Filtros: "solo dudosos", "solo duplicados", "solo Lemon".
   - Edición en línea y acciones masivas; al corregir: "¿crear regla para movimientos similares?".
4. **Confirmar:** importa solo lo marcado; los duplicados quedan excluidos por defecto (con opción de forzar).
   Toast con resumen y botón **"Deshacer importación"** (borra el lote completo mientras nadie lo haya editado).
5. Los importados quedan con `origen = 'importacion'`, `import_batch_id` e `import_hash`; los de confianza baja
   quedan en "Por revisar".

## 5. Motor de importación (arquitectura)

- **Adaptadores por banco** con una interfaz común:
  `detectar(archivo) → boolean`, `extraer(archivo, clave?) → MovimientoCrudo[] + TotalesExtracto`.
  Uno por banco y formato (`bancolombia-xls`, `nequi-pdf`, …), cada uno con sus pruebas y fixtures anonimizados.
- **Lectura:** CSV/XLS/XLSX con SheetJS (`xlsx`); PDF con extracción de texto (p. ej. `unpdf`) y reglas por banco.
- **Respaldo con IA para PDFs** (cuando no hay adaptador o el adaptador falla): enviar el PDF a la API de Anthropic
  (soporte nativo de documentos PDF) y pedir la salida con un **esquema JSON estricto vía tool use** (fecha, descripción,
  monto con signo, moneda, monto original, saldo). Revisar la documentación vigente del SDK antes de implementar.
  **Siempre** se valida contra los totales; si no cuadra, no se importa.
- **Normalización:**
  - Fechas a `aaaa-mm-dd` (America/Bogota) y montos a pesos enteros (manejar `1.234.567,89`, `-`, `( )`, `CR`/`DB`).
  - Comercio limpio (quitar prefijos como `COMPRA EN`, `PAGO PSE`, códigos y ciudades) y descripción original
    guardada en `notas`.
  - Moneda extranjera: guardar `moneda_original` y `monto_original` (nueva migración) además del monto en COP.
- **Tipos especiales:**
  - **Pago de tarjeta:** en el extracto del banco es una salida y en el de la tarjeta un abono. Detectar el par
    (mismo monto, ±3 días) y registrarlo **una sola vez** como `pago_tarjeta`; nunca como gasto.
  - Transferencias entre cuentas propias (Bancolombia → Nequi, etc.) emparejadas igual.
  - Intereses, cuota de manejo, seguros y **4×1000 (GMF)** → categoría "Intereses y cuotas de manejo".
  - Compras a cuotas (diferidos): registrar la compra completa en su fecha, sin repetir cada cuota.
  - Reembolsos y devoluciones → ingreso o gasto negativo según el caso, con referencia al original si se encuentra.

## 6. Detección de duplicados

1. **Exacto:** `import_hash = sha256(cuenta | fecha | monto | descripción normalizada | ordinal del día)`. El ordinal
   distingue dos compras idénticas el mismo día. Reimportar el mismo archivo crea **0** movimientos nuevos (probarlo).
2. **Contra registros manuales o del chat:** misma cuenta, mismo monto, fecha ±3 días y descripción parecida →
   proponer **"Fusionar"**: se conserva la categoría y la bolsa que yo puse y se le agrega la referencia de la
   importación.
3. **Entre lotes que se solapan** (dos extractos con días en común): resuelto por el hash exacto.

## 7. Categorización automática

Orden de decisión, de mayor a menor prioridad:
1. **Reglas** (`categorization_rules`, por prioridad): patrón contiene / comercio / regex → categoría, bolsa y
   beneficiario.
2. **Historial:** el mismo comercio categorizado antes por mí.
3. **IA:** un modelo económico (p. ej. Claude Haiku) con la lista de categorías, las bolsas y ejemplos de mis
   correcciones; devuelve categoría, bolsa, beneficiario y **confianza**. Por lotes, solo para los no resueltos por 1 y 2.
4. Confianza < 0,8 → "Por revisar".

**Aprendizaje:** cada corrección actualiza o crea una regla `aprendida` (con contador `veces_aplicada`). Si una regla
aprendida se corrige 2 veces, se desactiva y se avisa.
**Lemon:** todo cargo de Meta / Facebook (`FACEBK`, `META PLATFORMS`) → bolsa Lemon automáticamente (ya está en las
reglas iniciales).

## 8. Datos y seguridad

- Nueva tabla `import_rows` (staging): lote, fila cruda (jsonb), campos normalizados, sugerencias, confianza,
  `duplicado_de`, `accion` (importar / omitir / fusionar). RLS por `user_id`.
- Archivos en el bucket privado `extractos/{user_id}/{lote}/archivo`; URL firmada de 60 s para verlos; opción de
  **borrar el original** automáticamente después de importar (por defecto, conservar 90 días).
- Enviar un PDF a la API de Anthropic sale del portal: mostrarlo claramente y permitir desactivar la IA por banco
  (solo adaptadores locales).
- Límite de tamaño de 20 MB (ya configurado en el bucket) y límite de filas por lote.
- Advisors de Supabase en cero alertas de seguridad al cerrar.

## 9. Pruebas

- Fixtures anonimizados por banco y formato: cada uno con totales que cuadran y casos raros (montos con coma, compras
  en USD, pagos de tarjeta, GMF, devoluciones, dos compras idénticas el mismo día).
- Pruebas: normalización de montos y fechas, hash e idempotencia, emparejamiento de pagos de tarjeta, fusión con
  manuales, validación de totales (un fixture que **no** cuadra debe ser rechazado) y prioridad de reglas.
- Playwright: subir → vista previa → corregir → confirmar → deshacer.

## 10. Entregables por sub-fase

| Sub-fase | Contenido |
| --- | --- |
| 2a | Infraestructura: `import_rows`, subida, pantalla de vista previa, hash, deshacer lote |
| 2b | Primer banco (el que yo elija; por defecto Bancolombia XLS) de punta a punta |
| 2c | Categorización: reglas + historial + IA + aprendizaje |
| 2d | Nu (tarjeta), con moneda extranjera y pagos de tarjeta emparejados |
| 2e | Nequi, Daviplata, RappiCuenta y Global66 (uno a la vez, con muestra real) |
| 2f | Respaldo IA para PDFs desconocidos + validación de totales |

## 11. Criterios de aceptación

- [ ] Importar un mes de Bancolombia toma < 2 minutos, incluida la revisión.
- [ ] Reimportar el mismo archivo crea 0 movimientos nuevos.
- [ ] Un pago de tarjeta nunca aparece como gasto ni se cuenta dos veces.
- [ ] Ninguna importación entra si los totales no cuadran.
- [ ] ≥ 85 % auto-categorizado a partir del segundo mes de uso.
- [ ] Los extractos reales nunca quedan en el repositorio.

**Empieza preguntándome con qué banco arrancamos y pidiéndome un extracto de muestra.**
