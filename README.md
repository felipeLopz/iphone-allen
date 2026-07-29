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

5. **La promo bancaria: las cuotas y las tarjetas.**
   La franja `#promo` de `index.html` anuncia **"3, 6 y 12 cuotas sin interés"** y muestra tres medios de pago (Visa, Mastercard, Cabal). **Las dos cosas son provisorias y hay que confirmarlas con el cliente**: las cuotas dependen de lo que le ofrezca cada banco.
   - El título de las cuotas se edita en `index.html`, en `.promo__titulo`.
   - La lista de tarjetas se edita en `app.js`, array `TARJETAS`: agregar o sacar un nombre y listo.
   - **No se usan los logos oficiales** de Visa, Mastercard ni Cabal: son marcas registradas. Cada una se muestra con el mismo ícono genérico de tarjeta (`ICONOS.tarjetaGenerica`) y el nombre en texto al lado. Si algún día se quieren poner los logos reales, hay que conseguir la autorización de cada marca.

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

## Cómo funciona la compra

Son dos pasos, y en ninguno se cobra desde el sitio: todo termina en un WhatsApp con el pedido armado.

1. **El carrito** (el ícono del header) abre un panel lateral con los productos, el total y el botón **"Finalizar compra"**. Ahí se cambian cantidades o se quitan productos.
2. **"Finalizar compra"** abre una pantalla completa con el resumen del pedido, el formulario de entrega, un bloque con el total y los medios de pago, y una fila de **productos sugeridos** que se pueden agregar sin salir de esa pantalla. El botón "Volver" regresa al carrito sin perder los datos ya cargados.

Los sugeridos se eligen solos: productos **con stock**, que **no estén ya en el carrito**, y priorizando los de **categorías que el carrito no tiene** (a alguien que lleva un iPhone le sirve más ver un accesorio que otro iPhone). Si no alcanzan, completa con los que queden. No hay que configurar nada.

---

## Los controles del catálogo

Arriba de la grilla, en las cinco páginas de catálogo, hay cuatro controles que se combinan entre sí:

- **Rango de precio** (`Desde` / `Hasta`): los dos son opcionales. Se escriben sólo números y se formatean solos con puntos de miles. La ✕ limpia el rango. Si el "Desde" queda mayor que el "Hasta", avisa debajo y no filtra nada.
- **Nuevo / usado**: tres pastillas, `Todos` (por defecto) · `Nuevos` · `Usados`. Con "Nuevos" desaparece la sección de usados y la página queda como antes de que existieran. Con "Usados" se ven sólo los usados, sin combos ni tarjeta grande (los combos son de productos nuevos). Si la selección no deja ningún producto, aparece el cartel de "sin resultados" nombrando el filtro.
- **Orden**: por defecto (el orden del JSON), menor precio o mayor precio. Con "por defecto" la sección muestra su tarjeta grande (el combo, o el producto marcado como principal). Al ordenar por precio la grilla se vuelve **uniforme**: no hay tarjeta grande, todas son del mismo tamaño y quedan estrictamente ordenadas por precio — una tarjeta fija arriba que no fuera la más barata se leería como un error. El combo no se pierde: aparece como una tarjeta más, con su precio de combo, en el lugar que le toca.
- **Buscador** (la lupa): filtra la grilla al escribir y además muestra hasta cinco sugerencias con foto y precio. Elegir una abre el detalle del producto. Se maneja con flechas y Enter; Escape cierra las sugerencias.

Los cuatro se aplican juntos: si hay texto buscado, rango, condición y orden, se respetan los cuatro. En las páginas de categoría todo se limita a esa categoría; en `productos.html`, a todo el catálogo.

En celular la barra se acomoda en tres filas —el rango arriba, las tres pastillas de condición en el medio, y abajo el orden con la lupa— para que ningún control quede apretado y la barra no necesite scroll horizontal.

### Entrega estimada

El plazo que se ve en el detalle de cada producto y en el resumen de finalizar compra sale de **una sola constante** en `app.js`, cerca del principio:

```js
var ENTREGA_ESTIMADA = '12 a 36 hs';
var ENTREGA_NOTA = 'Coordinamos por WhatsApp';
```

Se edita ahí y cambia en los dos lugares a la vez. Vale igual para nuevos y usados. Está redactado como **estimado** a propósito, y la nota de al lado aclara que se coordina: no conviene convertirlo en un plazo prometido.

### El contador de la pestaña

