-- Taxonomía completa, inspirada en Monarch, YNAB, Copilot y Lunch Money:
--   * Categoría = QUÉ es el movimiento (una sola, en grupos). Gastos, ingresos y transferencias.
--   * Etiqueta  = PARA QUIÉN / POR QUÉ / CONTEXTO (varias a la vez, también en grupos).
-- Las categorías existentes se MUEVEN (no se borran), así se conservan movimientos,
-- presupuestos, reglas y pagos fijos ya asociados.

create function pg_temp.grupo(u uuid, p_nombre text, p_tipo public.tipo_categoria, p_icono text, p_color text, p_orden int, p_antes text default null)
returns uuid language plpgsql as $$
declare v uuid;
begin
  select id into v from public.categories where user_id = u and parent_id is null and nombre = p_nombre;
  if v is null and p_antes is not null then
    update public.categories set nombre = p_nombre where user_id = u and parent_id is null and nombre = p_antes returning id into v;
  end if;
  if v is null then
    insert into public.categories (user_id, parent_id, nombre, tipo, icono, color, orden)
    values (u, null, p_nombre, p_tipo, p_icono, p_color, p_orden) returning id into v;
  else
    update public.categories set tipo = p_tipo, icono = p_icono, color = p_color, orden = p_orden, activa = true where id = v;
  end if;
  return v;
end $$;

-- Mueve la categoría si ya existe (en cualquier grupo del mismo tipo); si no, la crea.
create function pg_temp.cat(u uuid, g uuid, p_nombre text, p_icono text, p_orden int,
  p_fijo boolean default false, p_bolsa text default 'personal', p_benef text default null, p_antes text default null)
returns uuid language plpgsql as $$
declare v uuid; t public.tipo_categoria;
begin
  select tipo into t from public.categories where id = g;
  select id into v from public.categories where user_id = u and parent_id is not null and tipo = t and nombre = coalesce(p_antes, p_nombre) limit 1;
  if v is null and p_antes is not null then
    select id into v from public.categories where user_id = u and parent_id is not null and tipo = t and nombre = p_nombre limit 1;
  end if;
  if v is null then
    insert into public.categories (user_id, parent_id, nombre, tipo, icono, orden, es_fijo, bolsa_default, beneficiario_default)
    values (u, g, p_nombre, t, p_icono, p_orden, p_fijo, p_bolsa::public.bolsa, p_benef::public.beneficiario) returning id into v;
  else
    update public.categories set parent_id = g, nombre = p_nombre, orden = p_orden, icono = coalesce(icono, p_icono) where id = v;
  end if;
  return v;
end $$;

do $$
declare
  u uuid;
  g uuid;
