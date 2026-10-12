-- Categorías que aparecieron al analizar los extractos de Bancolombia 2026
-- y saldo inicial de la cuenta de ahorros (extracto del 09/12/2025).
insert into public.categories (user_id, parent_id, nombre, tipo, icono, es_fijo, orden, bolsa_default, beneficiario_default)
select g.user_id, g.id, n.nombre, n.tipo::public.tipo_categoria, n.icono, n.fijo, n.orden, n.bolsa::public.bolsa, n.benef::public.beneficiario
from public.categories g
join (values
  ('Personal', 'Viajes', 'gasto', '✈️', false, 10, 'personal', 'yo'),
  ('Personal', 'Deporte y billar', 'gasto', '🎱', false, 11, 'personal', 'yo'),
  ('Personal', 'Seguridad social', 'gasto', '🧾', true, 12, 'personal', 'yo'),
  ('Personal', 'Tecnología', 'gasto', '🖥️', false, 13, 'personal', 'yo'),
  ('Otros', 'Transferencias a terceros', 'gasto', '👥', false, 4, 'personal', null),
  ('Otros', 'Préstamos que hice', 'gasto', '🤲', false, 5, 'personal', null),
  ('Deudas y ahorro', 'Fondos e inversiones', 'gasto', '📈', false, 6, 'personal', 'yo'),
  ('Ingresos', 'Clientes y proyectos', 'ingreso', '🤝', false, 5, 'freelance', null),
  ('Ingresos', 'Transferencias recibidas', 'ingreso', '📥', false, 6, 'personal', null),
  ('Ingresos', 'Intereses', 'ingreso', '🏦', false, 7, 'personal', null),
  ('Ingresos', 'Reintegros y devoluciones', 'ingreso', '↩️', false, 8, 'personal', null),
  ('Ingresos', 'Préstamos que me pagan', 'ingreso', '🤲', false, 9, 'personal', null)
) as n(grupo, nombre, tipo, icono, fijo, orden, bolsa, benef) on g.nombre = n.grupo and g.parent_id is null
on conflict on constraint categories_unique_nombre do nothing;

update public.accounts
set saldo_inicial = 8457227, saldo_inicial_fecha = date '2025-12-09'
where nombre = 'Bancolombia';