Cuando el carrito tiene productos, el título de la pestaña del navegador arranca con la cantidad: `(3) iPhones — IPHONE ALLEN…`. Con el carrito vacío se ve el título normal. El número son **unidades** (respeta las cantidades, no cuenta líneas), se actualiza al agregar, quitar y cambiar cantidades, y como el carrito vive en `localStorage` sigue estando al pasar de una página a otra. Cada página conserva su propio título: el número se le antepone.

---

## Cómo agregar un producto nuevo

Se edita `productos.json`. El archivo tiene dos partes:

```json
{
  "productos": [ ... ],
  "combos": [ ... ]
}
```

Los productos van en la lista `"productos"`, entre corchetes `[ ]`; cada producto es un bloque entre llaves `{ }`, separado del siguiente por una coma. El **último** producto de la lista no lleva coma al final. (Los combos se explican más abajo.)

Estos son todos los campos que puede tener un producto:

| Campo | Obligatorio | Qué es |
|---|---|---|
| `id` | Sí | Un identificador único, sin espacios ni acentos (ej: `iphone-15-128`). No se repite entre productos. |
| `nombre` | Sí | El nombre tal cual se muestra en la página. |
| `categoria` | Sí | Una de: `iPhone`, `Mac`, `iPad`, `Accesorios`. Si se escribe una categoría nueva, aparece sola como sección y como filtro — no hace falta tocar nada más. |
| `precio` | Sí | El precio actual, en números, **sin puntos ni el signo $** (ej: `1749000`, no `"$1.749.000"`). |
| `precioAnterior` | No | Si el producto está en oferta, el precio viejo (se muestra tachado al lado). Si no hay descuento, directamente no se pone este campo. |
| `destacado` | No | `true` para que el producto aparezca en el carrusel de "Destacados" de arriba. Lo ideal es que sean 3 o 4 productos en total con `true`. |
| `etiqueta` | No | `"nuevo"` o `"oferta"`. Muestra un cartelito en la tarjeta. Ver la sección "Etiquetas" más abajo. |
| `stock` | No | Un número. Ver la nota especial más abajo. |
| `specs` | Sí | Una lista corta de 2 a 4 datos, entre corchetes (ej: `["128 GB", "Negro"]`). Se muestran unidos con `·` como descripción debajo del nombre en la tarjeta. Entran dos líneas: lo que se pase se recorta con puntos suspensivos. |
| `detalle` | Sí | La ficha técnica completa que se ve al abrir el producto (el modal). Ver el ejemplo abajo. |
| `imagen` | No | Casi nunca hace falta escribirlo. Ver la sección "Cómo agregar la foto de un producto" más abajo. |
| `condicion` | No | `"nuevo"` o `"usado"`. Si no se escribe, se asume `"nuevo"`. Ver "Productos usados" más abajo. |
| `anio` | No | Sólo para usados: el año del modelo (ej: `2022`). Ordena la sección de usados. |
| `estado` | No | Sólo para usados: el informe del estado real del equipo. Ver "Productos usados" más abajo. |
| `equivaleNuevo` | No | Sólo para usados: el `id` del mismo modelo nuevo, para mostrar cuánto se ahorra. Ver "Productos usados". |

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

## Productos usados

Cada categoría se muestra partida en dos: arriba los equipos **nuevos** y abajo los **usados**, cada una con su título. La sección de usados aparece sola: si una categoría no tiene ningún usado cargado, no se muestra ningún título de más y la página queda igual que siempre.

**Un usado es una entrada aparte, no un campo que se le pone al producto nuevo.** El mismo modelo puede estar a la venta sellado y usado al mismo tiempo, a precios distintos, así que se duplica la entrada en `productos.json` con otro id (ej: `iphone-14-128-usado`) y se le baja el precio. La foto **no se duplica**: se completa el campo `"imagen"` apuntando a la que ya tiene el producto nuevo (ej: `"imagen": "img/iphone-14-128.jpg"`), porque ese campo tiene prioridad sobre la convención `img/<id>.jpg`.

Conviene que el `nombre` diga `(usado)`: en el carrito, en el comparador y en el mensaje de WhatsApp los dos aparecen juntos, y ahí el cartelito de la tarjeta no está para distinguirlos.

Para marcar un producto como usado se agregan tres campos:

- **`"condicion": "usado"`** — es lo único que decide si el producto va a la sección de usados. Un producto sin este campo se considera nuevo.
- **`"anio"`** — el año del modelo, en número (ej: `2022`). Sirve para ordenar: dentro de la sección de usados los equipos van **del modelo más nuevo al más viejo**. Un usado sin `anio` no desaparece: queda al final de la lista.
- **`"estado"`** — el informe del estado real del equipo. Todos sus campos son opcionales; el que no se cargue simplemente no se muestra (no queda una línea vacía).

