-- Esquema inicial del portal de finanzas personales.
-- Convenciones:
--   * Montos en pesos colombianos enteros (bigint). Nunca decimales.
--   * Toda tabla tiene user_id y RLS por user_id (ver migración de seguridad).
--   * No se guardan números completos de cuentas ni tarjetas: solo últimos 4 dígitos.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.tipo_cuenta as enum ('debito', 'credito', 'billetera', 'efectivo');
create type public.tipo_movimiento as enum ('gasto', 'ingreso', 'transferencia', 'pago_tarjeta');
create type public.bolsa as enum ('personal', 'lemon', 'freelance');
create type public.beneficiario as enum ('yo', 'hogar', 'matias', 'hijo_menor', 'esposa', 'milo');
create type public.origen_movimiento as enum ('manual', 'chat', 'importacion');
create type public.estado_reembolso as enum ('pendiente', 'presentado', 'reembolsado');
create type public.frecuencia as enum ('diaria_habil', 'semanal', 'quincenal', 'mensual', 'bimestral', 'anual');
create type public.estado_corte as enum ('presentado', 'reembolsado_parcial', 'reembolsado');
create type public.estado_pago_recurrente as enum ('pendiente', 'pagado', 'omitido');
create type public.tipo_categoria as enum ('gasto', 'ingreso');

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cuentas y tarjetas
-- ---------------------------------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  institucion text,
  tipo public.tipo_cuenta not null,
  ultimos4 text check (ultimos4 ~ '^[0-9]{4}$'),
  cupo bigint check (cupo is null or cupo >= 0),
  dia_corte smallint check (dia_corte between 1 and 31),
  dia_pago smallint check (dia_pago between 1 and 31),
  -- Saldo conocido en una fecha; el saldo actual se calcula sumando movimientos posteriores.
  -- En tarjetas de crédito el saldo es negativo cuando hay deuda.
  saldo_inicial bigint not null default 0,
  saldo_inicial_fecha date not null default current_date,
  color text,
  icono text,
  activa boolean not null default true,
  orden smallint not null default 0,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_cupo_solo_credito check (tipo = 'credito' or cupo is null),
  unique (user_id, nombre)
);

-- ---------------------------------------------------------------------------
-- Categorías (grupo = categoría sin padre)
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  parent_id uuid references public.categories (id) on delete cascade,
  nombre text not null,
  tipo public.tipo_categoria not null default 'gasto',
  color text,
  icono text,
  es_fijo boolean not null default false,
  bolsa_default public.bolsa,
  beneficiario_default public.beneficiario,
  orden smallint not null default 0,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_unique_nombre unique nulls not distinct (user_id, parent_id, nombre)
);

-- ---------------------------------------------------------------------------
-- Ingresos esperados
-- ---------------------------------------------------------------------------
create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('sueldo', 'freelance', 'otro')),
  monto_esperado bigint check (monto_esperado is null or monto_esperado >= 0),
  es_variable boolean not null default false,
  frecuencia public.frecuencia not null default 'mensual',
  dia_pago smallint check (dia_pago between 1 and 31),
  cuenta_id uuid references public.accounts (id) on delete set null,
  categoria_id uuid references public.categories (id) on delete set null,
  bolsa public.bolsa not null default 'personal',
  activa boolean not null default true,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Gastos e ingresos fijos
-- ---------------------------------------------------------------------------
create table public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  tipo public.tipo_categoria not null default 'gasto',
  categoria_id uuid references public.categories (id) on delete set null,
  cuenta_id uuid references public.accounts (id) on delete set null,
  monto_esperado bigint check (monto_esperado is null or monto_esperado >= 0),
  es_variable boolean not null default false,
  frecuencia public.frecuencia not null default 'mensual',
  dia_pago smallint check (dia_pago between 1 and 31),
  bolsa public.bolsa not null default 'personal',
  beneficiario public.beneficiario,
  fecha_inicio date not null default current_date,
  fecha_fin date,
  activo boolean not null default true,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Cortes de cuenta con Lemon
-- ---------------------------------------------------------------------------
create table public.lemon_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha_corte date not null,
  periodo_desde date,
  periodo_hasta date,
  monto_presentado bigint check (monto_presentado is null or monto_presentado >= 0),
  monto_reembolsado bigint not null default 0 check (monto_reembolsado >= 0),
  fecha_reembolso date,
  estado public.estado_corte not null default 'presentado',
  archivo_path text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Importación de extractos (fase 2)
