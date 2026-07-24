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

Los textos provisorios ya no se ven como corchetes en pantalla: se reemplazaron por redacciones neutras que **no prometen nada** (ni garantías, ni plazos, ni descuentos) y que remiten a consultar. Están marcados en el código con un comentario "TEXTO PROVISORIO" para encontrarlos rápido.

1. **Las respuestas del FAQ.**
   Archivo `app.js`, array `FAQ`. Son 7 preguntas con respuestas provisorias del tipo "Consultanos por…". Hay que reemplazarlas por la información real. Ojo con "¿Qué garantía tienen?": hoy la respuesta no promete ninguna garantía concreta a propósito, así que hay que pensarla con cuidado antes de publicar.

2. **Las formas de pago.**
   Archivo `app.js`, array `FORMAS_PAGO`. Las 3 tarjetas (Efectivo, Transferencia, Tarjeta) ya tienen el medio de pago real, pero el campo `detalle` es provisorio y no menciona cuotas, recargos ni descuentos. Completar con las condiciones reales cuando estén definidas.

3. **El correo de contacto.**
   Archivo `app.js`, objeto `CONTACTO`, campo `email`. Hoy dice `'[CORREO]'`. **No se muestra en ninguna parte**: el pie de página ya no lleva íconos de redes (WhatsApp e Instagram quedaron sólo en la sección Contacto). El campo queda ahí como dato del negocio, para cuando se decida dónde publicarlo.

4. **La dirección del local.**
   Hoy figura "Río Cuarto 2341, Allen, Río Negro" en el hero y en el pie. Es **provisoria**: está marcada con el comentario `DIRECCIÓN PROVISORIA` en `index.html` y en `app.js` (constante `DIRECCION`). Confirmarla con el cliente antes de publicar.

5. **La promo bancaria.**
   Archivo `index.html`, sección `#promo`. Hoy dice "Consultá por promociones bancarias" — un texto que no afirma ninguna promo concreta. Cuando exista una promoción real, se reemplaza el contenido de `.promo__cuerpo` por el flyer o el texto definitivo.

6. **El catálogo real.**
   Archivo `productos.json`. Hoy tiene 12 productos de ejemplo con precios y datos inventados. Hay que revisar, producto por producto: el nombre, el precio, si hay stock o no, las especificaciones cortas (`specs`) y la ficha técnica completa (`detalle`). Más abajo está la explicación completa de cómo se edita cada campo.

7. **Las fotos de los productos que todavía no tienen.**
   Once de los doce productos ya tienen su foto en la carpeta `img/`. El que falta se ve con un cuadro gris con el nombre del modelo escrito adentro — es el diseño previsto para cuando no hay foto, no es un error. Ver más abajo "Cómo agregar la foto de un producto" para completarlo.

8. **Sacar el bloqueo para buscadores.**
   Está en **las seis páginas** (`index.html`, `iphones.html`, `mac.html`, `ipad.html`, `accesorios.html`, `productos.html`), cerca del principio (dentro de `<head>`):

   ```html
   <meta name="robots" content="noindex, nofollow">
   ```

   Se agregó a propósito para que Google **no** indexe el sitio mientras todavía tiene los textos provisorios de arriba sin completar — así nadie lo encuentra a medio terminar. Tiene un comentario al lado que lo explica. **Antes de publicar el sitio de verdad, hay que borrar esa línea en las seis páginas.** Si se publica con esa línea puesta, el sitio va a funcionar perfecto, pero no va a aparecer en los resultados de Google.

   En las seis páginas están también las etiquetas Open Graph (la vista previa al compartir el link). Apuntan a `https://iphone-allen.vercel.app/`: si el sitio pasa a un dominio propio, hay que actualizar `og:url` y `og:image` en los seis archivos y la constante `SITIO` de `app.js`.

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
| `imagen` | No | Casi nunca hace falta escribirlo. Ver la sección "Cómo agregar la foto de un producto" más abajo. |

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
  }
}
```

El objeto `detalle` puede tener las claves que hagan falta (no tienen que ser siempre las mismas): cada clave se muestra como una fila en la ficha del producto, en el mismo orden en que están escritas.

Notá que este ejemplo no tiene el campo `"imagen"` — justamente porque no hace falta, como se explica a continuación.

## Cómo agregar la foto de un producto

Las fotos viven en la carpeta `img/`, y la página las encuentra sola por el nombre del archivo: **tiene que ser igual al `id` del producto, más `.jpg`**. No hay que tocar `productos.json` para nada.

Por ejemplo, para el producto con `"id": "iphone-16e-128"`, la foto va a ser:

```
img/iphone-16e-128.jpg
```

En cuanto el archivo está ahí con ese nombre exacto, la foto aparece sola en la tarjeta, en el carrusel, en el detalle del producto y en el comparador. Si el archivo todavía no existe (o el nombre no coincide), se ve el cuadro gris con el nombre del producto — nunca el ícono roto típico de una imagen que no cargó.

**Dos productos que comparten la misma foto** (por ejemplo, dos capacidades del mismo modelo): en vez de duplicar el archivo, se usa el campo `"imagen"` en el producto que NO tiene foto propia, apuntando a la ruta de la foto del otro. Ese campo, cuando está escrito, le gana a la convención automática. Ejemplo real ya aplicado en el catálogo: el "iPhone 15 128 GB" no tiene foto propia y usa la del "iPhone 15 Pro 256 GB":

```json
"imagen": "img/iphone-15-pro-256.jpg"
```

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
