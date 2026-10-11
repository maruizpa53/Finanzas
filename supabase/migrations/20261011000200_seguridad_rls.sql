-- Seguridad: RLS en todas las tablas, vistas con security_invoker,
-- bucket privado de extractos y restricción a un único usuario.

-- ---------------------------------------------------------------------------
-- RLS por user_id
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'accounts', 'categories', 'income_sources', 'recurring_items', 'lemon_settlements',
    'import_batches', 'transactions', 'recurring_occurrences', 'budgets', 'debts',
    'debt_payments', 'savings', 'savings_contributions', 'categorization_rules',
    'chat_messages', 'user_settings'
  ]
  loop
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
-- Vistas (respetan el RLS de quien consulta)
-- ---------------------------------------------------------------------------

-- Efecto de cada movimiento sobre el saldo de cada cuenta.
--   gasto: resta en cuenta_id · ingreso: suma en cuenta_id
--   transferencia / pago_tarjeta: resta en cuenta_id y suma en cuenta_destino_id
create view public.account_balances
with (security_invoker = true)
as
select
  a.id,
  a.user_id,
  a.nombre,
  a.tipo,
  a.ultimos4,
  a.cupo,
  a.saldo_inicial
    + coalesce((
      select sum(
        case
          when t.cuenta_id = a.id and t.tipo = 'ingreso' then t.monto
          when t.cuenta_id = a.id then -t.monto
          else t.monto
        end
      )
      from public.transactions t
      where (t.cuenta_id = a.id or t.cuenta_destino_id = a.id)
        and t.fecha >= a.saldo_inicial_fecha
    ), 0) as saldo
from public.accounts a;

create view public.debt_balances
with (security_invoker = true)
as
select
  d.id,
  d.user_id,
  d.acreedor,
  d.cuota,
  d.solo_intereses,
  d.saldo_inicial,
  case
    when d.saldo_inicial is null then null
    else greatest(
      d.saldo_inicial - coalesce((
        select sum(p.capital) from public.debt_payments p
        where p.debt_id = d.id and p.fecha >= d.saldo_fecha
      ), 0),
      0
    )
  end as saldo_actual
from public.debts d;

revoke all on public.account_balances, public.debt_balances from anon;

-- ---------------------------------------------------------------------------
-- Storage: bucket privado para extractos (carpeta = user_id)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'extractos',
  'extractos',
  false,
  20971520,
  array[
    'text/csv',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/heic'
  ]
)
on conflict (id) do nothing;

create policy "extractos_dueno_select" on storage.objects for select to authenticated
  using (bucket_id = 'extractos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "extractos_dueno_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'extractos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "extractos_dueno_update" on storage.objects for update to authenticated
  using (bucket_id = 'extractos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "extractos_dueno_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'extractos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Un solo usuario: cualquier alta con otro correo se rechaza en la base,
-- aunque el registro público quedara habilitado por error.
-- ---------------------------------------------------------------------------
create table private.allowed_emails (
  email text primary key
);
insert into private.allowed_emails (email) values ('maruizpa53@gmail.com');

create or replace function private.enforce_allowed_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from private.allowed_emails e where lower(e.email) = lower(new.email)
  ) then
    raise exception 'Registro no permitido para este correo';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_allowed_email() from public, anon, authenticated;

create trigger enforce_allowed_email
before insert or update of email on auth.users
for each row execute function private.enforce_allowed_email();

revoke all on schema private from public, anon, authenticated;