begin
  for u in select id from auth.users loop
    -- =====================================================================
    -- GASTOS
    -- =====================================================================
    g := pg_temp.grupo(u, 'Vivienda', 'gasto', '🏠', '#0EA5E9', 1, 'Casa');
    perform pg_temp.cat(u, g, 'Cuota apartamento', '🏢', 1, true, 'personal', 'hogar');
    perform pg_temp.cat(u, g, 'Mantenimiento y reparaciones', '🔧', 2, false, 'personal', 'hogar');
    perform pg_temp.cat(u, g, 'Muebles y electrodomésticos', '🛋️', 3, false, 'personal', 'hogar');
    perform pg_temp.cat(u, g, 'Aseo y limpieza', '🧽', 4, false, 'personal', 'hogar');
    perform pg_temp.cat(u, g, 'Hogar varios', '🏡', 5, false, 'personal', 'hogar');

    g := pg_temp.grupo(u, 'Servicios', 'gasto', '💡', '#06B6D4', 2);
    perform pg_temp.cat(u, g, 'Luz', '💡', 1, true, 'personal', 'hogar');
    perform pg_temp.cat(u, g, 'Gas natural', '🔥', 2, true, 'personal', 'hogar');
    perform pg_temp.cat(u, g, 'Acueducto', '💧', 3, true, 'personal', 'hogar');
    perform pg_temp.cat(u, g, 'Internet', '📶', 4, true, 'personal', 'hogar');
    perform pg_temp.cat(u, g, 'Celular Claro', '📱', 5, true, 'personal', 'yo');

    g := pg_temp.grupo(u, 'Alimentación', 'gasto', '🛒', '#22C55E', 3);
    perform pg_temp.cat(u, g, 'Mercado', '🛒', 1, false, 'personal', 'hogar');
    perform pg_temp.cat(u, g, 'Restaurantes', '🍽️', 2, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Domicilios', '🛵', 3, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Panaderías y cafés', '🥐', 4, false, 'personal', 'yo');

    g := pg_temp.grupo(u, 'Transporte', 'gasto', '🚗', '#3B82F6', 4);
    perform pg_temp.cat(u, g, 'Taxis y apps', '🚕', 1, false, 'personal', 'yo', 'Transporte');
    perform pg_temp.cat(u, g, 'Gasolina', '⛽', 2, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Parqueaderos y peajes', '🅿️', 3, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Mantenimiento del carro', '🛠️', 4, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'SOAT, seguro e impuesto del carro', '📄', 5, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Transporte público', '🚌', 6, false, 'personal', 'yo');

    g := pg_temp.grupo(u, 'Hijos', 'gasto', '🧒', '#F59E0B', 5);
    perform pg_temp.cat(u, g, 'Pensión colegio Matías', '🏫', 1, true, 'personal', 'matias');
    perform pg_temp.cat(u, g, 'Ruta escolar Matías', '🚌', 2, true, 'personal', 'matias');
    perform pg_temp.cat(u, g, 'Útiles y uniformes', '🎒', 3, false, 'personal', 'matias');
    perform pg_temp.cat(u, g, 'Actividades y cursos', '⚽', 4, false, 'personal', 'matias');
    perform pg_temp.cat(u, g, 'Pañales', '👶', 5, true, 'personal', 'hijo_menor');
    perform pg_temp.cat(u, g, 'Ropa hijo menor', '🧸', 6, false, 'personal', 'hijo_menor');
    perform pg_temp.cat(u, g, 'Hijos varios', '🎈', 7, false, 'personal', null);

    g := pg_temp.grupo(u, 'Salud y bienestar', 'gasto', '🩺', '#EF4444', 6);
    perform pg_temp.cat(u, g, 'Sura plan complementario', '🩺', 1, true, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Seguridad social', '🧾', 2, true, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Médicos y medicamentos', '💊', 3, false, 'personal', 'yo', 'Salud');
    perform pg_temp.cat(u, g, 'Gimnasio y deporte', '🏋️', 4, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Cuidado personal', '💈', 5, false, 'personal', 'yo');

    g := pg_temp.grupo(u, 'Personal', 'gasto', '🙋', '#8B5CF6', 7);
    perform pg_temp.cat(u, g, 'Ropa', '👕', 1, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Tecnología', '🖥️', 2, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Educación y cursos', '📚', 3, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Personal varios', '✨', 9, false, 'personal', 'yo');

    g := pg_temp.grupo(u, 'Ocio y entretenimiento', 'gasto', '🎉', '#EC4899', 8);
    perform pg_temp.cat(u, g, 'Deporte y billar', '🎱', 1, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Torneos e inscripciones', '🏆', 2, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Bares y salidas', '🍻', 3, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Eventos y conciertos', '🎟️', 4, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Entretenimiento', '🎬', 5, false, 'personal', 'yo');

    g := pg_temp.grupo(u, 'Viajes', 'gasto', '✈️', '#E11D48', 9);
    perform pg_temp.cat(u, g, 'Tiquetes', '🛫', 1, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Alojamiento', '🏨', 2, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Comida en viaje', '🍜', 3, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Transporte en viaje', '🚆', 4, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Tours, boletas y actividades', '🎫', 5, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Compras y recuerdos', '🛍️', 6, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Viajes varios', '🧳', 7, false, 'personal', 'yo', 'Viajes');

    g := pg_temp.grupo(u, 'Suscripciones', 'gasto', '🔁', '#A855F7', 10);
    perform pg_temp.cat(u, g, 'Netflix', '📺', 1, true, 'personal', 'hogar');
    perform pg_temp.cat(u, g, 'Spotify', '🎧', 2, true, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'YouTube Premium', '▶️', 3, true, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'iCloud', '🍏', 4, true, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Google One', '☁️', 5, true, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'DataCrédito', '📊', 6, true, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Apps y software', '🧩', 7, false, 'personal', 'yo');

    g := pg_temp.grupo(u, 'Mascotas', 'gasto', '🐶', '#D97706', 11);
    perform pg_temp.cat(u, g, 'Milo', '🐶', 1, true, 'personal', 'milo');
    perform pg_temp.cat(u, g, 'Veterinario', '🩹', 2, false, 'personal', 'milo');

    g := pg_temp.grupo(u, 'Regalos y donaciones', 'gasto', '🎁', '#F43F5E', 12);
    perform pg_temp.cat(u, g, 'Regalos', '🎁', 1, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Celebraciones', '🎂', 2, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Donaciones', '💝', 3, false, 'personal', null);

    g := pg_temp.grupo(u, 'Personas y préstamos', 'gasto', '👥', '#64748B', 13);
    perform pg_temp.cat(u, g, 'Transferencias a terceros', '👥', 1, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Préstamos que hice', '🤲', 2, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Apoyo familiar', '👨‍👩‍👦', 3, false, 'personal', null);

    g := pg_temp.grupo(u, 'Bancos e impuestos', 'gasto', '🏦', '#475569', 14);
    perform pg_temp.cat(u, g, 'Impuesto 4x1000', '🧮', 1, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Intereses y cuotas de manejo', '🏦', 2, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Comisiones bancarias', '💳', 3, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Impuestos (renta, predial)', '🏛️', 4, false, 'personal', 'yo');

    g := pg_temp.grupo(u, 'Deudas', 'gasto', '⚖️', '#DC2626', 15, 'Deudas y ahorro');
    perform pg_temp.cat(u, g, 'Sandra Ballesteros', '🤝', 1, true, 'personal', null);
    perform pg_temp.cat(u, g, 'Martha Sánchez', '🤝', 2, true, 'personal', null);
    perform pg_temp.cat(u, g, 'Giovanni García', '🤝', 3, true, 'personal', null);

    g := pg_temp.grupo(u, 'Ahorro e inversión', 'gasto', '🐷', '#14B8A6', 16);
    perform pg_temp.cat(u, g, 'Cadena (ahorro)', '🐷', 1, true, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Fondos e inversiones', '📈', 2, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Fondo de emergencia', '🛟', 3, false, 'personal', 'yo');
    perform pg_temp.cat(u, g, 'Ahorro para viajes', '🌍', 4, false, 'personal', 'yo');

    g := pg_temp.grupo(u, 'Lemon', 'gasto', '🍋', '#EAB308', 17);
    perform pg_temp.cat(u, g, 'Meta – bots de WhatsApp', '🤖', 1, false, 'lemon', null);
    perform pg_temp.cat(u, g, 'Hosting y servidores', '🖧', 2, false, 'lemon', null);
    perform pg_temp.cat(u, g, 'Software y SaaS', '🧰', 3, false, 'lemon', null);
    perform pg_temp.cat(u, g, 'Otros gastos Lemon', '🍋', 9, false, 'lemon', null);

    g := pg_temp.grupo(u, 'Freelance', 'gasto', '💻', '#7C3AED', 18);
    perform pg_temp.cat(u, g, 'Herramientas freelance', '🛠️', 1, false, 'freelance', null);
    perform pg_temp.cat(u, g, 'Otros gastos freelance', '💼', 2, false, 'freelance', null);

    g := pg_temp.grupo(u, 'Otros', 'gasto', '📦', '#94A3B8', 19);
    perform pg_temp.cat(u, g, 'Imprevistos', '⚠️', 1, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Otros', '📦', 2, false, 'personal', null);

    -- =====================================================================
    -- INGRESOS
    -- =====================================================================
    g := pg_temp.grupo(u, 'Trabajo', 'ingreso', '💼', '#16A34A', 30, 'Ingresos');
    perform pg_temp.cat(u, g, 'Sueldo Lemon', '💼', 1, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Primas y bonificaciones', '🎉', 2, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Clientes y proyectos', '🤝', 3, false, 'freelance', null);
    perform pg_temp.cat(u, g, 'Freelance', '💻', 4, false, 'freelance', null);

    g := pg_temp.grupo(u, 'Reembolsos', 'ingreso', '↩️', '#0D9488', 31);
    perform pg_temp.cat(u, g, 'Reembolso Lemon', '↩️', 1, false, 'lemon', null);
    perform pg_temp.cat(u, g, 'Reintegros y devoluciones', '🔙', 2, false, 'personal', null);

    g := pg_temp.grupo(u, 'De personas', 'ingreso', '👥', '#0891B2', 32);
    perform pg_temp.cat(u, g, 'Transferencias recibidas', '📥', 1, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Préstamos que me pagan', '🤲', 2, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Regalos recibidos', '🎁', 3, false, 'personal', null);

    g := pg_temp.grupo(u, 'Rendimientos y otros', 'ingreso', '💰', '#65A30D', 33);
    perform pg_temp.cat(u, g, 'Intereses', '🏦', 1, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Rendimientos de inversiones', '📈', 2, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Ventas', '🏷️', 3, false, 'personal', null);
    perform pg_temp.cat(u, g, 'Ingresos varios', '➕', 4, false, 'personal', null, 'Otros ingresos');

    -- =====================================================================
    -- TRANSFERENCIAS (no son gasto ni ingreso)
    -- =====================================================================
    g := pg_temp.grupo(u, 'Transferencias', 'transferencia', '🔄', '#6366F1', 40);
    perform pg_temp.cat(u, g, 'Entre mis cuentas', '🔄', 1);
    perform pg_temp.cat(u, g, 'Pago de tarjeta', '💳', 2);
    perform pg_temp.cat(u, g, 'Retiro de efectivo', '💵', 3);
    perform pg_temp.cat(u, g, 'Cambio de divisas', '💱', 4);
    perform pg_temp.cat(u, g, 'Ahorro e inversión propia', '🏦', 5);
    perform pg_temp.cat(u, g, 'Ajuste de saldo', '⚖️', 6);

    -- =====================================================================
    -- ETIQUETAS AGRUPADAS
    -- =====================================================================
    insert into public.tags (user_id, nombre, emoji, color, orden, grupo, descripcion)
    values
      (u, 'Mío', '🙋', '#6366F1', 1, 'Para quién', 'Gasto para usted'),
      (u, 'Familia', '👨‍👩‍👦', '#F59E0B', 2, 'Para quién', 'Para toda la familia'),
      (u, 'Pareja', '💑', '#EC4899', 3, 'Para quién', null),
      (u, 'Matías', '🧒', '#F97316', 4, 'Para quién', null),
      (u, 'Hijo menor', '👶', '#FB923C', 5, 'Para quién', null),
      (u, 'Milo', '🐶', '#D97706', 6, 'Para quién', null),
      (u, 'Amigos', '🫂', '#14B8A6', 7, 'Para quién', null),
      (u, 'Carro', '🚗', '#0EA5E9', 10, 'Actividad', null),
      (u, 'Billar', '🎱', '#16A34A', 11, 'Actividad', null),
      (u, 'Torneos', '🏆', '#EAB308', 12, 'Actividad', null),
      (u, 'Trabajo', '💼', '#475569', 13, 'Actividad', 'Gasto por motivo laboral (no Lemon)'),
      (u, 'Estudio', '📚', '#8B5CF6', 14, 'Actividad', null),
      (u, 'Corea – World Cup', '🇰🇷', '#E11D48', 20, 'Viajes y proyectos', null),
      (u, 'Necesario', '✅', '#22C55E', 30, 'Tipo de gasto', 'Necesidad (regla 50/30/20)'),
      (u, 'Gusto', '🎈', '#F472B6', 31, 'Tipo de gasto', 'Deseo, se puede recortar'),
      (u, 'Impulso', '⚡', '#F97316', 32, 'Tipo de gasto', 'Compra no planeada'),
      (u, 'Reembolsable', '🔁', '#0EA5E9', 40, 'Seguimiento', 'Alguien me lo debe devolver'),
      (u, 'Compartido', '➗', '#6366F1', 41, 'Seguimiento', 'Gasto dividido con otra persona'),
      (u, 'Deducible renta', '🧾', '#16A34A', 42, 'Seguimiento', 'Medicina prepagada, intereses de vivienda, dependientes…'),
      (u, 'Garantía', '🛡️', '#64748B', 43, 'Seguimiento', 'Guardar la factura'),
      (u, 'Cumpleaños', '🎂', '#EC4899', 50, 'Ocasión', null),
      (u, 'Navidad', '🎄', '#16A34A', 51, 'Ocasión', null),
      (u, 'Vacaciones', '🏖️', '#06B6D4', 52, 'Ocasión', null),
      (u, 'Emergencia', '🚨', '#DC2626', 53, 'Ocasión', null)
    on conflict (user_id, nombre) do update set grupo = excluded.grupo, orden = excluded.orden, descripcion = coalesce(public.tags.descripcion, excluded.descripcion);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Reclasificación de lo importado (solo reglas inequívocas por descripción)
-- ---------------------------------------------------------------------------
create function pg_temp.mover(p_destino text, p_desde text[], p_patrones text[])
returns void language sql as $$
  update public.transactions t set categoria_id = d.id
  from public.categories d, public.categories o
  where d.user_id = t.user_id and d.parent_id is not null and d.nombre = p_destino
    and o.id = t.categoria_id and o.nombre = any (p_desde)
    and (t.descripcion ilike any (p_patrones) or coalesce(t.comercio, '') ilike any (p_patrones));
$$;

select pg_temp.mover('Impuesto 4x1000', array['Intereses y cuotas de manejo', 'Personal varios'], array['%4X1000%']);
select pg_temp.mover('Gasolina', array['Taxis y apps', 'Personal varios'], array['%ESTACION%', '%TERPEL%', '%PRIMAX%', '%TEXACO%', '%BIOMAX%']);
select pg_temp.mover('Parqueaderos y peajes', array['Personal varios', 'Taxis y apps'], array['%PARKI%', '%PARQUEADERO%', '%PEAJE%']);
select pg_temp.mover('Panaderías y cafés', array['Personal varios'], array['%PANADER%', '%EMPANADA%', '%POSTRES%', '%PASTELERIA%', '%KOKOA%', '%CAFE%', '%JUAN VALDEZ%']);
select pg_temp.mover('Mercado', array['Personal varios'], array['%SUPERMERCADO%', '%OXXO%', '%SALSAMENTARIA%', '%D1 %', '%TIENDAS ARA%', '%EXITO%', '%CARULLA%', '%OLIMPICA%']);
select pg_temp.mover('Restaurantes', array['Personal varios'], array['%ASADOS%', '%CEVICHERIA%', '%PESQUERA%', '%MC DONALD%', '%RESTAURANTE%', '%CREPES%', '%FRISBY%']);
select pg_temp.mover('Muebles y electrodomésticos', array['Personal varios', 'Hogar varios'], array['%HOMECENTER%', '%ALKOSTO%', '%FALABELLA%']);
select pg_temp.mover('Deporte y billar', array['Personal varios'], array['%BILLAR%']);
select pg_temp.mover('Netflix', array['Personal varios'], array['%NETFL%']);
select pg_temp.mover('Apps y software', array['Personal varios'], array['%GOOGLE%', '%APPLE.COM%']);
select pg_temp.mover('Alojamiento', array['Viajes varios'], array['%AIRBNB%', '%BOOKING%', '%HOTEL%']);
select pg_temp.mover('Tiquetes', array['Viajes varios'], array['%AVIANCA%', '%LATAM%', '%WINGO%', '%JETSMART%', '%VIVA AIR%']);
select pg_temp.mover('Hosting y servidores', array['Otros gastos Lemon'], array['%HETZNER%', '%GODADDY%', '%HOSTING%', '%DIGITALOCEAN%', '%AWS%']);
select pg_temp.mover('Software y SaaS', array['Otros gastos Lemon'], array['%MANYCHAT%']);

-- Transferencias: categoría según destino.
update public.transactions t set categoria_id = c.id
from public.categories c
where t.categoria_id is null and t.tipo = 'pago_tarjeta'
  and c.user_id = t.user_id and c.parent_id is not null and c.nombre = 'Pago de tarjeta';

update public.transactions t set categoria_id = c.id
from public.accounts a, public.categories c
where t.categoria_id is null and t.tipo = 'transferencia' and a.id = t.cuenta_destino_id
  and c.user_id = t.user_id and c.parent_id is not null
  and c.nombre = case
    when a.tipo = 'efectivo' then 'Retiro de efectivo'
    when a.nombre ilike 'global66%' then 'Cambio de divisas'
    else 'Entre mis cuentas' end;

-- Reglas para que futuras importaciones caigan solas en su categoría.
insert into public.categorization_rules (user_id, patron, tipo_patron, categoria_id, prioridad, origen)
select c.user_id, r.patron, 'contiene', c.id, 50, 'manual'
from (values
  ('4x1000', 'Impuesto 4x1000'), ('estacion', 'Gasolina'), ('terpel', 'Gasolina'), ('primax', 'Gasolina'),
  ('parki', 'Parqueaderos y peajes'), ('peaje', 'Parqueaderos y peajes'), ('panader', 'Panaderías y cafés'),
  ('empanadas', 'Panaderías y cafés'), ('supermercado', 'Mercado'), ('oxxo', 'Mercado'), ('homecenter', 'Muebles y electrodomésticos'),
  ('billar', 'Deporte y billar'), ('airbnb', 'Alojamiento'), ('booking', 'Alojamiento'), ('avianca', 'Tiquetes'),
  ('hetzner', 'Hosting y servidores'), ('godaddy', 'Hosting y servidores'), ('manychat', 'Software y SaaS'), ('uber', 'Taxis y apps')
) as r(patron, cat)
join public.categories c on c.nombre = r.cat and c.parent_id is not null
where not exists (select 1 from public.categorization_rules x where x.user_id = c.user_id and x.patron = r.patron);
