-- Datos iniciales. Se cargan automáticamente al crear el usuario (trigger en auth.users)
-- o manualmente con: select private.seed_user_data('<user_id>');
-- Es idempotente: si el usuario ya tiene cuentas, no hace nada.
-- Los montos que aún no están confirmados quedan en null (nunca inventados).

create or replace function private.seed_user_data(uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  g_casa uuid; g_hijos uuid; g_personal uuid; g_subs uuid; g_deudas uuid;
  g_lemon uuid; g_freelance uuid; g_otros uuid; g_ingresos uuid;
  c_mercado uuid; c_apto uuid; c_pension uuid; c_ruta uuid; c_panales uuid;
  c_sura uuid; c_milo uuid; c_sandra uuid; c_martha uuid; c_giovanni uuid; c_cadena uuid;
  c_sueldo uuid; c_freelance_ing uuid;
  a_nu_tc uuid; a_bancolombia uuid;
begin
  if exists (select 1 from public.accounts where user_id = uid) then
    return;
  end if;

  -- -------------------------------------------------------------------------
  -- Cuentas
  -- -------------------------------------------------------------------------
  insert into public.accounts (user_id, nombre, institucion, tipo, ultimos4, dia_corte, color, icono, orden, notas) values
    (uid, 'Bancolombia', 'Bancolombia', 'debito', null, null, '#FDDA24', 'landmark', 1, null),
    (uid, 'Nu cuenta', 'Nu', 'debito', null, null, '#820AD1', 'piggy-bank', 2, null),
    (uid, 'Nu tarjeta de crédito', 'Nu', 'credito', '3688', 15, '#820AD1', 'credit-card', 3,
      'Hoy la mayoría de consumos son de Lemon/Meta. Cupo y día de pago por confirmar.'),
    (uid, 'Tarjeta de crédito esposa', null, 'credito', null, null, '#E11D48', 'credit-card', 4,
      'Banco, últimos 4 dígitos, cupo, corte y pago por confirmar.'),
    (uid, 'Nequi', 'Bancolombia', 'billetera', null, null, '#DA0081', 'smartphone', 5, null),
    (uid, 'Daviplata', 'Davivienda', 'billetera', null, null, '#ED1C27', 'smartphone', 6, null),
    (uid, 'RappiCuenta', 'RappiPay', 'debito', null, null, '#FF441F', 'wallet', 7, null),
    (uid, 'Global66', 'Global66', 'billetera', null, null, '#1D4ED8', 'globe', 8, null),
    (uid, 'Efectivo', null, 'efectivo', null, null, '#16A34A', 'banknote', 9, null);

  select id into a_nu_tc from public.accounts where user_id = uid and nombre = 'Nu tarjeta de crédito';
  select id into a_bancolombia from public.accounts where user_id = uid and nombre = 'Bancolombia';

  -- -------------------------------------------------------------------------
  -- Grupos de categorías
  -- -------------------------------------------------------------------------
  insert into public.categories (user_id, nombre, tipo, color, icono, orden, bolsa_default) values
    (uid, 'Casa', 'gasto', '#0EA5E9', 'house', 1, 'personal'),
    (uid, 'Hijos', 'gasto', '#F59E0B', 'baby', 2, 'personal'),
    (uid, 'Personal', 'gasto', '#8B5CF6', 'user', 3, 'personal'),
    (uid, 'Suscripciones', 'gasto', '#EC4899', 'repeat', 4, 'personal'),
    (uid, 'Deudas y ahorro', 'gasto', '#EF4444', 'scale', 5, 'personal'),
    (uid, 'Lemon', 'gasto', '#EAB308', 'citrus', 6, 'lemon'),
    (uid, 'Freelance', 'gasto', '#14B8A6', 'laptop', 7, 'freelance'),
    (uid, 'Otros', 'gasto', '#64748B', 'circle-ellipsis', 8, 'personal'),
    (uid, 'Ingresos', 'ingreso', '#22C55E', 'trending-up', 9, 'personal');

  select id into g_casa from public.categories where user_id = uid and parent_id is null and nombre = 'Casa';
  select id into g_hijos from public.categories where user_id = uid and parent_id is null and nombre = 'Hijos';
  select id into g_personal from public.categories where user_id = uid and parent_id is null and nombre = 'Personal';
  select id into g_subs from public.categories where user_id = uid and parent_id is null and nombre = 'Suscripciones';
  select id into g_deudas from public.categories where user_id = uid and parent_id is null and nombre = 'Deudas y ahorro';
  select id into g_lemon from public.categories where user_id = uid and parent_id is null and nombre = 'Lemon';
  select id into g_freelance from public.categories where user_id = uid and parent_id is null and nombre = 'Freelance';
  select id into g_otros from public.categories where user_id = uid and parent_id is null and nombre = 'Otros';
  select id into g_ingresos from public.categories where user_id = uid and parent_id is null and nombre = 'Ingresos';

  -- -------------------------------------------------------------------------
  -- Categorías
  -- -------------------------------------------------------------------------
  insert into public.categories (user_id, parent_id, nombre, tipo, icono, es_fijo, orden, bolsa_default, beneficiario_default) values
    -- Casa
    (uid, g_casa, 'Cuota apartamento', 'gasto', 'building', true, 1, 'personal', 'hogar'),
    (uid, g_casa, 'Mercado', 'gasto', 'shopping-cart', false, 2, 'personal', 'hogar'),
    (uid, g_casa, 'Acueducto', 'gasto', 'droplet', true, 3, 'personal', 'hogar'),
    (uid, g_casa, 'Gas natural', 'gasto', 'flame', true, 4, 'personal', 'hogar'),
    (uid, g_casa, 'Luz', 'gasto', 'zap', true, 5, 'personal', 'hogar'),
    (uid, g_casa, 'Internet', 'gasto', 'wifi', true, 6, 'personal', 'hogar'),
    (uid, g_casa, 'Hogar varios', 'gasto', 'sofa', false, 7, 'personal', 'hogar'),
    -- Hijos
    (uid, g_hijos, 'Pensión colegio Matías', 'gasto', 'school', true, 1, 'personal', 'matias'),
    (uid, g_hijos, 'Ruta escolar Matías', 'gasto', 'bus', true, 2, 'personal', 'matias'),
    (uid, g_hijos, 'Pañales', 'gasto', 'baby', true, 3, 'personal', 'hijo_menor'),
    (uid, g_hijos, 'Ropa hijo menor', 'gasto', 'shirt', false, 4, 'personal', 'hijo_menor'),
    (uid, g_hijos, 'Hijos varios', 'gasto', 'toy-brick', false, 5, 'personal', null),
    -- Personal
    (uid, g_personal, 'Sura plan complementario', 'gasto', 'heart-pulse', true, 1, 'personal', 'yo'),
    (uid, g_personal, 'Celular Claro', 'gasto', 'phone', true, 2, 'personal', 'yo'),
    (uid, g_personal, 'Milo', 'gasto', 'dog', true, 3, 'personal', 'milo'),
    (uid, g_personal, 'Restaurantes', 'gasto', 'utensils', false, 4, 'personal', 'yo'),
    (uid, g_personal, 'Transporte', 'gasto', 'car', false, 5, 'personal', 'yo'),
    (uid, g_personal, 'Salud', 'gasto', 'pill', false, 6, 'personal', 'yo'),
    (uid, g_personal, 'Ropa', 'gasto', 'shirt', false, 7, 'personal', 'yo'),
    (uid, g_personal, 'Entretenimiento', 'gasto', 'popcorn', false, 8, 'personal', 'yo'),
    (uid, g_personal, 'Personal varios', 'gasto', 'sparkles', false, 9, 'personal', 'yo'),
    -- Suscripciones
    (uid, g_subs, 'Netflix', 'gasto', 'tv', true, 1, 'personal', 'hogar'),
    (uid, g_subs, 'Spotify', 'gasto', 'music', true, 2, 'personal', 'yo'),
    (uid, g_subs, 'DataCrédito', 'gasto', 'shield-check', true, 3, 'personal', 'yo'),
    (uid, g_subs, 'Google One', 'gasto', 'cloud', true, 4, 'personal', 'yo'),
    (uid, g_subs, 'iCloud', 'gasto', 'cloud', true, 5, 'personal', 'yo'),
    (uid, g_subs, 'YouTube Premium', 'gasto', 'youtube', true, 6, 'personal', 'yo'),
    -- Deudas y ahorro
    (uid, g_deudas, 'Sandra Ballesteros', 'gasto', 'hand-coins', true, 1, 'personal', 'yo'),
    (uid, g_deudas, 'Martha Sánchez', 'gasto', 'hand-coins', true, 2, 'personal', 'yo'),
    (uid, g_deudas, 'Giovanni García', 'gasto', 'hand-coins', false, 3, 'personal', 'yo'),
    (uid, g_deudas, 'Cadena (ahorro)', 'gasto', 'piggy-bank', true, 4, 'personal', 'yo'),
    (uid, g_deudas, 'Intereses y cuotas de manejo', 'gasto', 'percent', false, 5, 'personal', 'yo'),
    -- Lemon
    (uid, g_lemon, 'Meta – bots de WhatsApp', 'gasto', 'bot', false, 1, 'lemon', null),
    (uid, g_lemon, 'Otros gastos Lemon', 'gasto', 'briefcase', false, 2, 'lemon', null),
    -- Freelance
    (uid, g_freelance, 'Herramientas freelance', 'gasto', 'wrench', false, 1, 'freelance', null),
    (uid, g_freelance, 'Otros gastos freelance', 'gasto', 'briefcase', false, 2, 'freelance', null),
    -- Otros
    (uid, g_otros, 'Regalos', 'gasto', 'gift', false, 1, 'personal', null),
    (uid, g_otros, 'Imprevistos', 'gasto', 'triangle-alert', false, 2, 'personal', null),
    (uid, g_otros, 'Otros', 'gasto', 'circle-ellipsis', false, 3, 'personal', null),
    -- Ingresos
    (uid, g_ingresos, 'Sueldo Lemon', 'ingreso', 'briefcase', true, 1, 'personal', null),
    (uid, g_ingresos, 'Freelance', 'ingreso', 'laptop', false, 2, 'freelance', null),
    (uid, g_ingresos, 'Reembolso Lemon', 'ingreso', 'undo-2', false, 3, 'lemon', null),
    (uid, g_ingresos, 'Otros ingresos', 'ingreso', 'plus', false, 4, 'personal', null);

  select id into c_mercado from public.categories where user_id = uid and parent_id = g_casa and nombre = 'Mercado';
  select id into c_apto from public.categories where user_id = uid and parent_id = g_casa and nombre = 'Cuota apartamento';
  select id into c_pension from public.categories where user_id = uid and parent_id = g_hijos and nombre = 'Pensión colegio Matías';
  select id into c_ruta from public.categories where user_id = uid and parent_id = g_hijos and nombre = 'Ruta escolar Matías';
  select id into c_panales from public.categories where user_id = uid and parent_id = g_hijos and nombre = 'Pañales';
  select id into c_sura from public.categories where user_id = uid and parent_id = g_personal and nombre = 'Sura plan complementario';
  select id into c_milo from public.categories where user_id = uid and parent_id = g_personal and nombre = 'Milo';
  select id into c_sandra from public.categories where user_id = uid and parent_id = g_deudas and nombre = 'Sandra Ballesteros';
  select id into c_martha from public.categories where user_id = uid and parent_id = g_deudas and nombre = 'Martha Sánchez';
  select id into c_giovanni from public.categories where user_id = uid and parent_id = g_deudas and nombre = 'Giovanni García';
  select id into c_cadena from public.categories where user_id = uid and parent_id = g_deudas and nombre = 'Cadena (ahorro)';
  select id into c_sueldo from public.categories where user_id = uid and parent_id = g_ingresos and nombre = 'Sueldo Lemon';
  select id into c_freelance_ing from public.categories where user_id = uid and parent_id = g_ingresos and nombre = 'Freelance';

  -- -------------------------------------------------------------------------
  -- Gastos fijos y recurrentes
  -- -------------------------------------------------------------------------
  insert into public.recurring_items (user_id, nombre, tipo, categoria_id, monto_esperado, es_variable, frecuencia, beneficiario, notas)
  select uid, r.nombre, 'gasto', c.id, r.monto, r.variable, r.frecuencia::public.frecuencia, r.beneficiario::public.beneficiario, r.notas
  from (values
    ('Cuota apartamento', 'Cuota apartamento', 1100588::bigint, false, 'mensual', 'hogar', null),
    ('Acueducto', 'Acueducto', null, true, 'mensual', 'hogar', 'Monto variable. Confirmar si la factura es mensual o bimestral.'),
    ('Gas natural', 'Gas natural', null, true, 'mensual', 'hogar', 'Monto variable.'),
    ('Luz', 'Luz', null, true, 'mensual', 'hogar', 'Monto variable.'),
    ('Internet', 'Internet', null, true, 'mensual', 'hogar', 'Monto variable.'),
    ('Netflix', 'Netflix', null, false, 'mensual', 'hogar', 'Monto por confirmar.'),
    ('Spotify', 'Spotify', null, false, 'mensual', 'yo', 'Monto por confirmar.'),
    ('DataCrédito', 'DataCrédito', null, false, 'mensual', 'yo', 'Monto por confirmar.'),
    ('Google One', 'Google One', null, false, 'mensual', 'yo', 'Monto por confirmar.'),
    ('iCloud', 'iCloud', null, false, 'mensual', 'yo', 'Monto por confirmar.'),
    ('YouTube Premium', 'YouTube Premium', null, false, 'mensual', 'yo', 'Monto por confirmar.'),
    ('Pensión colegio Matías', 'Pensión colegio Matías', 760150, false, 'mensual', 'matias', null),
    ('Ruta escolar Matías', 'Ruta escolar Matías', 290000, false, 'mensual', 'matias', null),
    ('Onces Matías', 'Mercado', 13000, false, 'diaria_habil', 'matias', 'Entre $12.000 y $13.000 por día hábil. Suma al presupuesto de mercado.'),
    ('Pañales', 'Pañales', 100000, false, 'quincenal', 'hijo_menor', null),
    ('Sura plan complementario', 'Sura plan complementario', 167076, false, 'mensual', 'yo', null),
    ('Celular Claro', 'Celular Claro', null, true, 'mensual', 'yo', 'Monto variable.'),
    ('Milo – peluquería y aseo', 'Milo', 100000, false, 'mensual', 'milo', null),
    ('Cuota Sandra Ballesteros', 'Sandra Ballesteros', 390000, false, 'mensual', 'yo', null),
    ('Intereses Martha Sánchez', 'Martha Sánchez', 165000, false, 'mensual', 'yo', 'Préstamo solo intereses.'),
    ('Cadena', 'Cadena (ahorro)', 1400000, false, 'mensual', 'yo', 'Ahorro programado que organiza la mamá.')
  ) as r(nombre, categoria, monto, variable, frecuencia, beneficiario, notas)
  join public.categories c on c.user_id = uid and c.parent_id is not null and c.nombre = r.categoria;

  -- -------------------------------------------------------------------------
  -- Presupuestos por defecto (solo montos confirmados)
  -- Mercado = $1.000.000 + $13.000 × días hábiles (onces de Matías)
  -- -------------------------------------------------------------------------
  insert into public.budgets (user_id, categoria_id, mes, monto, monto_diario_habil, notas) values
    (uid, c_mercado, null, 1000000, 13000, 'Incluye comida del hijo menor y onces de Matías por día hábil.'),
    (uid, c_apto, null, 1100588, 0, null),
    (uid, c_pension, null, 760150, 0, null),
    (uid, c_ruta, null, 290000, 0, null),
    (uid, c_panales, null, 200000, 0, '$100.000 quincenales.'),
    (uid, c_sura, null, 167076, 0, null),
    (uid, c_milo, null, 100000, 0, null);

  -- -------------------------------------------------------------------------
  -- Deudas
  -- -------------------------------------------------------------------------
  insert into public.debts (user_id, acreedor, monto_original, saldo_inicial, cuota, tasa_mensual, interes_mensual, solo_intereses, categoria_id, notas) values
    (uid, 'Sandra Ballesteros', null, 1170000, 390000, null, null, false, c_sandra, null),
    (uid, 'Martha Sánchez', 5500000, 5500000, 165000, 0.03, 165000, true, c_martha,
      'Préstamo al interés: $165.000 mensuales de intereses sobre $5.500.000 de capital.'),
    (uid, 'Giovanni García', null, 1500000, null, null, null, false, c_giovanni, 'Amigo. Saldo aproximado.');

  -- -------------------------------------------------------------------------
  -- Ahorro
  -- -------------------------------------------------------------------------
  insert into public.savings (user_id, nombre, tipo, aporte_mensual, organizador, categoria_id, notas) values
    (uid, 'Cadena', 'programado', 1400000, 'Mamá', c_cadena, 'Fecha de inicio, fecha de entrega y acumulado por confirmar.');

  -- -------------------------------------------------------------------------
  -- Ingresos
  -- -------------------------------------------------------------------------
  insert into public.income_sources (user_id, nombre, tipo, monto_esperado, es_variable, frecuencia, cuenta_id, categoria_id, bolsa, notas) values
    (uid, 'Sueldo Lemon First', 'sueldo', 15000000, false, 'mensual', a_bancolombia, c_sueldo, 'personal',
      'Cuenta donde llega y día de pago por confirmar.'),
    (uid, 'Trabajos freelance', 'freelance', null, true, 'mensual', null, c_freelance_ing, 'freelance', 'Ingreso variable.');

  -- -------------------------------------------------------------------------
  -- Lemon: último corte conocido (punto de partida)
  -- -------------------------------------------------------------------------
  insert into public.lemon_settlements (user_id, fecha_corte, monto_presentado, estado, notas) values
    (uid, date '2026-06-30', null, 'presentado',
      'Última cuenta de gastos presentada en junio de 2026. Día exacto, monto y estado del reembolso por confirmar.');

  -- -------------------------------------------------------------------------
  -- Reglas de categorización iniciales
  -- -------------------------------------------------------------------------
  insert into public.categorization_rules (user_id, patron, tipo_patron, categoria_id, bolsa, prioridad)
  select uid, r.patron, 'contiene', c.id, r.bolsa::public.bolsa, r.prioridad
  from (values
    ('facebk', 'Meta – bots de WhatsApp', 'lemon', 10),
    ('meta platforms', 'Meta – bots de WhatsApp', 'lemon', 10),
    ('netflix', 'Netflix', 'personal', 50),
    ('spotify', 'Spotify', 'personal', 50),
    ('datacredito', 'DataCrédito', 'personal', 50),
    ('google one', 'Google One', 'personal', 50),
    ('apple.com/bill', 'iCloud', 'personal', 60),
    ('youtube', 'YouTube Premium', 'personal', 50),
    ('claro', 'Celular Claro', 'personal', 50),
    ('sura', 'Sura plan complementario', 'personal', 50)
  ) as r(patron, categoria, bolsa, prioridad)
  join public.categories c on c.user_id = uid and c.parent_id is not null and c.nombre = r.categoria;

  -- -------------------------------------------------------------------------
  -- Preferencias
  -- -------------------------------------------------------------------------
  insert into public.user_settings (user_id, cuenta_default_id, bolsa_default)
  values (uid, a_bancolombia, 'personal')
  on conflict (user_id) do nothing;
end;
$$;

revoke all on function private.seed_user_data(uuid) from public, anon, authenticated;

create or replace function private.on_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.seed_user_data(new.id);
  return new;
end;
$$;

revoke all on function private.on_auth_user_created() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.on_auth_user_created();
