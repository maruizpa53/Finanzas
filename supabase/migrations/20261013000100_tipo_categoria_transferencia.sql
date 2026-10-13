-- Las transferencias también tienen categoría (estilo Monarch): entre mis cuentas,
-- pago de tarjeta, retiro de efectivo, cambio de divisas… Nunca cuentan como gasto.
alter type public.tipo_categoria add value if not exists 'transferencia';

-- Etiquetas agrupadas: "Para quién", "Actividad", "Tipo de gasto", "Seguimiento"…
alter table public.tags
  add column if not exists grupo text not null default 'Otras',
  add column if not exists descripcion text;