Los campos de `estado` son:

| Campo | Qué se escribe |
|---|---|
| `bateria` | La salud de la batería **en número**, sin el símbolo `%` (ej: `87`). La página le agrega el `%`. |
| `pantalla` | Texto corto (ej: `"Sin rayones"`). |
| `carcasa` | Texto corto (ej: `"Marca leve en el borde inferior"`). |
| `uso` | Cuánto se usó (ej: `"6 meses"`). |
| `reparaciones` | `"Ninguna"`, o qué se cambió (ej: `"Batería cambiada en servicio oficial"`). |
| `accesorios` | Qué viene con el equipo (ej: `"Con caja y cargador"`). |

### Ejemplo completo de un producto usado

Este es el usado que se arma a partir del `iphone-14-128` que ya estaba en el catálogo. Fijate que el `id` es otro, el precio es menor y la `imagen` apunta a la foto del nuevo:

```json
{
  "id": "iphone-14-128-usado",
  "nombre": "iPhone 14 128 GB (usado)",
  "categoria": "iPhone",
  "condicion": "usado",
  "anio": 2022,
  "precio": 1150000,
  "stock": 2,
  "specs": ["128 GB", "Azul medianoche", "Liberado"],
  "estado": {
    "bateria": 92,
    "pantalla": "Sin rayones",
    "carcasa": "Marca leve en el borde inferior",
    "uso": "1 año y medio",
    "reparaciones": "Ninguna",
    "accesorios": "Con caja, sin cargador"
  },
  "detalle": {
    "Pantalla": "6.1\" Super Retina XDR",
    "Procesador": "A15 Bionic",
    "Almacenamiento": "128 GB",
    "Color": "Azul medianoche",
    "Conector": "Lightning",
    "Estado": "Usado muy bueno, liberado"
  },
  "imagen": "img/iphone-14-128.jpg"
}
```

### Dónde se ve cada cosa

- **En la tarjeta**: un cartelito ámbar que dice **"Usado"** arriba de la foto, y un resumen corto en la línea de descripción (la batería y el estado de la pantalla). Es a propósito que no esté todo: esa línea tiene el alto reservado para que todas las tarjetas midan lo mismo.
- **Al abrir el producto**: un bloque **"Estado del equipo"** con *todos* los campos cargados, uno por fila, antes de la ficha técnica. La idea es que se lea como un informe de transparencia — mostrar la marca en el borde genera más confianza que esconderla.

En la línea de descripción de la tarjeta conviene **no repetir la batería en `specs`** (ya la pone `estado`), como en el ejemplo de arriba.

### Cuánto se ahorra contra el nuevo

Si el usado lleva **`"equivaleNuevo"`** con el `id` del mismo modelo nuevo, la página calcula sola cuánto se ahorra y lo muestra en dos lugares:

- **En la tarjeta**: una línea corta, `Nuevo $1.399.000 · Ahorrás $249.000`.
- **En el modal**, dentro del informe de estado: el precio del nuevo tachado, el del usado, y abajo `Ahorrás $249.000 (18%)`.

```json
"equivaleNuevo": "iphone-14-128"
```

El ahorro es `precio del nuevo − precio del usado`, y el porcentaje va sobre el precio del nuevo. **No hay que escribir ningún monto**: si mañana cambia el precio de cualquiera de los dos, la cuenta se actualiza sola.

Si el campo no está, si el `id` no existe, o si el usado quedara **igual o más caro** que el nuevo, no se muestra ninguna comparación y el usado se ve como cualquier otro. El espacio de esa línea está reservado en todas las tarjetas, así que aparezca o no, todas siguen midiendo lo mismo.

### Reglas de los usados

- Se compran igual que cualquier otro producto: entran al carrito, al buscador, al filtro de precio y al orden por precio.
- Un usado puede además estar en oferta (`"etiqueta": "oferta"`): los dos cartelitos se apilan sin pisarse, y el de "Sin stock" sigue yendo a la derecha.
- **Un usado no puede entrar en un combo.** Los combos son sólo de productos nuevos: son una oferta repetible y un usado es una unidad única. Si un combo referencia un usado, se ignora entero y se avisa por consola.

## Los combos (la tarjeta grande de cada categoría)

Un combo son **dos productos vendidos juntos con descuento**. Ocupa la tarjeta grande de la categoría, la de la izquierda de la grilla.

Se definen en la lista `"combos"` de `productos.json`:

```json
{
  "id": "combo-iphone-16-magsafe",
  "categoria": "iPhone",
  "productos": ["iphone-16-pro-max-256", "magsafe-15w"],
  "descuento": 10,
  "etiqueta": "combo"
}
```

