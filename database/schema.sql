-- =====================================================================
-- LogisYa · base de datos para Supabase
-- Pegar completo en SQL Editor y darle Run.
-- Se puede volver a correr: borra las tablas y las crea de nuevo con
-- los datos de ejemplo (los usuarios de Authentication no se borran).
-- =====================================================================

-- ---------- 0. Limpieza ----------
drop table if exists reemplazos, asistencias, postulaciones, convocatorias,
  vacantes, eventos, operador_trabajador, trabajadores, operadores cascade;
drop function if exists stats_trabajador(uuid) cascade;
drop function if exists historial_trabajador(uuid) cascade;

-- ---------- 1. Tablas ----------
create table operadores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users(id) on delete set null,
  email       text unique not null,
  nombre      text not null,
  compartir   boolean not null default true,          -- bolsa recíproca
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_at  timestamptz not null default now()
);

create table trabajadores (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique references auth.users(id) on delete set null,
  email           text unique,
  nombre          text not null,
  roles           text[] not null default '{}',
  zona            text not null,
  disp            int[]  not null default '{0,5,6}',  -- 0=dom ... 6=sáb
  en_bolsa        boolean not null default true,
  desde           date not null default current_date, -- fecha de autorización Ley 1581
  rating_base     numeric(2,1) not null default 5.0,  -- calificación traída de antes
  eventos_previos int not null default 0,
  asis_previa     int not null default 100,
  created_at      timestamptz not null default now()
);

create table operador_trabajador (                    -- "mi personal"
  operador_id   uuid references operadores(id) on delete cascade,
  trabajador_id uuid references trabajadores(id) on delete cascade,
  primary key (operador_id, trabajador_id)
);

create table eventos (
  id          uuid primary key default gen_random_uuid(),
  operador_id uuid not null references operadores(id) on delete cascade,
  nombre      text not null,
  fecha       date not null,
  lugar       text not null,
  zona        text not null,
  created_at  timestamptz not null default now()
);

create table vacantes (
  id        uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  rol       text not null,
  hora_ini  time not null,
  hora_fin  time not null,
  cupos     int  not null check (cupos > 0),
  tarifa    int  not null check (tarifa >= 0),
  fase      text not null default 'propio' check (fase in ('propio','general')),
  cierre    timestamptz not null,                     -- fin del plazo solo para mi personal
  bloqueada boolean not null default false
);

create table convocatorias (
  vacante_id    uuid references vacantes(id) on delete cascade,
  trabajador_id uuid references trabajadores(id) on delete cascade,
  primary key (vacante_id, trabajador_id)
);

create table postulaciones (
  id            uuid primary key default gen_random_uuid(),
  vacante_id    uuid not null references vacantes(id) on delete cascade,
  trabajador_id uuid not null references trabajadores(id) on delete cascade,
  estado        text not null default 'pendiente'
                check (estado in ('pendiente','confirmado','rechazado','ausente')),
  origen        text not null default 'propio'
                check (origen in ('propio','bolsa','reemplazo')),
  created_at    timestamptz not null default now(),
  unique (vacante_id, trabajador_id)
);

create table asistencias (
  postulacion_id uuid primary key references postulaciones(id) on delete cascade,
  entrada        time,
  salida         time,
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente','presente','ausente')),
  calificacion   int check (calificacion between 1 and 5)
);

create table reemplazos (
  vacante_id  uuid primary key references vacantes(id) on delete cascade,
  ausente_id  uuid references trabajadores(id) on delete set null,
  inicio      timestamptz not null default now(),
  notificados uuid[] not null default '{}'
);

create index on eventos(operador_id);
create index on vacantes(evento_id);
create index on postulaciones(trabajador_id);
create index on postulaciones(vacante_id);

-- ---------- 2. Funciones de apoyo ----------
create or replace function hoy() returns date
language sql stable as $$ select (now() at time zone 'America/Bogota')::date $$;

create or replace function mi_operador() returns uuid
language sql stable security definer set search_path = public as $$
  select id from operadores where user_id = auth.uid()
$$;

create or replace function mi_trabajador() returns uuid
language sql stable security definer set search_path = public as $$
  select id from trabajadores where user_id = auth.uid()
$$;

