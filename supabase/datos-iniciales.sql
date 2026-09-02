-- =====================================================================
-- IPHONE ALLEN — datos iniciales del catálogo
-- =====================================================================
-- GENERADO A PARTIR DE productos.json. No editar a mano: si cambia el
-- JSON, volver a generarlo (ver README, sección Supabase).
--
-- Se aplica DESPUÉS de schema.sql:
--   Panel de Supabase → SQL Editor → New query → pegar → Run.
--
-- Usa "on conflict (id) do update", así que es RE-EJECUTABLE: correrlo
-- de nuevo actualiza los productos existentes en vez de fallar, y no
-- duplica nada.
--
-- Contenido: 15 productos y 3 combos.
-- =====================================================================


-- =====================================================================
-- PRODUCTOS
-- =====================================================================

-- 1. iPhone 16 Pro Max 256 GB
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'iphone-16-pro-max-256', 'iPhone 16 Pro Max 256 GB', 'iPhone', null, 3249000, 3490000, 3,
  '["256 GB", "Titanio natural", "Batería 100%", "Liberado"]'::jsonb,
  '{"Pantalla": "6.9\" Super Retina XDR", "Procesador": "A18 Pro", "Cámara": "48 MP principal + 48 MP ultra gran angular + 12 MP teleobjetivo 5x", "Batería": "Hasta 33 h de video · salud 100%", "Almacenamiento": "256 GB", "Color": "Titanio natural", "Conector": "USB-C", "Estado": "Sellado, liberado de fábrica"}'::json,
  true, true, 'nuevo',
  'nuevo', null, null, null, null, 10
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 2. iPhone 15 Pro 256 GB
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'iphone-15-pro-256', 'iPhone 15 Pro 256 GB', 'iPhone', null, 2599000, null, 2,
  '["256 GB", "Titanio azul", "Batería 96%", "Liberado"]'::jsonb,
  '{"Pantalla": "6.1\" Super Retina XDR", "Procesador": "A17 Pro", "Cámara": "48 MP principal + 12 MP ultra gran angular + 12 MP teleobjetivo 3x", "Batería": "Hasta 23 h de video · salud 96%", "Almacenamiento": "256 GB", "Color": "Titanio azul", "Conector": "USB-C", "Estado": "Sellado, liberado de fábrica"}'::json,
  true, false, null,
  'nuevo', null, null, null, null, 20
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 3. iPhone 15 128 GB
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'iphone-15-128', 'iPhone 15 128 GB', 'iPhone', null, 1749000, 1899000, 5,
  '["128 GB", "Negro", "Batería 100%", "Sellado"]'::jsonb,
  '{"Pantalla": "6.1\" Super Retina XDR", "Procesador": "A16 Bionic", "Cámara": "48 MP principal + 12 MP ultra gran angular", "Batería": "Hasta 20 h de video · salud 100%", "Almacenamiento": "128 GB", "Color": "Negro", "Conector": "USB-C", "Estado": "Sellado, liberado de fábrica"}'::json,
  false, false, 'oferta',
  'nuevo', null, null, null, null, 30
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 4. iPhone 14 128 GB
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'iphone-14-128', 'iPhone 14 128 GB', 'iPhone', null, 1399000, 1549000, 4,
  '["128 GB", "Azul medianoche", "Batería 92%", "Liberado"]'::jsonb,
  '{"Pantalla": "6.1\" Super Retina XDR", "Procesador": "A15 Bionic", "Cámara": "12 MP principal + 12 MP ultra gran angular", "Batería": "Hasta 20 h de video · salud 92%", "Almacenamiento": "128 GB", "Color": "Azul medianoche", "Conector": "Lightning", "Estado": "Sellado, liberado de fábrica"}'::json,
  false, false, null,
  'nuevo', null, null, null, null, 40
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 5. iPhone 14 128 GB (usado)
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'iphone-14-128-usado', 'iPhone 14 128 GB (usado)', 'iPhone', null, 1150000, null, 2,
  '["128 GB", "Azul medianoche", "Liberado"]'::jsonb,
  '{"Pantalla": "6.1\" Super Retina XDR", "Procesador": "A15 Bionic", "Cámara": "12 MP principal + 12 MP ultra gran angular", "Batería": "Hasta 20 h de video · salud 92%", "Almacenamiento": "128 GB", "Color": "Azul medianoche", "Conector": "Lightning", "Estado": "Usado muy bueno, liberado"}'::json,
  false, false, null,
  'usado', '{"bateria": 92, "pantalla": "Sin rayones", "carcasa": "Marca leve en el borde inferior", "uso": "1 año y medio", "reparaciones": "Ninguna", "accesorios": "Con caja, sin cargador"}'::json, 2022, 'iphone-14-128', 'img/iphone-14-128.jpg', 50
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 6. iPhone 13 128 GB
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'iphone-13-128', 'iPhone 13 128 GB', 'iPhone', null, 1099000, null, 0,
  '["128 GB", "Blanco estelar", "Batería 89%", "Liberado"]'::jsonb,
  '{"Pantalla": "6.1\" Super Retina XDR", "Procesador": "A15 Bionic", "Cámara": "12 MP principal + 12 MP ultra gran angular", "Batería": "Hasta 19 h de video · salud 89%", "Almacenamiento": "128 GB", "Color": "Blanco estelar", "Conector": "Lightning", "Estado": "Sellado, liberado de fábrica"}'::json,
  false, false, 'oferta',
  'nuevo', null, null, null, null, 60
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 7. iPhone 13 128 GB (usado)
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'iphone-13-128-usado', 'iPhone 13 128 GB (usado)', 'iPhone', null, 899000, 1020000, 0,
  '["128 GB", "Blanco estelar", "Liberado"]'::jsonb,
  '{"Pantalla": "6.1\" Super Retina XDR", "Procesador": "A15 Bionic", "Cámara": "12 MP principal + 12 MP ultra gran angular", "Batería": "Hasta 19 h de video · salud 89%", "Almacenamiento": "128 GB", "Color": "Blanco estelar", "Conector": "Lightning", "Estado": "Usado bueno, liberado"}'::json,
  false, false, 'oferta',
  'usado', '{"bateria": 89, "pantalla": "Rayón fino, apenas visible", "carcasa": "Desgaste leve en las esquinas", "uso": "2 años", "reparaciones": "Batería cambiada en servicio oficial", "accesorios": "Sin caja"}'::json, 2021, 'iphone-13-128', 'img/iphone-13-128.jpg', 70
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 8. MacBook Air M3 13"
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'macbook-air-m3-13', 'MacBook Air M3 13"', 'Mac', null, 2899000, 3100000, 2,
  '["Chip M3", "8 GB RAM", "256 GB SSD", "Medianoche"]'::jsonb,
  '{"Pantalla": "13.6\" Liquid Retina, 500 nits", "Procesador": "Chip M3 · 8 núcleos CPU / 8 GPU", "Memoria": "8 GB unificada", "Almacenamiento": "256 GB SSD", "Batería": "Hasta 18 h de uso", "Puertos": "2x Thunderbolt / USB-4, MagSafe 3, jack 3.5 mm", "Color": "Medianoche", "Estado": "Sellado"}'::json,
  true, true, null,
  'nuevo', null, null, null, null, 80
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 9. MacBook Air M3 13" (usado)
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'macbook-air-m3-13-usado', 'MacBook Air M3 13" (usado)', 'Mac', null, 2390000, 2590000, 1,
  '["Chip M3", "8 GB RAM", "256 GB SSD", "Medianoche"]'::jsonb,
  '{"Pantalla": "13.6\" Liquid Retina, 500 nits", "Procesador": "Chip M3 · 8 núcleos CPU / 8 GPU", "Memoria": "8 GB unificada", "Almacenamiento": "256 GB SSD", "Batería": "Hasta 18 h de uso · salud 94%", "Puertos": "2x Thunderbolt / USB-4, MagSafe 3, jack 3.5 mm", "Color": "Medianoche", "Estado": "Usado, ciclos de batería bajos"}'::json,
  false, false, 'oferta',
  'usado', '{"bateria": 94, "pantalla": "Sin rayones", "carcasa": "Marca leve en la tapa", "uso": "10 meses", "reparaciones": "Ninguna", "accesorios": "Con caja y cargador original"}'::json, 2024, 'macbook-air-m3-13', 'img/macbook-air-m3-13.jpg', 90
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 10. MacBook Pro 14" M4
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'macbook-pro-14-m4', 'MacBook Pro 14" M4', 'Mac', null, 4590000, null, 1,
  '["Chip M4", "16 GB RAM", "512 GB SSD", "Space Black"]'::jsonb,
  '{"Pantalla": "14.2\" Liquid Retina XDR, 120 Hz ProMotion", "Procesador": "Chip M4 · 10 núcleos CPU / 10 GPU", "Memoria": "16 GB unificada", "Almacenamiento": "512 GB SSD", "Batería": "Hasta 22 h de uso", "Puertos": "3x Thunderbolt 4, HDMI, SDXC, MagSafe 3", "Color": "Negro espacial", "Estado": "Sellado"}'::json,
  false, false, null,
  'nuevo', null, null, null, null, 100
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 11. iPad Air M2 11"
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'ipad-air-m2-11', 'iPad Air M2 11"', 'iPad', null, 1590000, null, 3,
  '["Chip M2", "128 GB", "WiFi", "Gris espacial"]'::jsonb,
  '{"Pantalla": "11\" Liquid Retina, 60 Hz", "Procesador": "Chip M2 · 8 núcleos CPU / 9 GPU", "Almacenamiento": "128 GB", "Conectividad": "WiFi 6E, Bluetooth 5.3", "Cámara": "12 MP trasera · 12 MP frontal horizontal", "Batería": "Hasta 10 h de navegación", "Compatibilidad": "Apple Pencil Pro y Magic Keyboard", "Color": "Gris espacial"}'::json,
  false, true, null,
  'nuevo', null, null, null, null, 110
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 12. iPad 10ma gen 64 GB
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'ipad-10-64', 'iPad 10ma gen 64 GB', 'iPad', null, 899000, 999000, 0,
  '["64 GB", "WiFi", "Pantalla 10.9\"", "Plata"]'::jsonb,
  '{"Pantalla": "10.9\" Liquid Retina", "Procesador": "A14 Bionic", "Almacenamiento": "64 GB", "Conectividad": "WiFi 6, Bluetooth 5.2", "Cámara": "12 MP trasera · 12 MP frontal horizontal", "Batería": "Hasta 10 h de navegación", "Compatibilidad": "Apple Pencil 1ra gen (con adaptador USB-C)", "Color": "Plata"}'::json,
  false, false, null,
  'nuevo', null, null, null, null, 120
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 13. AirPods Pro 2 USB-C
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'airpods-pro-2', 'AirPods Pro 2 USB-C', 'Accesorios', 'Auriculares', 429000, 479000, 8,
  '["Cancelación activa", "USB-C", "Sellado"]'::jsonb,
  '{"Chip": "H2", "Audio": "Cancelación activa de ruido 2x, modo Transparencia", "Espacial": "Audio espacial personalizado con seguimiento de cabeza", "Batería": "6 h por carga · 30 h con el estuche", "Estuche": "USB-C, compatible MagSafe y Qi", "Resistencia": "IP54 en auriculares y estuche", "Incluye": "4 tamaños de almohadillas", "Estado": "Sellado"}'::json,
  true, true, 'nuevo',
  'nuevo', null, null, null, null, 130
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 14. Apple Watch Series 10 42 mm
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'apple-watch-s10-42', 'Apple Watch Series 10 42 mm', 'Accesorios', 'Relojes', 749000, null, 2,
  '["42 mm", "GPS", "Aluminio", "Malla deportiva"]'::jsonb,
  '{"Pantalla": "42 mm LTPO3 OLED, hasta 2000 nits", "Chip": "S10 SiP", "Caja": "Aluminio", "Batería": "Hasta 18 h · carga rápida", "Salud": "ECG, oxígeno en sangre, apnea del sueño", "Resistencia": "50 m al agua · IP6X", "Conectividad": "GPS + WiFi + Bluetooth 5.3", "Incluye": "Malla deportiva y cable de carga"}'::json,
  false, false, null,
  'nuevo', null, null, null, null, 140
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;