-- ---------------------------------------------------------------------------
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cuenta_id uuid references public.accounts (id) on delete set null,
  banco text not null,
  formato text check (formato in ('csv', 'xlsx', 'pdf')),
  archivo_path text,
  estado text not null default 'subido' check (estado in ('subido', 'en_revision', 'importado', 'descartado', 'error')),
  filas_total integer not null default 0,
  filas_importadas integer not null default 0,
  filas_duplicadas integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Movimientos
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null default current_date,
  descripcion text not null,
  comercio text,
  monto bigint not null check (monto > 0),
  tipo public.tipo_movimiento not null,
  cuenta_id uuid not null references public.accounts (id) on delete restrict,
  -- Solo para transferencias y pagos de tarjeta: cuenta que recibe.
  cuenta_destino_id uuid references public.accounts (id) on delete restrict,
  categoria_id uuid references public.categories (id) on delete set null,
  bolsa public.bolsa not null default 'personal',
  beneficiario public.beneficiario,
  origen public.origen_movimiento not null default 'manual',
  notas text,
  adjunto_path text,
  -- Módulo Lemon
  reembolso_estado public.estado_reembolso,
  lemon_settlement_id uuid references public.lemon_settlements (id) on delete set null,
  -- Relaciones opcionales
  recurring_item_id uuid references public.recurring_items (id) on delete set null,
  import_batch_id uuid references public.import_batches (id) on delete set null,
  import_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_destino_coherente check (
    (tipo in ('transferencia', 'pago_tarjeta')) = (cuenta_destino_id is not null)
  ),
  constraint transactions_destino_distinto check (cuenta_destino_id is null or cuenta_destino_id <> cuenta_id),
  constraint transactions_reembolso_solo_lemon check (
    (bolsa = 'lemon' and tipo = 'gasto') = (reembolso_estado is not null)
  ),
  constraint transactions_corte_solo_lemon check (lemon_settlement_id is null or bolsa = 'lemon')
);

-- Al marcar un gasto como Lemon, su estado de reembolso arranca en "pendiente".
create or replace function private.transactions_defaults()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.bolsa = 'lemon' and new.tipo = 'gasto' then
    new.reembolso_estado := coalesce(new.reembolso_estado, 'pendiente');
  else
    new.reembolso_estado := null;
    if new.bolsa <> 'lemon' then
      new.lemon_settlement_id := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger transactions_defaults
before insert or update on public.transactions
for each row execute function private.transactions_defaults();

-- ---------------------------------------------------------------------------
-- Pagos pendientes generados por los recurrentes (uno por período)
-- ---------------------------------------------------------------------------
create table public.recurring_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recurring_item_id uuid not null references public.recurring_items (id) on delete cascade,
  fecha_vencimiento date not null,
  monto_esperado bigint,
  estado public.estado_pago_recurrente not null default 'pendiente',
  transaction_id uuid references public.transactions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recurring_item_id, fecha_vencimiento)
);

-- ---------------------------------------------------------------------------
-- Presupuestos
-- mes = primer día del mes; null = presupuesto por defecto para todos los meses.
-- Presupuesto efectivo = monto + monto_diario_habil × días hábiles del mes.
-- ---------------------------------------------------------------------------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categoria_id uuid not null references public.categories (id) on delete cascade,
  mes date check (mes is null or extract(day from mes) = 1),
  monto bigint not null default 0 check (monto >= 0),
  monto_diario_habil bigint not null default 0 check (monto_diario_habil >= 0),
  alerta_80 boolean not null default true,
  alerta_100 boolean not null default true,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_unique_mes unique nulls not distinct (user_id, categoria_id, mes)
);

-- ---------------------------------------------------------------------------
-- Deudas
-- ---------------------------------------------------------------------------
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  acreedor text not null,
  monto_original bigint check (monto_original is null or monto_original >= 0),
  -- Saldo de capital conocido en saldo_fecha; el actual descuenta los abonos a capital posteriores.
  saldo_inicial bigint check (saldo_inicial is null or saldo_inicial >= 0),
  saldo_fecha date not null default current_date,
  cuota bigint check (cuota is null or cuota >= 0),
  tasa_mensual numeric(7, 4) check (tasa_mensual is null or tasa_mensual >= 0),
  interes_mensual bigint check (interes_mensual is null or interes_mensual >= 0),
  solo_intereses boolean not null default false,
  dia_pago smallint check (dia_pago between 1 and 31),
  categoria_id uuid references public.categories (id) on delete set null,
  estado text not null default 'activa' check (estado in ('activa', 'pagada')),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  debt_id uuid not null references public.debts (id) on delete cascade,
  fecha date not null default current_date,
  monto_total bigint not null check (monto_total > 0),
  capital bigint not null default 0 check (capital >= 0),
  interes bigint not null default 0 check (interes >= 0),
  transaction_id uuid references public.transactions (id) on delete set null,
  notas text,
  created_at timestamptz not null default now(),
  constraint debt_payments_suma check (capital + interes = monto_total)
);