create or replace function confirmados(p_vacante uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from postulaciones
  where vacante_id = p_vacante and estado = 'confirmado'
$$;

create or replace function es_mi_evento(p_evento uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from eventos where id = p_evento and operador_id = mi_operador())
$$;

create or replace function es_mi_vacante(p_vacante uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vacantes v join eventos e on e.id = v.evento_id
    where v.id = p_vacante and e.operador_id = mi_operador())
$$;

-- Equivale a visible() del MVP
create or replace function puede_ver_vacante(p_vacante uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  t uuid := mi_trabajador();
  r record;
begin
  if es_mi_vacante(p_vacante) then return true; end if;
  if t is null then return false; end if;

  select v.fase, e.operador_id, e.fecha, o.compartir into r
  from vacantes v join eventos e on e.id = v.evento_id
  join operadores o on o.id = e.operador_id
  where v.id = p_vacante;
  if not found then return false; end if;

  -- si ya se postuló, siempre la ve (para su historial)
  if exists (select 1 from postulaciones where vacante_id = p_vacante and trabajador_id = t) then
    return true;
  end if;
  if r.fecha < hoy() then return false; end if;

  if exists (select 1 from reemplazos where vacante_id = p_vacante and t = any(notificados)) then
    return true;
  end if;

  if exists (select 1 from operador_trabajador where operador_id = r.operador_id and trabajador_id = t)
     and (r.fase = 'general'
          or exists (select 1 from convocatorias where vacante_id = p_vacante and trabajador_id = t)) then
    return true;
  end if;

  return r.fase = 'general' and r.compartir
     and exists (select 1 from trabajadores where id = t and en_bolsa);
end $$;

create or replace function puede_ver_evento(p_evento uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select es_mi_evento(p_evento)
      or exists (select 1 from vacantes where evento_id = p_evento and puede_ver_vacante(id))
$$;

-- Qué trabajadores puede ver un operador (su equipo, sus postulantes y la bolsa recíproca)
create or replace function puede_ver_trabajador(p_trab uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare o uuid := mi_operador();
begin
  if p_trab = mi_trabajador() then return true; end if;
  if o is null then return false; end if;
  if exists (select 1 from operador_trabajador where operador_id = o and trabajador_id = p_trab) then
    return true;
  end if;
  if exists (select 1 from postulaciones p join vacantes v on v.id = p.vacante_id
             join eventos e on e.id = v.evento_id
             where p.trabajador_id = p_trab and e.operador_id = o) then
    return true;
  end if;
  return exists (select 1 from operadores where id = o and compartir)
     and exists (select 1 from trabajadores t where t.id = p_trab and t.en_bolsa
                 and exists (select 1 from operador_trabajador ot join operadores op on op.id = ot.operador_id
                             where ot.trabajador_id = t.id and op.compartir));
end $$;

-- Calificación, eventos trabajados y % de asistencia
create function stats_trabajador(p_trab uuid, out rating numeric, out eventos int, out asistencia int)
language sql stable security definer set search_path = public as $$
  with a as (
    select a.estado, a.calificacion
    from asistencias a
    join postulaciones p on p.id = a.postulacion_id
    join vacantes v on v.id = p.vacante_id
    join eventos e on e.id = v.evento_id
    where p.trabajador_id = p_trab and e.fecha <= hoy()
  ), c as (
    select coalesce(sum(calificacion), 0) as suma,
           count(calificacion) as n,
           count(*) filter (where estado = 'presente') as pres,
           count(*) filter (where estado = 'ausente')  as aus
    from a
  )
  select round((t.rating_base + c.suma) / (1 + c.n), 1),
         (t.eventos_previos + c.pres)::int,
         coalesce(round((t.asis_previa * t.eventos_previos + 100.0 * c.pres)
                        / nullif(t.eventos_previos + c.pres + c.aus, 0))::int, 100)
  from trabajadores t, c
  where t.id = p_trab
$$;

-- Vista para listar personas con sus números (respeta los permisos de trabajadores)
create view v_trabajadores with (security_invoker = true) as
  select t.id, t.nombre, t.roles, t.zona, t.disp, t.en_bolsa, t.desde,
         s.rating, s.eventos, s.asistencia
  from trabajadores t
  cross join lateral stats_trabajador(t.id) s;

-- Vacantes con cuántos cupos van confirmados (el trabajador no ve las postulaciones de otros)
create view v_vacantes with (security_invoker = true) as
  select v.*, confirmados(v.id) as confirmados
  from vacantes v;

create function historial_trabajador(p_trab uuid)
returns table (fecha date, evento text, rol text, operador text, estado text)
language sql stable security definer set search_path = public as $$
  select e.fecha, e.nombre, v.rol, o.nombre, coalesce(a.estado, p.estado)
  from postulaciones p
  join vacantes v on v.id = p.vacante_id
  join eventos e on e.id = v.evento_id
  join operadores o on o.id = e.operador_id
  left join asistencias a on a.postulacion_id = p.id
  where p.trabajador_id = p_trab
    and p.estado in ('confirmado','ausente')
    and e.fecha <= hoy()
    and puede_ver_trabajador(p_trab)
  order by e.fecha desc
  limit 20
$$;

-- ---------- 3. Seguridad por filas (RLS) ----------
alter table operadores          enable row level security;
alter table trabajadores        enable row level security;
alter table operador_trabajador enable row level security;
alter table eventos             enable row level security;
alter table vacantes            enable row level security;
alter table convocatorias       enable row level security;
alter table postulaciones       enable row level security;
alter table asistencias         enable row level security;
alter table reemplazos          enable row level security;

create policy "ver operadores" on operadores for select to authenticated using (true);
create policy "editar mi empresa" on operadores for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "ver trabajadores" on trabajadores for select to authenticated
  using (puede_ver_trabajador(id));
create policy "editar mi perfil" on trabajadores for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "ver vinculos" on operador_trabajador for select to authenticated
  using (operador_id = mi_operador() or trabajador_id = mi_trabajador());

create policy "ver eventos" on eventos for select to authenticated using (puede_ver_evento(id));
create policy "editar mis eventos" on eventos for update to authenticated
  using (operador_id = mi_operador()) with check (operador_id = mi_operador());
create policy "borrar mis eventos" on eventos for delete to authenticated
  using (operador_id = mi_operador());

create policy "ver vacantes" on vacantes for select to authenticated using (puede_ver_vacante(id));
create policy "editar mis vacantes" on vacantes for update to authenticated
  using (es_mi_evento(evento_id)) with check (es_mi_evento(evento_id));
create policy "borrar mis vacantes" on vacantes for delete to authenticated
  using (es_mi_evento(evento_id));

create policy "ver convocatorias" on convocatorias for select to authenticated
  using (es_mi_vacante(vacante_id) or trabajador_id = mi_trabajador());

create policy "ver postulaciones" on postulaciones for select to authenticated
  using (es_mi_vacante(vacante_id) or trabajador_id = mi_trabajador());

create policy "ver asistencias" on asistencias for select to authenticated
  using (exists (select 1 from postulaciones p where p.id = postulacion_id
                 and (es_mi_vacante(p.vacante_id) or p.trabajador_id = mi_trabajador())));

create policy "ver reemplazos" on reemplazos for select to authenticated
  using (es_mi_vacante(vacante_id) or mi_trabajador() = any(notificados));

-- Las escrituras importantes pasan por las funciones de abajo, que validan las reglas.

-- ---------- 4. Reglas del negocio (se llaman desde React con supabase.rpc) ----------

-- Fase 1 → Fase 2 (equivale a tick() del MVP)
create or replace function avanzar_fases() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update vacantes v
     set fase = case when o.compartir then 'general' else v.fase end,
         bloqueada = not o.compartir
    from eventos e join operadores o on o.id = e.operador_id
   where e.id = v.evento_id
     and v.fase = 'propio'
     and now() >= v.cierre
     and confirmados(v.id) < v.cupos;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function registrar_operador(p_nombre text) returns uuid
language plpgsql security definer set search_path = public as $$
declare o uuid := mi_operador();
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  if o is not null then return o; end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'Escribe el nombre de la empresa'; end if;
  insert into operadores (user_id, email, nombre)
  values (auth.uid(), (select email from auth.users where id = auth.uid()), trim(p_nombre))
  returning id into o;
  return o;
end $$;

create or replace function unirme_con_invitacion(p_codigo text, p_nombre text, p_roles text[],
                                                 p_zona text, p_en_bolsa boolean default true)
returns uuid language plpgsql security definer set search_path = public as $$
declare o uuid; t uuid;
begin
  if auth.uid() is null then raise exception 'Inicia sesión primero'; end if;
  select id into o from operadores where invite_code = upper(trim(p_codigo));
  if o is null then raise exception 'El código de invitación no es válido'; end if;
  if coalesce(array_length(p_roles, 1), 0) = 0 then raise exception 'Elige al menos un rol'; end if;
  t := mi_trabajador();
  if t is null then
    insert into trabajadores (user_id, email, nombre, roles, zona, en_bolsa)
    values (auth.uid(), (select email from auth.users where id = auth.uid()),
            trim(p_nombre), p_roles, p_zona, p_en_bolsa)
    returning id into t;
  end if;
  insert into operador_trabajador values (o, t) on conflict do nothing;
  return t;
end $$;

-- p_vacantes: [{"rol":"Mesero/a","ini":"18:00","fin":"23:00","cupos":2,"tarifa":110000}, ...]
create or replace function crear_evento(p_nombre text, p_fecha date, p_lugar text, p_zona text,
                                        p_plazo_horas int, p_vacantes jsonb,
                                        p_convocar boolean default true)
returns uuid language plpgsql security definer set search_path = public as $$
declare o uuid := mi_operador(); e uuid; v uuid; x jsonb;
begin
  if o is null then raise exception 'Solo los operadores pueden crear eventos'; end if;
  if coalesce(trim(p_nombre), '') = '' or coalesce(trim(p_lugar), '') = '' then
    raise exception 'Completa el nombre del evento y el lugar';
  end if;
  if p_fecha < hoy() then raise exception 'La fecha no puede ser anterior a hoy'; end if;
  if jsonb_array_length(p_vacantes) = 0 then raise exception 'Agrega al menos un rol'; end if;

  insert into eventos (operador_id, nombre, fecha, lugar, zona)
  values (o, trim(p_nombre), p_fecha, trim(p_lugar), p_zona) returning id into e;

  for x in select * from jsonb_array_elements(p_vacantes) loop
    insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, cierre)
    values (e, x->>'rol', (x->>'ini')::time, (x->>'fin')::time,
            greatest(1, (x->>'cupos')::int), greatest(0, (x->>'tarifa')::int),
            now() + make_interval(hours => p_plazo_horas))
    returning id into v;
    if p_convocar then
      insert into convocatorias
      select v, ot.trabajador_id
      from operador_trabajador ot join trabajadores t on t.id = ot.trabajador_id
      where ot.operador_id = o and (x->>'rol') = any(t.roles);
    end if;
  end loop;
  return e;
end $$;

create or replace function convocar_mi_personal(p_vacante uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not es_mi_vacante(p_vacante) then raise exception 'No autorizado'; end if;
  insert into convocatorias
  select p_vacante, ot.trabajador_id
  from operador_trabajador ot
  join trabajadores t on t.id = ot.trabajador_id
  join vacantes v on v.id = p_vacante
  join eventos e on e.id = v.evento_id
  where ot.operador_id = e.operador_id and v.rol = any(t.roles)
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function abrir_al_general(p_vacante uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_mi_vacante(p_vacante) then raise exception 'No autorizado'; end if;
  if not exists (select 1 from operadores where id = mi_operador() and compartir) then
    raise exception 'Activa "Compartir mi personal" para publicar en el calendario general';
  end if;
  update vacantes set fase = 'general', bloqueada = false where id = p_vacante;
end $$;

create or replace function postularme(p_vacante uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t uuid := mi_trabajador(); r record; org text;
begin
  if t is null then raise exception 'Solo los trabajadores pueden postularse'; end if;
  if not puede_ver_vacante(p_vacante) then raise exception 'No tienes acceso a esta vacante'; end if;
  select v.rol, v.cupos, e.operador_id into r
  from vacantes v join eventos e on e.id = v.evento_id where v.id = p_vacante;
  if not exists (select 1 from trabajadores where id = t and r.rol = any(roles)) then
    raise exception 'Este rol no está en tu perfil';
  end if;
  if confirmados(p_vacante) >= r.cupos then raise exception 'La vacante ya no tiene cupos'; end if;
  org := case
    when exists (select 1 from reemplazos where vacante_id = p_vacante and t = any(notificados)) then 'reemplazo'
    when exists (select 1 from operador_trabajador where operador_id = r.operador_id and trabajador_id = t) then 'propio'
    else 'bolsa' end;
  insert into postulaciones (vacante_id, trabajador_id, origen)
  values (p_vacante, t, org) on conflict do nothing;
end $$;

create or replace function responder_postulacion(p_post uuid, p_estado text) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select p.vacante_id, v.cupos into r
  from postulaciones p join vacantes v on v.id = p.vacante_id where p.id = p_post;
  if r.vacante_id is null or not es_mi_vacante(r.vacante_id) then raise exception 'No autorizado'; end if;
  if p_estado not in ('confirmado','rechazado') then raise exception 'Estado no válido'; end if;
  if p_estado = 'confirmado' and confirmados(r.vacante_id) >= r.cupos then
    raise exception 'El cupo ya está completo';
  end if;
  update postulaciones set estado = p_estado where id = p_post;
  if p_estado = 'confirmado' then
    insert into asistencias (postulacion_id) values (p_post) on conflict do nothing;
  end if;
end $$;

create or replace function registrar_asistencia(p_post uuid, p_entrada time, p_salida time, p_cal int default null)
returns void language plpgsql security definer set search_path = public as $$
declare vac uuid;
begin
  select vacante_id into vac from postulaciones where id = p_post;
  if vac is null or not es_mi_vacante(vac) then raise exception 'No autorizado'; end if;
  if p_salida is not null and p_entrada is null then raise exception 'Registra primero la entrada'; end if;
  if coalesce(p_cal, 0) > 0 and p_salida is null then
    raise exception 'La calificación se habilita al registrar la salida';
  end if;
  insert into asistencias (postulacion_id, entrada, salida, calificacion, estado)
  values (p_post, p_entrada, p_salida, nullif(p_cal, 0),
          case when p_entrada is null then 'pendiente' else 'presente' end)
  on conflict (postulacion_id) do update
    set entrada = excluded.entrada, salida = excluded.salida,
        calificacion = excluded.calificacion, estado = excluded.estado;
end $$;

-- Marca ausente y notifica hasta 5 reemplazos (equivale a marcarAusente + candidatosReemplazo)
create or replace function marcar_ausente(p_post uuid) returns int
language plpgsql security definer set search_path = public as $$
declare r record; c uuid[];
begin
  select p.trabajador_id, p.vacante_id, v.rol, e.fecha, e.operador_id, o.compartir into r
  from postulaciones p
  join vacantes v on v.id = p.vacante_id
  join eventos e on e.id = v.evento_id
  join operadores o on o.id = e.operador_id
  where p.id = p_post;
  if r.vacante_id is null or not es_mi_vacante(r.vacante_id) then raise exception 'No autorizado'; end if;

  update postulaciones set estado = 'ausente' where id = p_post;
  insert into asistencias (postulacion_id, estado) values (p_post, 'ausente')
  on conflict (postulacion_id) do update set estado = 'ausente', entrada = null, salida = null;

  select coalesce(array_agg(id), '{}') into c from (
    select t.id
    from trabajadores t
    where r.rol = any(t.roles)
      and extract(dow from r.fecha)::int = any(t.disp)
      and not exists (select 1 from postulaciones x where x.vacante_id = r.vacante_id and x.trabajador_id = t.id)
      and (exists (select 1 from operador_trabajador ot where ot.operador_id = r.operador_id and ot.trabajador_id = t.id)
           or (t.en_bolsa and r.compartir))
      and not exists (select 1 from postulaciones x join vacantes y on y.id = x.vacante_id
                      join eventos z on z.id = y.evento_id
                      where x.trabajador_id = t.id and x.estado = 'confirmado' and z.fecha = r.fecha)
    order by (stats_trabajador(t.id)).rating desc
    limit 5
  ) s;

  insert into reemplazos (vacante_id, ausente_id, notificados)
  values (r.vacante_id, r.trabajador_id, c)
  on conflict (vacante_id) do update
    set ausente_id = excluded.ausente_id, inicio = now(), notificados = excluded.notificados;

  return coalesce(array_length(c, 1), 0);
end $$;

-- ---------- 5. Vincular cuentas de Authentication con los datos por correo ----------
create or replace function vincular_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update operadores   set user_id = new.id where lower(email) = lower(new.email) and user_id is null;
  update trabajadores set user_id = new.id where lower(email) = lower(new.email) and user_id is null;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.vincular_usuario();

-- ---------- 6. Datos de ejemplo ----------
create or replace function _o(c text) returns uuid language sql stable set search_path = public as $$
  select id from operadores where email = c || '@logisya.demo' $$;
create or replace function _w(c text) returns uuid language sql stable set search_path = public as $$
  select id from trabajadores where email = c || '@logisya.demo' $$;
create or replace function _post(v uuid, w text, est text, org text) returns uuid
language sql set search_path = public as $$
  insert into postulaciones (vacante_id, trabajador_id, estado, origen)
  values (v, _w(w), est, org) returning id $$;

-- Borra todo y carga los datos de ejemplo con fechas relativas a hoy.
-- Correr "select reset_demo();" en SQL Editor un día antes de entregar.
create or replace function reset_demo() returns void
language plpgsql security definer set search_path = public as $$
declare d0 date := hoy(); e uuid; v uuid; p uuid;
begin
  truncate reemplazos, asistencias, postulaciones, convocatorias, vacantes, eventos,
           operador_trabajador, trabajadores, operadores cascade;

  insert into operadores (email, nombre, compartir, invite_code) values
    ('caribe@logisya.demo',   'Eventos Caribe BTL',  true,  'ECB7Q2'),
    ('arenosa@logisya.demo',  'Catering La Arenosa', true,  'CLA3M8'),
    ('montajes@logisya.demo', 'Montajes del Norte',  false, 'MDN9K1');

  insert into trabajadores (email, nombre, roles, zona, disp, rating_base, eventos_previos, asis_previa, en_bolsa, desde) values
    ('andrea@logisya.demo',   'Andrea Pérez',      array['Mesero/a','Anfitrión/a'],                    'Norte-Centro Histórico', '{0,5,6}',         4.8, 23,  96, true,  '2026-03-02'),
    ('carlos@logisya.demo',   'Carlos Ariza',      array['Logístico de montaje'],                      'Soledad',                '{1,2,3,4,5,6}',   4.5, 41,  93, true,  '2026-02-11'),
    ('daniela@logisya.demo',  'Daniela Charris',   array['Bartender','Mesero/a'],                      'Riomar',                 '{4,5,6}',         4.9, 30, 100, true,  '2026-01-20'),
    ('jhon@logisya.demo',     'Jhon Fontalvo',     array['Logístico de montaje','Supervisor de piso'], 'Metropolitana',          '{0,1,2,3,4,5,6}', 4.2, 55,  88, true,  '2025-11-03'),
    ('valentina@logisya.demo','Valentina Rojas',   array['Promotor/a BTL','Anfitrión/a'],              'Norte-Centro Histórico', '{5,6}',           4.7, 18,  94, true,  '2026-04-08'),
    ('luis@logisya.demo',     'Luis Mercado',      array['Mesero/a'],                                  'Sur Occidente',          '{0,5,6}',         3.9, 12,  83, false, '2026-05-15'),
    ('mariana@logisya.demo',  'Mariana De la Hoz', array['Anfitrión/a','Promotor/a BTL'],              'Riomar',                 '{3,4,5,6}',       4.6,  9, 100, true,  '2026-07-01'),
    ('kevin@logisya.demo',    'Kevin Barrios',     array['Bartender'],                                 'Puerto Colombia',        '{0,5,6}',         4.4, 27,  92, true,  '2026-02-27'),
    ('yuleisy@logisya.demo',  'Yuleisy Ospino',    array['Mesero/a','Bartender'],                      'Soledad',                '{0,5,6}',         4.3, 15,  90, true,  '2026-03-30'),
    ('andres@logisya.demo',   'Andrés Molina',     array['Supervisor de piso'],                        'Riomar',                 '{0,1,2,3,4,5,6}', 4.8, 62,  98, true,  '2025-10-12'),
    ('sharon@logisya.demo',   'Sharon Cantillo',   array['Promotor/a BTL'],                            'Sur Occidente',          '{1,2,3,4,5}',     4.1,  7,  86, true,  '2026-08-04'),
    ('ricardo@logisya.demo',  'Ricardo Pacheco',   array['Logístico de montaje'],                      'Metropolitana',          '{0,6}',           4.0, 33,  91, true,  '2026-01-09'),
    ('kelly@logisya.demo',    'Kelly Mendoza',     array['Mesero/a','Anfitrión/a'],                    'Riomar',                 '{0,4,5,6}',       4.6, 21,  95, true,  '2026-02-02');

  insert into operador_trabajador
  select _o(x.o), _w(x.w) from (values
    ('caribe','andrea'),('caribe','carlos'),('caribe','valentina'),('caribe','mariana'),
    ('caribe','andres'),('caribe','ricardo'),
    ('arenosa','daniela'),('arenosa','luis'),('arenosa','kevin'),('arenosa','sharon'),('arenosa','kelly'),
    ('montajes','jhon'),('montajes','yuleisy')) as x(o, w);

  -- Cena de gala (hoy) · Eventos Caribe BTL
  insert into eventos (operador_id, nombre, fecha, lugar, zona)
  values (_o('caribe'), 'Cena de gala aniversario corporativo', d0, 'Hotel El Prado', 'Norte-Centro Histórico')
  returning id into e;
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Mesero/a', '17:00', '01:00', 3, 130000, 'general', now() - interval '3 days') returning id into v;
  insert into convocatorias values (v, _w('andrea'));
  p := _post(v, 'andrea',  'confirmado', 'propio'); insert into asistencias (postulacion_id, entrada, estado) values (p, '16:52', 'presente');
  p := _post(v, 'daniela', 'confirmado', 'bolsa');  insert into asistencias (postulacion_id, entrada, estado) values (p, '17:04', 'presente');
  p := _post(v, 'yuleisy', 'confirmado', 'bolsa');  insert into asistencias (postulacion_id) values (p);
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Supervisor de piso', '16:00', '01:00', 1, 180000, 'propio', now() - interval '4 days') returning id into v;
  insert into convocatorias values (v, _w('andres'));
  p := _post(v, 'andres', 'confirmado', 'propio'); insert into asistencias (postulacion_id, entrada, estado) values (p, '15:48', 'presente');

  -- Activación de marca (en 7 días) · plazo propio vence en 6 horas
  insert into eventos (operador_id, nombre, fecha, lugar, zona)
  values (_o('caribe'), 'Activación de marca · Festival Gastronómico', d0 + 7, 'Malecón del Río', 'Norte-Centro Histórico')
  returning id into e;
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Promotor/a BTL', '15:00', '22:00', 6, 110000, 'propio', now() + interval '6 hours') returning id into v;
  insert into convocatorias values (v, _w('valentina')), (v, _w('mariana'));
  perform _post(v, 'valentina', 'confirmado', 'propio');
  perform _post(v, 'mariana',   'pendiente',  'propio');
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Anfitrión/a', '16:00', '22:00', 2, 105000, 'propio', now() + interval '6 hours') returning id into v;
  insert into convocatorias values (v, _w('andrea')), (v, _w('valentina')), (v, _w('mariana'));
  perform _post(v, 'andrea', 'confirmado', 'propio');

  -- Congreso de Ingeniería (en 13 días)
  insert into eventos (operador_id, nombre, fecha, lugar, zona)
  values (_o('caribe'), 'Congreso Regional de Ingeniería', d0 + 13, 'Centro de Eventos Puerta de Oro', 'Norte-Centro Histórico')
  returning id into e;
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Anfitrión/a', '07:00', '15:00', 4, 100000, 'general', now() - interval '1 day') returning id into v;
  insert into convocatorias values (v, _w('andrea')), (v, _w('valentina')), (v, _w('mariana'));
  perform _post(v, 'mariana', 'pendiente', 'propio');
  perform _post(v, 'kelly',   'pendiente', 'bolsa');
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Supervisor de piso', '06:30', '16:00', 1, 170000, 'propio', now() + interval '5 days') returning id into v;
  insert into convocatorias values (v, _w('andres'));
  perform _post(v, 'andres', 'confirmado', 'propio');
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Logístico de montaje', '05:00', '13:00', 5, 95000, 'general', now() - interval '1 day') returning id into v;
  insert into convocatorias values (v, _w('carlos')), (v, _w('ricardo'));
  perform _post(v, 'carlos',  'confirmado', 'propio');
  perform _post(v, 'ricardo', 'confirmado', 'propio');
  perform _post(v, 'jhon',    'pendiente',  'bolsa');

  -- Feria Inmobiliaria (en 28 días)
  insert into eventos (operador_id, nombre, fecha, lugar, zona)
  values (_o('caribe'), 'Feria Inmobiliaria del Caribe', d0 + 28, 'Plaza de la Paz', 'Norte-Centro Histórico')
  returning id into e;
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Promotor/a BTL', '10:00', '19:00', 8, 115000, 'propio', now() + interval '10 days');

  -- Catering La Arenosa
  insert into eventos (operador_id, nombre, fecha, lugar, zona)
  values (_o('arenosa'), 'Almuerzo empresarial de fin de año', d0 + 5, 'Hotel sobre la Vía 40', 'Riomar')
  returning id into e;
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Mesero/a', '11:00', '16:00', 4, 90000, 'general', now() - interval '2 days') returning id into v;
  perform _post(v, 'luis', 'confirmado', 'propio');

  insert into eventos (operador_id, nombre, fecha, lugar, zona)
  values (_o('arenosa'), 'Matrimonio en club social', d0 + 14, 'Country Club de Barranquilla', 'Riomar')
  returning id into e;
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Mesero/a', '18:00', '02:00', 10, 140000, 'general', now() - interval '1 day') returning id into v;
  perform _post(v, 'kelly', 'confirmado', 'propio');
  perform _post(v, 'luis',  'confirmado', 'propio');
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Bartender', '18:00', '02:00', 3, 150000, 'propio', now() + interval '2 days') returning id into v;
  insert into convocatorias values (v, _w('daniela')), (v, _w('kevin'));
  perform _post(v, 'kevin', 'confirmado', 'propio');

  -- Montajes del Norte (no comparte su personal)
  insert into eventos (operador_id, nombre, fecha, lugar, zona)
  values (_o('montajes'), 'Montaje de concierto', d0 + 20, 'Estadio Metropolitano', 'Metropolitana')
  returning id into e;
  insert into vacantes (evento_id, rol, hora_ini, hora_fin, cupos, tarifa, fase, cierre)
  values (e, 'Logístico de montaje', '06:00', '18:00', 20, 120000, 'propio', now() + interval '4 days') returning id into v;
  insert into convocatorias values (v, _w('jhon'));
  perform _post(v, 'jhon', 'confirmado', 'propio');

  -- Volver a enlazar las cuentas de Authentication que ya existan
  update operadores o   set user_id = u.id from auth.users u where lower(u.email) = lower(o.email);
  update trabajadores t set user_id = u.id from auth.users u where lower(u.email) = lower(t.email);
end $$;

-- Permisos para la app (los proyectos nuevos de Supabase no los dan solos).
-- RLS sigue decidiendo qué filas ve y cambia cada usuario.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- Las funciones de mantenimiento no se pueden llamar desde la app
revoke execute on function reset_demo() from public, anon, authenticated;
revoke execute on function _o(text), _w(text), _post(uuid, text, text, text) from public, anon, authenticated;

-- ---------- 7. Tiempo real (para que operador y trabajador se vean al instante) ----------
do $$ begin
  alter publication supabase_realtime add table eventos, vacantes, convocatorias, postulaciones, asistencias, reemplazos;
exception when others then raise notice 'Realtime: %', sqlerrm;
end $$;

-- ---------- 8. Revisión automática de plazos cada 5 minutos ----------
do $$ begin
  create extension if not exists pg_cron with schema pg_catalog;
  perform cron.schedule('logisya-avanzar-fases', '*/5 * * * *', 'select public.avanzar_fases()');
exception when others then
  raise notice 'pg_cron no quedó activo (%). Actívalo en Database > Extensions y vuelve a correr esta parte.', sqlerrm;
end $$;

-- ---------- 9. Cargar los datos ----------
select reset_demo();
notify pgrst, 'reload schema';