| Campo | Qué es |
|---|---|
| `id` | Identificador único del combo. Conviene que empiece con `combo-` para distinguirlo. |
| `categoria` | En qué sección se muestra como tarjeta grande (`iPhone`, `Mac`, `iPad`…). |
| `productos` | Los **ids de los dos productos** que lo forman. Tienen que existir en la lista `"productos"`. |
| `descuento` | El porcentaje de descuento sobre la suma de los dos precios. |
| `etiqueta` | Dejar en `"combo"`. Es lo que dibuja el cartelito "Combo". |

**El precio no se escribe**: se calcula solo como `(precio1 + precio2) × (1 − descuento/100)`. Si mañana cambia el precio de uno de los dos productos, el del combo se actualiza sin tocar nada.

Reglas que conviene tener presentes:

- Una categoría muestra su combo **sólo si los dos productos tienen stock**. Si a alguno se le acaba, el combo desaparece solo y la categoría vuelve a mostrar su tarjeta principal de siempre (la del producto marcado con `"principal": true`).
- Si una categoría no tiene combo definido, se ve como siempre.
- **Los combos son sólo de productos nuevos.** Si alguno de los dos ids es un producto usado, el combo se ignora entero y queda avisado en la consola del navegador. Un usado es una unidad única con su propio estado: no se puede prometer el mismo combo dos veces.
- El combo va siempre en la sección de **nuevos**; la de usados nunca lleva combo ni tarjeta grande.
- El producto que era principal **no desaparece**: pasa a verse como una tarjeta normal más y se sigue vendiendo suelto.
- Si el visitante está buscando algo o filtró por precio, el combo se esconde para no ocupar la celda grande con algo que no coincide con lo que pidió.
- Si alguno de los ids no existe, el combo se ignora y se avisa por consola (no rompe la página).

En el carrito el combo entra como **una sola línea** (`Combo: producto A + producto B`) con el precio ya con descuento, y en el WhatsApp aparece igual: una línea con los dos productos. Se le puede cambiar la cantidad y quitarlo como a cualquier otro. Un combo y sus productos sueltos pueden convivir en el mismo carrito.

Hoy hay tres combos de ejemplo: iPhone 16 Pro Max + Cargador MagSafe (10%), MacBook Air M3 + AirPods Pro 2 (8%) e iPad Air M2 + AirPods Pro 2 (8%).

---

## Cómo agregar la foto de un producto

Las fotos viven en la carpeta `img/`, y la página las encuentra sola por el nombre del archivo: **tiene que ser igual al `id` del producto, más `.jpg`**. No hay que tocar `productos.json` para nada.

Por ejemplo, para el producto con `"id": "iphone-16e-128"`, la foto va a ser:

```
img/iphone-16e-128.jpg
```

En cuanto el archivo está ahí con ese nombre exacto, la foto aparece sola en la tarjeta, en el carrusel, en el detalle del producto y en el comparador. Si el archivo todavía no existe (o el nombre no coincide), se ve el cuadro gris con el nombre del producto — nunca el ícono roto típico de una imagen que no cargó.

**Tamaño de las fotos: 1000 × 1000 píxeles, cuadradas y con fondo blanco.** Todas las que están hoy en `img/` se dejaron en esa medida para que el recuadro mida siempre lo mismo. Al agregar una foto nueva conviene respetarlo: no hace falta recortar el producto, alcanza con centrarlo en un lienzo cuadrado y rellenar con blanco lo que sobre.

Ojo con una distinción: esto empareja **el lienzo**, no cuánto ocupa el producto adentro. Si en una foto el equipo sale más "de cerca" que en otra, eso viene de la foto original y hay que reencuadrarla a mano para emparejarlo.

Tres de las fotos actuales venían más chicas que 1000 px (el iPhone 15 a 300, el iPhone 13 a 500 y la MacBook Air a 900) y se ampliaron para unificar la medida. Ampliar no inventa detalle: **esas tres conviene reemplazarlas por fotos sacadas en mayor resolución** cuando se pueda.

**Dos productos que comparten la misma foto** (por ejemplo, dos capacidades del mismo modelo): en vez de duplicar el archivo, se usa el campo `"imagen"` en el producto que NO tiene foto propia, apuntando a la ruta de la foto del otro. Ese campo, cuando está escrito, le gana a la convención automática. Ejemplo real ya aplicado en el catálogo: el "iPhone 15 128 GB" no tiene foto propia y usa la del "iPhone 15 Pro 256 GB":

