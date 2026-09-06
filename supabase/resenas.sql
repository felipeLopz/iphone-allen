-- =====================================================================
-- IPHONE ALLEN — reseñas de clientes con moderación
-- =====================================================================
-- Cómo se aplica:
--   Panel de Supabase → SQL Editor → New query → pegar TODO este archivo
--   → Run. (Ya tenés que haber corrido supabase/schema.sql antes; este
--   archivo es independiente y no depende de esas tablas.)
--
-- El archivo es RE-EJECUTABLE: se puede volver a correr entero sin romper
-- nada (usa "if not exists" y "drop policy if exists"). No borra reseñas.
-- =====================================================================


-- =====================================================================
-- 1. TABLA resenas
-- =====================================================================
-- Una reseña la deja CUALQUIERA desde el sitio, y entra como 'pendiente'.
-- El cliente la aprueba o la rechaza desde el panel. Sólo las 'aprobada'
-- se ven en el sitio público. Las rechazadas NO se borran: quedan como
-- historial (por eso hay un estado 'rechazada' en vez de un DELETE).
--
-- producto_nombre se guarda APARTE del producto_id a propósito: si el
-- producto se edita o se borra más adelante, la reseña sigue mostrando
-- el nombre que tenía cuando se escribió. producto_id queda por si algún
-- día se quiere enlazar, pero puede ser null (una reseña genérica del
-- negocio, no de un equipo puntual).
-- =====================================================================

create table if not exists public.resenas (
  id               uuid        primary key default gen_random_uuid(),

  nombre           text        not null,           -- quién reseña
  estrellas        integer     not null,           -- 1 a 5 (ver check)
  comentario       text        not null,

  producto_id      text,                           -- id del producto, nullable
  producto_nombre  text,                           -- nombre al momento de la reseña

  -- 'pendiente' | 'aprobada' | 'rechazada'. Arranca pendiente.
  estado           text        not null default 'pendiente',

  creado_en        timestamptz not null default now(),

  constraint resenas_estrellas_validas
    check (estrellas between 1 and 5),
  constraint resenas_estado_valido
    check (estado in ('pendiente', 'aprobada', 'rechazada'))
);

comment on table  public.resenas is 'Reseñas de clientes. Se insertan pendientes; sólo las aprobadas son públicas.';
comment on column public.resenas.estado is 'pendiente (recién enviada) | aprobada (visible) | rechazada (oculta, se guarda como historial).';
comment on column public.resenas.producto_nombre is 'Nombre del producto al momento de la reseña, por si el producto cambia o se borra.';


-- =====================================================================
-- 2. ÍNDICES
-- =====================================================================
-- El sitio pide "aprobadas ordenadas por fecha"; el panel pide "por
-- estado ordenadas por fecha". Un índice por (estado, creado_en) sirve a
-- los dos.
-- =====================================================================

create index if not exists resenas_estado_fecha_idx
  on public.resenas (estado, creado_en desc);


-- =====================================================================
-- 3. SEGURIDAD (RLS) — LO MÁS DELICADO DE ESTE ARCHIVO
-- =====================================================================
-- Acá el modelo es DISTINTO al de productos. En productos, anon sólo lee.
-- Acá anon además INSERTA (deja reseñas), y eso abre dos agujeros si las
-- políticas no están finas:
--
--   a) que un visitante inserte una reseña YA 'aprobada' y se saltee la
--      moderación → lo tapa el WITH CHECK del insert, que exige
--      estado = 'pendiente'.
--   b) que un visitante LEA las reseñas pendientes o rechazadas de otros
--      → lo tapa el USING del select público, que sólo deja ver las
--      'aprobada'.
--
-- Sin estas dos, cualquiera con la clave publishable (que viaja en el
-- frontend, es pública por diseño) podría leer reseñas sin moderar o
-- auto-aprobarse. CON ellas, la clave anon sólo puede: leer aprobadas e
-- insertar pendientes. Nada más.
-- =====================================================================

alter table public.resenas enable row level security;

-- ---------------------------------------------------------------------
-- INSERT (anon + autenticados): cualquiera puede dejar una reseña, PERO
-- el WITH CHECK obliga a que entre como 'pendiente'. Un INSERT que traiga
-- estado = 'aprobada' (o cualquier otro) es rechazado por la política:
-- así nadie publica sin pasar por el panel.
-- ---------------------------------------------------------------------
drop policy if exists resenas_alta_publica on public.resenas;
create policy resenas_alta_publica
  on public.resenas
  for insert
  to anon, authenticated
  with check (estado = 'pendiente');

-- ---------------------------------------------------------------------
-- SELECT PÚBLICO (anon): sólo las aprobadas. Las pendientes y las
-- rechazadas NO existen para el público. Es la política que hace que una
-- reseña recién enviada no aparezca hasta que la aprueben.
-- ---------------------------------------------------------------------
drop policy if exists resenas_lectura_publica on public.resenas;
create policy resenas_lectura_publica
  on public.resenas
  for select
  to anon
  using (estado = 'aprobada');

-- ---------------------------------------------------------------------
-- SELECT AUTENTICADOS: acceso total. El panel necesita ver TODO —sobre
-- todo las pendientes— para poder moderar.
-- ---------------------------------------------------------------------
drop policy if exists resenas_lectura_admin on public.resenas;
create policy resenas_lectura_admin
  on public.resenas
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- UPDATE AUTENTICADOS: cambiar el estado (aprobar / rechazar). Sólo con
-- sesión: un visitante no puede tocar el estado de ninguna reseña.
-- ---------------------------------------------------------------------
drop policy if exists resenas_edicion_admin on public.resenas;
create policy resenas_edicion_admin
  on public.resenas
  for update
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------
-- DELETE AUTENTICADOS: por si alguna vez hay que borrar de verdad. La
-- moderación normal NO borra (usa 'rechazada'), pero conviene tener la
-- política para no quedar sin salida.
-- ---------------------------------------------------------------------
drop policy if exists resenas_borrado_admin on public.resenas;
create policy resenas_borrado_admin
  on public.resenas
  for delete
  to authenticated
  using (true);


-- =====================================================================
-- 4. COMPROBAR QUE QUEDÓ BIEN
-- =====================================================================
-- Correr esto después de aplicar. rls tiene que dar true y tienen que
-- aparecer 5 políticas (1 insert, 2 select, 1 update, 1 delete).
-- =====================================================================

-- select tablename, rowsecurity as rls
--   from pg_tables where schemaname = 'public' and tablename = 'resenas';

-- select policyname, cmd, roles
--   from pg_policies where schemaname = 'public' and tablename = 'resenas'
--  order by cmd, policyname;

-- Prueba manual del agujero (a): este INSERT como anon DEBE fallar,
-- porque intenta entrar ya aprobado. Si lo deja pasar, la política del
-- insert está mal.
-- insert into public.resenas (nombre, estrellas, comentario, estado)
--   values ('Test', 5, 'Intento saltear la moderación', 'aprobada');
