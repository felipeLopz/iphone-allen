# IPHONE ALLEN — landing de la tienda

Landing de una tienda online que revende productos Apple en Allen, Río Negro. Está hecha con HTML, CSS y JavaScript simple: no usa React, Vue, ni ningún framework, y no hace falta instalar nada para editarla ni para probarla.

Los cuatro archivos que la forman son:

- `index.html` — toda la estructura de la página.
- `styles.css` — todos los estilos (colores, tipografía, layout).
- `app.js` — toda la lógica: carrito, filtros, carrusel, comparador, formulario de entrega, etc.
- `productos.json` — el catálogo de productos. Es el único archivo pensado para editarse seguido.

---

## Cómo verla funcionando en tu computadora

**No alcanza con hacer doble clic en `index.html`.** El catálogo se carga desde `productos.json` mediante una técnica llamada `fetch`, y por un tema de seguridad del navegador, `fetch` no funciona si el archivo se abre directo desde el disco (una dirección que empieza con `file://`). Si lo abrís así, vas a ver un catálogo vacío con un cartel de aviso.

Lo que hay que hacer es levantar un "servidor local" — un programita que le sirve la página a tu propio navegador como si fuera un sitio de internet, sin necesidad de subir nada a ningún lado. Con Python instalado (viene de fábrica en Mac y Linux; en Windows se instala gratis desde la Microsoft Store), se hace así:

1. Abrí una terminal en la carpeta del proyecto.
2. Ejecutá:

   ```
   python -m http.server 8123
   ```

3. Abrí el navegador en `http://localhost:8123`.

Listo: ahí la página funciona exactamente igual que una vez publicada. Para cortar el servidor, volvé a la terminal y apretá Ctrl+C.

---

## Qué falta completar antes de publicar el sitio

Esta lista es la posta: nada de lo que sigue está inventado, todo quedó marcado en el código con placeholders bien visibles (texto entre corchetes, tipo `[ALGO]`) para que sea imposible publicarlos por error sin notarlo.

1. **Las respuestas del FAQ.**
   Archivo `app.js`, buscá el array `FAQ` (línea ~94). Son 7 preguntas ya redactadas; cada una tiene `r: '[RESPUESTA — completar]'` en lugar de la respuesta real. Hay que reemplazar ese texto por la respuesta de verdad, pregunta por pregunta. Una de esas preguntas es "¿Qué garantía tienen?" — al día de hoy el sitio no promete ninguna garantía en ningún lado, así que esa respuesta hay que pensarla con cuidado antes de publicar.

2. **Las formas de pago.**
   Archivo `app.js`, array `FORMAS_PAGO` (línea ~83). Tiene 3 tarjetas de ejemplo con `[FORMA DE PAGO 1]`, `[FORMA DE PAGO 2]`, etc. Se reemplaza el título y el detalle de cada una por los medios de pago reales (efectivo, transferencia, tarjeta, cuotas, o lo que corresponda). Se pueden agregar más tarjetas copiando el mismo formato, o borrar las que no apliquen.

3. **El correo de contacto.**
   Archivo `app.js`, objeto `CONTACTO` (línea ~72), campo `email`. Hoy dice `'[CORREO]'`. Mientras tenga ese placeholder, el ícono de correo directamente **no aparece** en el pie de página (es a propósito: mejor no mostrar un enlace que no lleva a ningún lado). En cuanto se complete con un correo real, el ícono aparece solo.

4. **El catálogo real.**
   Archivo `productos.json`. Hoy tiene 12 productos de ejemplo con precios y datos inventados. Hay que revisar, producto por producto: el nombre, el precio, si hay stock o no, las especificaciones cortas (`specs`) y la ficha técnica completa (`detalle`). Más abajo está la explicación completa de cómo se edita cada campo.

5. **Las fotos de los productos.**
   También en `productos.json`, el campo `"imagen"` de cada producto. Hoy todos están vacíos (`""`), así que en vez de una foto se ve un cuadro gris con el nombre del modelo escrito adentro — es el diseño previsto para mientras no hay fotos, no es un error. Para poner la foto real, se completa ese campo con la ruta al archivo (ver el ejemplo más abajo).

6. **Sacar el bloqueo para buscadores.**
   Archivo `index.html`, cerca del principio (dentro de `<head>`), hay esta línea:

   ```html
   <meta name="robots" content="noindex, nofollow">
   ```

   Se agregó a propósito para que Google **no** indexe la página mientras todavía tiene los placeholders de arriba sin completar — así nadie la encuentra a medio terminar. Tiene un comentario al lado que lo explica. **Antes de publicar el sitio de verdad, hay que borrar esa línea entera.** Si se publica con esa línea puesta, el sitio va a funcionar perfecto, pero no va a aparecer en los resultados de Google.

