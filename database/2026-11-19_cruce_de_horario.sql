-- =====================================================================
-- LogisYa · cambio del 19 de noviembre de 2026
-- Confirmar una postulación ahora:
--   1. bloquea al trabajador y a la vacante mientras se confirma, para que
--      dos operadores no puedan llenar el mismo cupo o confirmar a la misma
--      persona al mismo tiempo
--   2. revisa que haya cupo
--   3. revisa que la persona no tenga otro turno confirmado que se cruce,
--      con cualquier operador, sin mostrar datos de la otra empresa
-- Pegar en el SQL Editor de Supabase y darle Run. No borra datos.
-- =====================================================================

-- Inicio y fin reales de un turno (si termina después de medianoche, el fin es al otro día)
create or replace function turno_inicio(p_fecha date, p_ini time) returns timestamp
language sql immutable as $$ select p_fecha + p_ini $$;

create or replace function turno_fin(p_fecha date, p_ini time, p_fin time) returns timestamp
language sql immutable as $$
  select p_fecha + p_fin + case when p_fin <= p_ini then interval '1 day' else interval '0' end
$$;

create or replace function responder_postulacion(p_post uuid, p_estado text) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select p.vacante_id, p.trabajador_id, p.estado, v.cupos, v.hora_ini, v.hora_fin, e.fecha into r
  from postulaciones p
  join vacantes v on v.id = p.vacante_id
  join eventos e on e.id = v.evento_id
  where p.id = p_post;

  if r.vacante_id is null or not es_mi_vacante(r.vacante_id) then raise exception 'No autorizado'; end if;
  if p_estado not in ('confirmado','rechazado') then raise exception 'Estado no válido'; end if;

  if p_estado = 'confirmado' then
    -- Bloqueo: siempre primero el trabajador y después la vacante, para no trabar dos confirmaciones
    perform 1 from trabajadores where id = r.trabajador_id for update;
    perform 1 from vacantes where id = r.vacante_id for update;

    if r.estado = 'confirmado' then return; end if;

    if confirmados(r.vacante_id) >= r.cupos then
      raise exception 'El cupo ya está completo';
    end if;

    if exists (
      select 1
      from postulaciones x
      join vacantes y on y.id = x.vacante_id
      join eventos z on z.id = y.evento_id
      where x.trabajador_id = r.trabajador_id
        and x.estado = 'confirmado'
        and x.vacante_id <> r.vacante_id
        and turno_inicio(z.fecha, y.hora_ini) < turno_fin(r.fecha, r.hora_ini, r.hora_fin)
        and turno_inicio(r.fecha, r.hora_ini) < turno_fin(z.fecha, y.hora_ini, y.hora_fin)
    ) then
      raise exception 'No se puede confirmar: esta persona ya tiene un turno confirmado que se cruza con este horario';
    end if;
  end if;

  update postulaciones set estado = p_estado where id = p_post;
  if p_estado = 'confirmado' then
    insert into asistencias (postulacion_id) values (p_post) on conflict do nothing;
  end if;
end $$;

grant execute on function turno_inicio(date, time), turno_fin(date, time, time) to authenticated;
notify pgrst, 'reload schema';