-- 15. Cargador MagSafe 15W
insert into public.productos (
  id, nombre, categoria, subcategoria, precio, precio_anterior, stock,
  specs, detalle, destacado, principal, etiqueta,
  condicion, estado, anio, equivale_nuevo, imagen, orden
) values (
  'magsafe-15w', 'Cargador MagSafe 15W', 'Accesorios', 'Cargadores', 89000, 105000, 12,
  '["15W", "Cable 1 m", "Original"]'::jsonb,
  '{"Potencia": "Hasta 15 W de carga inalámbrica", "Compatibilidad": "iPhone 12 o superior", "Cable": "1 m integrado", "Conector": "USB-C", "Requiere": "Adaptador de 20 W o más (no incluido)", "Origen": "Original Apple", "Estado": "Sellado"}'::json,
  false, false, null,
  'nuevo', null, null, null, null, 150
)
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  subcategoria = excluded.subcategoria, precio = excluded.precio,
  precio_anterior = excluded.precio_anterior, stock = excluded.stock,
  specs = excluded.specs, detalle = excluded.detalle,
  destacado = excluded.destacado, principal = excluded.principal,
  etiqueta = excluded.etiqueta, condicion = excluded.condicion,
  estado = excluded.estado, anio = excluded.anio,
  equivale_nuevo = excluded.equivale_nuevo, imagen = excluded.imagen,
  orden = excluded.orden;