---

## Cómo agregar un producto nuevo

Se edita `productos.json`. Es una lista de productos entre corchetes `[ ]`; cada producto es un bloque entre llaves `{ }`, separado del siguiente por una coma. El **último** producto de la lista no lleva coma al final.

Estos son todos los campos que puede tener un producto:

| Campo | Obligatorio | Qué es |
|---|---|---|
| `id` | Sí | Un identificador único, sin espacios ni acentos (ej: `iphone-15-128`). No se repite entre productos. |
| `nombre` | Sí | El nombre tal cual se muestra en la página. |
| `categoria` | Sí | Una de: `iPhone`, `Mac`, `iPad`, `Accesorios`. Si se escribe una categoría nueva, aparece sola como sección y como filtro — no hace falta tocar nada más. |
| `precio` | Sí | El precio actual, en números, **sin puntos ni el signo $** (ej: `1749000`, no `"$1.749.000"`). |
| `precioAnterior` | No | Si el producto está en oferta, el precio viejo (se muestra tachado al lado). Si no hay descuento, directamente no se pone este campo. |
| `destacado` | No | `true` para que el producto aparezca en el carrusel de "Destacados" de arriba. Lo ideal es que sean 3 o 4 productos en total con `true`. |
| `stock` | No | Un número. Ver la nota especial más abajo. |
| `specs` | Sí | Una lista corta de 2 a 4 datos, entre corchetes, para la tarjeta (ej: `["128 GB", "Negro"]`). |
| `detalle` | Sí | La ficha técnica completa que se ve al abrir el producto (el modal). Ver el ejemplo abajo. |
| `imagen` | No | La ruta a la foto del producto (ej: `"fotos/iphone-15.jpg"`). Si se deja vacío (`""`), se muestra el cuadro gris placeholder con el nombre. |

### Ejemplo completo

```json
{
  "id": "iphone-16e-128",
  "nombre": "iPhone 16e 128 GB",
  "categoria": "iPhone",
  "precio": 1450000,
  "precioAnterior": 1590000,
  "destacado": false,
  "stock": 4,
  "specs": ["128 GB", "Negro", "Batería 100%", "Liberado"],
  "detalle": {
    "Pantalla": "6.1\" Super Retina XDR",
    "Procesador": "A18",
    "Cámara": "48 MP principal",
    "Batería": "Hasta 26 h de video",
    "Almacenamiento": "128 GB",
    "Color": "Negro",
    "Conector": "USB-C",
    "Estado": "Sellado, liberado de fábrica"
  },
  "imagen": ""
}
```

El objeto `detalle` puede tener las claves que hagan falta (no tienen que ser siempre las mismas): cada clave se muestra como una fila en la ficha del producto, en el mismo orden en que están escritas.

### La nota importante sobre `stock`

**Si un producto no tiene el campo `"stock"` escrito, el sitio asume que hay stock disponible.** No hace falta poner `"stock": 999` ni nada parecido en los productos que tienen disponibilidad normal — simplemente no se escribe el campo.

El campo sólo hace falta cuando **no** hay stock: se pone `"stock": 0`, y automáticamente:
- el producto se muestra más apagado (no se oculta, sigue en el catálogo),
- aparece un cartel de "Sin stock",
- el botón cambia de "Agregar al carrito" a "Avisame cuando llegue" (abre WhatsApp con un mensaje ya armado para ese producto puntual).

---

## Nota técnica: si se agrega un botón nuevo dentro de una tarjeta

Esto es para quien en el futuro modifique el código (no hace falta entenderlo para completar los textos de arriba).

Cada tarjeta de producto tiene un truco de diseño: el nombre del producto es en realidad un enlace invisible que cubre toda la tarjeta, así se puede hacer clic en cualquier parte para abrir el detalle del producto (no sólo en el nombre). El problema es que ese enlace invisible queda "por encima" de todo lo demás dentro de la tarjeta — así que los botones reales (Agregar, Avisame, Comparar) necesitan una regla de CSS aparte que los ponga por encima del enlace invisible, si no, el clic nunca les llega a ellos y le llega al enlace de fondo.

Esa regla está en `styles.css`, y hoy cubre estos tres casos:

```css
.card [data-agregar],
.card [data-avisar],
.card [data-comparar],
.carrusel__slide [data-agregar],
.carrusel__slide [data-avisar] { position: relative; z-index: 2; }
```

**Si se agrega un botón nuevo dentro de una tarjeta del catálogo o de un slide del carrusel, hay que sumar su selector a esta misma regla.** Si no se hace, el botón se va a ver perfecto pero el clic no le va a llegar nunca — va a "atravesar" el botón y activar el enlace invisible de más abajo, abriendo el detalle del producto en lugar de hacer lo que el botón nuevo debía hacer.
