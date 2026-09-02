-- =====================================================================
-- IPHONE ALLEN — esquema del catálogo en Supabase
-- =====================================================================
-- Cómo se aplica:
--   Panel de Supabase → SQL Editor → New query → pegar TODO este archivo
--   → Run. Después correr supabase/datos-iniciales.sql.
--
-- El archivo es RE-EJECUTABLE: se puede volver a correr entero sin
-- romper nada (usa "if not exists" y "drop policy if exists"). No borra
-- datos: si las tablas ya existen, las deja como están.
-- =====================================================================


-- =====================================================================
-- 1. TABLA productos
-- =====================================================================
-- Refleja exactamente lo que hoy tiene productos.json. Los nombres van
-- en snake_case (la convención de Postgres); app.js los normaliza a
-- camelCase al leer, así el resto del código no cambia.
--
-- POR QUÉ 'json' Y NO 'jsonb' EN detalle Y estado
-- -----------------------------------------------
-- Parece un detalle menor pero no lo es. 'jsonb' NO conserva el orden de
-- las claves de un objeto (las guarda ordenadas por longitud y luego
-- alfabéticamente). El modal del producto dibuja la ficha técnica con
-- Object.keys(detalle), o sea EN EL ORDEN EN QUE ESTÁN ESCRITAS, y hoy
-- cada producto tiene el suyo:
--     iPhone     → Pantalla, Procesador, Cámara, Batería, ...
--     Mac        → Pantalla, Procesador, Memoria, Almacenamiento, ...
--     AirPods    → Chip, Audio, Espacial, Batería, ...
-- Con 'jsonb' esas fichas saldrían barajadas (quedaría "Color, Estado,
-- Cámara, Batería, Pantalla, ...") y sería un cambio visible respecto de
-- hoy. 'json' guarda el texto tal cual, con el orden intacto.
--
-- specs sí va en 'jsonb' porque es un ARRAY: jsonb conserva el orden de
-- los elementos de un array (lo que reordena son las claves de objetos).
-- =====================================================================

create table if not exists public.productos (
  -- Identificador del producto, el mismo que ya usa el JSON
  -- ("iphone-15-128"). Es también el nombre de su foto en img/.
  id              text primary key,

  nombre          text        not null,
  categoria       text        not null,      -- iPhone | Mac | iPad | Accesorios
  subcategoria    text,                      -- sólo Accesorios: Auriculares, Relojes, Cargadores

  precio          numeric     not null,
  precio_anterior numeric,                   -- si está, se muestra tachado

  -- null = "hay stock" (así lo interpreta hayStock() en app.js).
  -- 0 = agotado: el producto NO se oculta, se muestra atenuado.
  stock           integer,

  specs           jsonb       not null default '[]'::jsonb,  -- ["128 GB", "Negro", ...]
  detalle         json        not null default '{}'::json,   -- ficha del modal (ver nota de arriba)

  destacado       boolean     not null default false,        -- true => entra al carrusel
  principal       boolean     not null default false,        -- true => tarjeta grande de su sección
  etiqueta        text,                                      -- 'nuevo' | 'oferta' (otro valor: no se muestra)

  -- Nuevo o usado. Sin valor se asume nuevo, igual que hoy en el JSON.
  condicion       text        not null default 'nuevo',
  estado          json,                      -- sólo usados: informe del equipo
  anio            integer,                   -- sólo usados: ordena la sección
  equivale_nuevo  text,                      -- sólo usados: id del mismo modelo nuevo

  -- Ruta de la foto. null/vacío => se arma sola: img/<id>.jpg
  imagen          text,

  -- Orden dentro del catálogo. Se deja de a 10 (10, 20, 30...) para
  -- poder meter un producto entre dos sin renumerar todo.
  orden           integer     not null default 0,

  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),

  constraint productos_condicion_valida
    check (condicion in ('nuevo', 'usado')),
  constraint productos_precio_positivo
    check (precio >= 0),
  constraint productos_stock_no_negativo
    check (stock is null or stock >= 0)
);

comment on table  public.productos is 'Catálogo de la tienda. Lectura pública, escritura sólo autenticados.';
comment on column public.productos.stock is 'null = hay stock; 0 = agotado (se muestra atenuado, no se oculta).';
comment on column public.productos.detalle is 'json (NO jsonb) a propósito: el modal respeta el orden de las claves.';
comment on column public.productos.orden is 'Orden en el catálogo. De a 10 para poder intercalar.';


-- =====================================================================
-- 2. TABLA combos
-- =====================================================================
-- Dos (o más) productos vendidos juntos con descuento. El precio NO se
-- guarda: lo calcula app.js sumando los productos y aplicando el
-- porcentaje, así nunca queda desactualizado si cambia un precio.
--
-- "productos" es text[] con los ids. No lleva clave foránea a propósito:
-- app.js ya avisa por consola e ignora el combo si algún id no existe, y
-- una FK sobre un array obligaría a un trigger. Misma idea con
-- productos.equivale_nuevo.
-- =====================================================================

create table if not exists public.combos (
  id         text primary key,
  categoria  text    not null,               -- en qué sección se muestra
  productos  text[]  not null,               -- ids de los productos que lo forman
  descuento  numeric not null default 0,     -- porcentaje sobre la suma
  etiqueta   text    not null default 'combo',

  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  constraint combos_al_menos_dos_productos
    check (array_length(productos, 1) >= 2),
  constraint combos_descuento_valido
    check (descuento >= 0 and descuento <= 100)
);