-- ---------------------------------------------------------------------------
-- Ahorros y metas
-- ---------------------------------------------------------------------------
create table public.savings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  tipo text not null default 'programado' check (tipo in ('programado', 'meta')),
  aporte_mensual bigint check (aporte_mensual is null or aporte_mensual >= 0),
  meta_monto bigint check (meta_monto is null or meta_monto >= 0),
  acumulado_inicial bigint not null default 0 check (acumulado_inicial >= 0),
  fecha_inicio date,
  fecha_entrega date,
  dia_aporte smallint check (dia_aporte between 1 and 31),
  organizador text,
  categoria_id uuid references public.categories (id) on delete set null,
  activo boolean not null default true,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  saving_id uuid not null references public.savings (id) on delete cascade,
  fecha date not null default current_date,
  monto bigint not null check (monto > 0),
  transaction_id uuid references public.transactions (id) on delete set null,
  notas text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reglas de categorización automática
-- ---------------------------------------------------------------------------
create table public.categorization_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  patron text not null,
  tipo_patron text not null default 'contiene' check (tipo_patron in ('contiene', 'comercio', 'regex')),
  categoria_id uuid references public.categories (id) on delete cascade,
  bolsa public.bolsa,
  beneficiario public.beneficiario,
  prioridad smallint not null default 100,
  origen text not null default 'manual' check (origen in ('manual', 'aprendida')),
  veces_aplicada integer not null default 0,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  conversation_id uuid not null default gen_random_uuid(),
  role text not null check (role in ('user', 'assistant', 'tool')),
  content jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Preferencias del usuario (valores por defecto recordados)
-- ---------------------------------------------------------------------------
create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  cuenta_default_id uuid references public.accounts (id) on delete set null,
  bolsa_default public.bolsa not null default 'personal',
  categoria_default_id uuid references public.categories (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'accounts', 'categories', 'income_sources', 'recurring_items', 'lemon_settlements',
    'import_batches', 'transactions', 'recurring_occurrences', 'budgets', 'debts', 'savings',
    'categorization_rules', 'user_settings'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()',
      t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Índices (user_id, fechas y todas las llaves foráneas)
-- ---------------------------------------------------------------------------
create index accounts_user_idx on public.accounts (user_id);
create index categories_user_idx on public.categories (user_id);
create index categories_parent_idx on public.categories (parent_id);
create index income_sources_user_idx on public.income_sources (user_id);
create index income_sources_cuenta_idx on public.income_sources (cuenta_id);
create index income_sources_categoria_idx on public.income_sources (categoria_id);
create index recurring_items_user_idx on public.recurring_items (user_id);
create index recurring_items_categoria_idx on public.recurring_items (categoria_id);
create index recurring_items_cuenta_idx on public.recurring_items (cuenta_id);
create index lemon_settlements_user_fecha_idx on public.lemon_settlements (user_id, fecha_corte desc);
create index import_batches_user_idx on public.import_batches (user_id);
create index import_batches_cuenta_idx on public.import_batches (cuenta_id);
create index transactions_user_fecha_idx on public.transactions (user_id, fecha desc);
create index transactions_cuenta_idx on public.transactions (cuenta_id);
create index transactions_cuenta_destino_idx on public.transactions (cuenta_destino_id);
create index transactions_categoria_idx on public.transactions (categoria_id);
create index transactions_settlement_idx on public.transactions (lemon_settlement_id);
create index transactions_recurring_idx on public.transactions (recurring_item_id);
create index transactions_import_batch_idx on public.transactions (import_batch_id);
create index transactions_lemon_pendientes_idx on public.transactions (user_id, reembolso_estado)
  where bolsa = 'lemon';
create unique index transactions_import_hash_idx on public.transactions (user_id, import_hash)
  where import_hash is not null;
create index recurring_occurrences_user_venc_idx on public.recurring_occurrences (user_id, fecha_vencimiento);
create index recurring_occurrences_transaction_idx on public.recurring_occurrences (transaction_id);
create index budgets_categoria_idx on public.budgets (categoria_id);
create index debts_user_idx on public.debts (user_id);
create index debts_categoria_idx on public.debts (categoria_id);
create index debt_payments_user_idx on public.debt_payments (user_id);
create index debt_payments_debt_idx on public.debt_payments (debt_id);
create index debt_payments_transaction_idx on public.debt_payments (transaction_id);
create index savings_user_idx on public.savings (user_id);
create index savings_categoria_idx on public.savings (categoria_id);
create index savings_contributions_user_idx on public.savings_contributions (user_id);
create index savings_contributions_saving_idx on public.savings_contributions (saving_id);
create index savings_contributions_transaction_idx on public.savings_contributions (transaction_id);
create index categorization_rules_user_idx on public.categorization_rules (user_id);
create index categorization_rules_categoria_idx on public.categorization_rules (categoria_id);
create index chat_messages_user_conv_idx on public.chat_messages (user_id, conversation_id, created_at);
create index user_settings_cuenta_idx on public.user_settings (cuenta_default_id);
create index user_settings_categoria_idx on public.user_settings (categoria_default_id);