-- =====================================================================
-- COMBOS
-- =====================================================================

insert into public.combos (id, categoria, productos, descuento, etiqueta)
values ('combo-iphone-16-magsafe', 'iPhone', array['iphone-16-pro-max-256', 'magsafe-15w']::text[], 10, 'combo')
on conflict (id) do update set
  categoria = excluded.categoria, productos = excluded.productos,
  descuento = excluded.descuento, etiqueta = excluded.etiqueta;

insert into public.combos (id, categoria, productos, descuento, etiqueta)
values ('combo-macbook-air-airpods', 'Mac', array['macbook-air-m3-13', 'airpods-pro-2']::text[], 8, 'combo')
on conflict (id) do update set
  categoria = excluded.categoria, productos = excluded.productos,
  descuento = excluded.descuento, etiqueta = excluded.etiqueta;

insert into public.combos (id, categoria, productos, descuento, etiqueta)
values ('combo-ipad-air-airpods', 'iPad', array['ipad-air-m2-11', 'airpods-pro-2']::text[], 8, 'combo')
on conflict (id) do update set
  categoria = excluded.categoria, productos = excluded.productos,
  descuento = excluded.descuento, etiqueta = excluded.etiqueta;


-- =====================================================================
-- COMPROBACIÓN
-- =====================================================================
-- Tiene que devolver 15 productos y 3 combos.

-- select
--   (select count(*) from public.productos) as productos,
--   (select count(*) from public.combos)    as combos;

-- Y estos tres tienen que ser los usados, en este orden (2024, 2022, 2021):
-- select id, anio, condicion from public.productos
--  where condicion = 'usado' order by anio desc;