comment on table  public.combos is 'Combos del catálogo. El precio final lo calcula el sitio, no se guarda.';
comment on column public.combos.productos is 'Ids de public.productos. Sin FK: app.js ignora el combo si falta alguno.';


-- =====================================================================
-- 3. ÍNDICES
-- =====================================================================
-- El sitio siempre pide el catálogo entero ordenado, así que el índice
-- que más rinde es el de "orden". Los otros son para cuando el panel de
-- administración filtre por categoría o por condición.
-- =====================================================================

create index if not exists productos_orden_idx      on public.productos (orden);
create index if not exists productos_categoria_idx  on public.productos (categoria);
create index if not exists productos_condicion_idx  on public.productos (condicion);
create index if not exists productos_destacado_idx  on public.productos (destacado) where destacado;
create index if not exists combos_categoria_idx     on public.combos (categoria);


-- =====================================================================
-- 4. actualizado_en automático
-- =====================================================================
-- Sin esto, actualizado_en se quedaría con la fecha de creación para
-- siempre. El trigger lo pisa en cada UPDATE.
-- =====================================================================

create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists productos_actualizado_en on public.productos;
create trigger productos_actualizado_en
  before update on public.productos
  for each row execute function public.tocar_actualizado_en();

drop trigger if exists combos_actualizado_en on public.combos;
create trigger combos_actualizado_en
  before update on public.combos
  for each row execute function public.tocar_actualizado_en();


-- =====================================================================
-- 5. SEGURIDAD (RLS) — LO MÁS IMPORTANTE DE ESTE ARCHIVO
-- =====================================================================
-- La clave "publishable" (anon) viaja en el código del sitio: cualquiera
-- que abra la página puede verla en el navegador. ESO ESTÁ BIEN Y ES EL
-- DISEÑO DE SUPABASE — pero sólo si RLS está activo.
--
-- Sin RLS, con esa clave a la vista cualquiera podría mandar un DELETE y
-- borrar el catálogo entero. Con RLS, la clave anon SÓLO puede hacer lo
-- que digan las políticas de abajo: leer.
--
-- Regla que aplicamos:
--   · LEER   → cualquiera (anon y autenticados). Es un catálogo público.
--   · CREAR / MODIFICAR / BORRAR → sólo usuarios autenticados. Esto es lo
--     que va a usar el panel de administración de la próxima etapa.
--
-- Al activar RLS, si una tabla no tiene ninguna política que la habilite,
-- queda cerrada por completo. Por eso hay que crear las cuatro.
-- =====================================================================

alter table public.productos enable row level security;
alter table public.combos    enable row level security;

-- ---------------------------------------------------------------------
-- productos
-- ---------------------------------------------------------------------

-- LECTURA PÚBLICA: el catálogo lo puede leer cualquiera, sin iniciar
-- sesión. Es lo que hace funcionar al sitio con la clave publishable.
drop policy if exists productos_lectura_publica on public.productos;
create policy productos_lectura_publica
  on public.productos
  for select
  to anon, authenticated
  using (true);

-- ALTA: sólo autenticados. Un visitante no puede agregar productos.
drop policy if exists productos_alta_autenticados on public.productos;
create policy productos_alta_autenticados
  on public.productos
  for insert
  to authenticated
  with check (true);

-- EDICIÓN: sólo autenticados. "using" decide qué filas puede tocar y
-- "with check" cómo pueden quedar después: las dos en true = todas.
drop policy if exists productos_edicion_autenticados on public.productos;
create policy productos_edicion_autenticados
  on public.productos
  for update
  to authenticated
  using (true)
  with check (true);

-- BORRADO: sólo autenticados. Esta es la política que impide que
-- alguien con la clave pública vacíe el catálogo.
drop policy if exists productos_borrado_autenticados on public.productos;
create policy productos_borrado_autenticados
  on public.productos
  for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- combos (mismas cuatro reglas)
-- ---------------------------------------------------------------------

drop policy if exists combos_lectura_publica on public.combos;
create policy combos_lectura_publica
  on public.combos
  for select
  to anon, authenticated
  using (true);

drop policy if exists combos_alta_autenticados on public.combos;
create policy combos_alta_autenticados
  on public.combos
  for insert
  to authenticated
  with check (true);

drop policy if exists combos_edicion_autenticados on public.combos;
create policy combos_edicion_autenticados
  on public.combos
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists combos_borrado_autenticados on public.combos;
create policy combos_borrado_autenticados
  on public.combos
  for delete
  to authenticated
  using (true);


-- =====================================================================
-- 6. COMPROBAR QUE QUEDÓ BIEN
-- =====================================================================
-- Correr esto después de aplicar todo. Tiene que devolver rls = true en
-- las dos tablas y 8 políticas en total (4 por tabla).
-- =====================================================================

-- select tablename, rowsecurity as rls
--   from pg_tables where schemaname = 'public' and tablename in ('productos','combos');

-- select tablename, policyname, cmd, roles
--   from pg_policies where schemaname = 'public'
--  order by tablename, cmd;
