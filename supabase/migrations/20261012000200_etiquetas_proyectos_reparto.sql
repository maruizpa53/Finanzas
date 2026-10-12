-- Etiquetas (estilo Monarch: varias por movimiento, encima de la categoría),
-- proyectos/viajes (estilo TravelSpend) y reparto de ingresos (estilo Monzo Salary Sorter).

-- ---------------------------------------------------------------------------
-- Etiquetas
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  emoji text,
  color text,
  orden smallint not null default 0,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, nombre)
);

create table public.transaction_tags (
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (transaction_id, tag_id)
);
create index transaction_tags_tag_idx on public.transaction_tags (tag_id);
create index transaction_tags_user_idx on public.transaction_tags (user_id);

-- ---------------------------------------------------------------------------
-- Proyectos y viajes (presupuesto + fechas + etiqueta)
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  emoji text,
  tag_id uuid references public.tags (id) on delete set null,
  presupuesto bigint check (presupuesto is null or presupuesto >= 0),
  fecha_inicio date,
  fecha_fin date,
  moneda text,
  tasa_cambio numeric(14, 6),
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_user_idx on public.projects (user_id);
create index projects_tag_idx on public.projects (tag_id);
create trigger set_updated_at before update on public.projects for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Movimientos: grupo (reparto de un ingreso) y monto original en otra moneda
-- ---------------------------------------------------------------------------
alter table public.transactions
  add column grupo_id uuid,
  add column moneda_original text,
  add column monto_original numeric(14, 2);
create index transactions_grupo_idx on public.transactions (grupo_id) where grupo_id is not null;

-- Plantilla de reparto de ingresos (se recuerda para el siguiente ingreso parecido).
alter table public.user_settings
  add column reparto_ingreso jsonb not null default '[]'::jsonb,
  add column tags_default uuid[] not null default '{}';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['tags', 'transaction_tags', 'projects'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format(
      'create policy "solo_dueno" on public.%I for all to authenticated '
      'using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Datos: etiquetas, proyecto Corea, cuentas (PiBank y orden por uso)
-- ---------------------------------------------------------------------------
insert into public.tags (user_id, nombre, emoji, color, orden)
select u.id, t.nombre, t.emoji, t.color, t.orden
from auth.users u
cross join (values
  ('Mío', '🙋', '#6366F1', 1),
  ('Familia', '👨‍👩‍👦', '#F59E0B', 2),
  ('Carro', '🚗', '#0EA5E9', 3),
  ('Billar', '🎱', '#16A34A', 4),
  ('Torneos', '🏆', '#EAB308', 5),
  ('Corea – World Cup', '🇰🇷', '#E11D48', 6)
) as t(nombre, emoji, color, orden)
on conflict (user_id, nombre) do nothing;

insert into public.projects (user_id, nombre, emoji, tag_id, moneda, notas)
select u.id, 'World Cup Corea', '🇰🇷', t.id, 'KRW', 'Fechas y presupuesto por confirmar.'
from auth.users u
join public.tags t on t.user_id = u.id and t.nombre = 'Corea – World Cup';

insert into public.accounts (user_id, nombre, institucion, tipo, color, icono, orden)
select u.id, 'PiBank', 'PiBank', 'debito', '#7C3AED', 'landmark', 6
from auth.users u
on conflict (user_id, nombre) do nothing;

insert into public.accounts (user_id, nombre, institucion, tipo, color, icono, orden, notas, activa)
select u.id, 'Otra cuenta propia', null, 'debito', '#94A3B8', 'circle-help', 50,
  'Transferencias a cuentas suyas que aún no se identifican (ej. "TRANSF A MIGUEL RUIZ").', true
from auth.users u
on conflict (user_id, nombre) do nothing;

-- Orden por uso: Nu, Bancolombia, Nequi, Rappi, PiBank, Global66 y el resto.
update public.accounts a set orden = o.orden
from (values
  ('Nu tarjeta de crédito', 1), ('Bancolombia', 2), ('Nequi', 3), ('RappiCuenta', 4), ('PiBank', 5),
  ('Global66', 6), ('Nu cuenta', 7), ('Efectivo', 8), ('Daviplata', 9), ('Tarjeta de crédito esposa', 10)
) as o(nombre, orden)
where a.nombre = o.nombre;

update public.accounts set ultimos4 = '8990', notas = 'Cuenta de ahorros ···8990' where nombre = 'Bancolombia';