```json
"imagen": "img/iphone-15-pro-256.jpg"
```

### Varias fotos del mismo producto (galería)

El detalle del producto puede mostrar más de una foto. No hay que tocar el JSON: funciona por el nombre del archivo, agregando un número al final.

Si el producto tiene id `iphone-15-pro-256`, además de la foto principal se pueden guardar:

```
img/iphone-15-pro-256-2.jpg
img/iphone-15-pro-256-3.jpg
img/iphone-15-pro-256-4.jpg
img/iphone-15-pro-256-5.jpg
```

Reglas:

- Se buscan **en orden** y se corta en la primera que falta. Si están la `-2` y la `-4` pero no la `-3`, sólo se va a ver la `-2`.
- El máximo son **5 fotos en total** (la principal más cuatro).
- Con una sola foto, el detalle se ve exactamente como siempre: no aparece ningún control de galería.
- Con dos o más, aparecen miniaturas debajo de la foto grande. Se cambia de foto con el mouse o con las flechas del teclado.

### Etiquetas: "Nuevo ingreso" y "Oferta"

Se le puede poner una etiqueta a un producto para que se destaque en la tarjeta. Es el campo `"etiqueta"` en `productos.json`, y admite dos valores:

```json
"etiqueta": "nuevo"
"etiqueta": "oferta"
```

- `"nuevo"` muestra un cartelito **"Nuevo ingreso"** (de contorno, más sobrio).
- `"oferta"` muestra **"Oferta"** (relleno, más fuerte).
- Si el campo no está, está en `null`, o dice cualquier otra cosa, no se muestra nada.

La etiqueta aparece arriba a la izquierda de la foto, y se ve en la tarjeta, en la tarjeta grande, en el carrusel de destacados y en el detalle del producto. El cartel de **"Sin stock"** va arriba a la derecha, así que un producto puede tener etiqueta y estar sin stock al mismo tiempo sin que se pisen.

Hay un tercer cartelito, **"Usado"** (ámbar), que no sale de este campo sino de `"condicion": "usado"` — ver "Productos usados" más arriba. Va también a la izquierda, **debajo** de la etiqueta de oferta o de nuevo ingreso cuando el producto tiene las dos, así que los tres carteles pueden convivir sin pisarse.

Hoy están marcados como ejemplo: el iPhone 16 Pro Max y los AirPods Pro 2 con `"nuevo"`, y el iPhone 15 128 GB, el iPhone 13 128 GB y los dos usados en oferta con `"oferta"`. El **iPhone 13 128 GB (usado)** es el caso completo: está usado, en oferta y sin stock a la vez, para que se vea que los tres carteles conviven.

### La nota importante sobre `stock`

**Si un producto no tiene el campo `"stock"` escrito, el sitio asume que hay stock disponible.** No hace falta poner `"stock": 999` ni nada parecido en los productos que tienen disponibilidad normal — simplemente no se escribe el campo.

El campo sólo hace falta cuando **no** hay stock: se pone `"stock": 0`, y automáticamente:
- el producto se muestra más apagado (no se oculta, sigue en el catálogo),
- aparece un cartel de "Sin stock",
- el botón cambia de "Agregar" a "Avisame" (abre WhatsApp con un mensaje ya armado para ese producto puntual). En el detalle del producto, donde hay más lugar, esos botones se leen completos: "Agregar al carrito" y "Avisame cuando llegue".

### El contador de unidades

Además del caso "sin stock", el número que se escriba en `"stock"` cambia lo que se muestra debajo del precio, tanto en la tarjeta como en el detalle:

| `stock` | Qué se ve |
|---|---|
| sin el campo | **Disponible** |
| `0` | nada en esa línea (ya lo dicen el cartel "Sin stock" y el botón "Avisame") |
| `1` | **¡Última unidad!** en rojo |
| `2` a `5` | **¡Últimas N unidades!** en rojo, con el número exacto |
| `6` o más | **Disponible**, sin número |

La idea es que el número sólo aparezca cuando de verdad apura: "quedan 47 unidades" no genera ninguna urgencia y encima se ve raro. El corte está en **5**; si se quiere mover, es la constante `STOCK_BAJO` al principio de `app.js` (buscá "CONTADOR DE UNIDADES").

Los combos usan la misma lógica, con el stock del producto que tenga menos: si un combo lleva un equipo con 2 unidades y un accesorio con 8, muestra "¡Últimas 2 unidades!".

La línea se dibuja **siempre**, aunque quede vacía, para que todas las tarjetas de la grilla midan exactamente lo mismo tenga el producto stock bajo, normal o cero.

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
