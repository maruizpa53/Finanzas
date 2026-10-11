# Mis Finanzas

Portal web privado de finanzas personales. Uso exclusivo de Miguel Ángel Ruiz.

**Stack:** Next.js 15 (App Router) + TypeScript · Tailwind CSS v4 + shadcn/ui · Supabase (Postgres, Auth, RLS, Storage) · Vercel.

## Estado

| Fase | Contenido | Estado |
| --- | --- | --- |
| 0 – Base | Esquema, RLS, login de un solo usuario, seed, despliegue | ✅ |
| 1 – Valor inmediato | Registro rápido, chat, recurrentes, presupuestos, deudas, ahorro, módulo Lemon, dashboard, PWA | Pendiente |
| 2 – Importación de extractos | CSV / Excel / PDF por banco, duplicados, categorización automática | Pendiente |
| 3 – Extras | Reportes descargables, alertas por correo, metas, modo oscuro | Pendiente |

## Seguridad

- **Un solo usuario.** Un trigger en `auth.users` rechaza cualquier alta cuyo correo no esté en
  `private.allowed_emails` (solo `maruizpa53@gmail.com`), aunque el registro público quedara activo.
- **RLS en todas las tablas** con la política `user_id = auth.uid()`. El rol anónimo no tiene permisos.
- **Sin secretos en el cliente.** El navegador solo recibe la URL y la llave publicable de Supabase.
  La llave secreta y la API key de Anthropic irán solo en variables de entorno del servidor (Vercel).
- **Sin números completos** de cuentas ni tarjetas: solo los últimos 4 dígitos.
- **Extractos** en el bucket privado `extractos`, cada archivo en la carpeta del usuario.
- `.env*` está en `.gitignore` (excepto `.env.example`).

## Base de datos

Migraciones en [`supabase/migrations`](supabase/migrations):

1. `esquema_inicial`: tablas, tipos, índices y triggers.
2. `seguridad_rls`: RLS, vistas `account_balances` y `debt_balances`, bucket privado y restricción de usuario.
3. `seed_datos_iniciales`: cuentas, categorías, recurrentes, presupuestos, deudas, ahorro e ingresos.
   Se carga solo al crear el usuario.

Reglas del modelo:

- Montos en **pesos enteros** (`bigint`), sin decimales.
- **Pagar la tarjeta** es `pago_tarjeta` (sale de la cuenta y entra a la tarjeta), no un gasto nuevo.
- **Bolsa** `personal`, `lemon` o `freelance`. Los gastos Lemon no cuentan como gasto personal y nacen
  con `reembolso_estado = 'pendiente'`.
- **"Lemon me debe"** = gastos Lemon sin corte + (presentado − reembolsado) de cada corte abierto.
- **Presupuesto del mes** = `monto` + `monto_diario_habil` × días hábiles (lunes a viernes sin festivos
  de Colombia). Así se suman las onces de Matías al mercado.

## Desarrollo local

```bash
cp .env.example .env.local   # completar NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev                  # http://localhost:3000
npm test                     # pruebas de cálculos de dinero
npm run typecheck && npm run lint
```

## Crear el usuario (una sola vez)

1. Supabase → proyecto **finanzas-personales** → *Authentication* → *Users* → **Add user** →
   *Create new user*: correo `maruizpa53@gmail.com`, una contraseña fuerte, marcar **Auto Confirm User**.
   Al crearlo se cargan automáticamente los datos iniciales.
2. *Authentication* → *Sign In / Providers* → desactivar **Allow new users to sign up**.

## Formatos

Interfaz en español de Colombia. Montos `$1.234.567`, fechas `dd/mm/aaaa`, zona horaria `America/Bogota`.
