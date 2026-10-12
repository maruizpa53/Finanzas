-- Feed de calendario (ICS) para suscribirse desde Google Calendar.
-- Google no puede iniciar sesión, así que el feed se protege con un token secreto
-- largo guardado en user_settings. La función solo devuelve fechas y nombres de pagos.
alter table public.user_settings
  add column calendario_token text unique;

create or replace function public.calendario_feed(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if p_token is null or length(p_token) < 32 then
    return null;
  end if;
  select user_id into v_user from public.user_settings where calendario_token = p_token;
  if v_user is null then
    return null;
  end if;
  return jsonb_build_object(
    'recurrentes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'nombre', r.nombre, 'monto', r.monto_esperado, 'variable', r.es_variable,
        'frecuencia', r.frecuencia, 'dia', r.dia_pago, 'tipo', r.tipo))
      from public.recurring_items r
      where r.user_id = v_user and r.activo and r.dia_pago is not null and r.frecuencia <> 'diaria_habil'
    ), '[]'::jsonb),
    'deudas', coalesce((
      select jsonb_agg(jsonb_build_object('id', d.id, 'nombre', d.acreedor, 'monto', d.cuota, 'dia', d.dia_pago))
      from public.debts d
      where d.user_id = v_user and d.estado = 'activa' and d.dia_pago is not null
    ), '[]'::jsonb),
    'tarjetas', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'nombre', a.nombre, 'corte', a.dia_corte, 'pago', a.dia_pago))
      from public.accounts a
      where a.user_id = v_user and a.activa and a.tipo = 'credito' and (a.dia_corte is not null or a.dia_pago is not null)
    ), '[]'::jsonb),
    'proyectos', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'nombre', p.nombre, 'emoji', p.emoji, 'inicio', p.fecha_inicio, 'fin', p.fecha_fin))
      from public.projects p
      where p.user_id = v_user and p.activo and p.fecha_inicio is not null
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.calendario_feed(text) from public;
grant execute on function public.calendario_feed(text) to anon, authenticated;
