/* =====================================================================
   IPHONE ALLEN — lógica de la tienda
   Vanilla JS, sin dependencias, sin build step.
   =====================================================================

   ---------------------------------------------------------------------
   CÓMO EDITAR LOS PRODUCTOS  (archivo: productos.json)
   ---------------------------------------------------------------------
   productos.json es un array. Cada producto es un objeto así:

   {
     "id":            "iphone-15-128",     // único, sin espacios ni acentos
     "nombre":        "iPhone 15 128 GB",  // se muestra tal cual
     "categoria":     "iPhone",            // iPhone | Mac | iPad | Accesorios
     "subcategoria":  "Auriculares",       // SÓLO Accesorios. Ver nota abajo.
     "precio":        1749000,             // número, SIN puntos ni signo $
     "precioAnterior": 1899000,            // opcional: se muestra tachado
     "destacado":     true,                // true => aparece en el carrusel
     "stock":         5,                   // 0 => "Sin stock" (no se oculta)
     "specs":         ["128 GB", "Negro"], // lista corta para la tarjeta
     "detalle":       { ... },             // ficha del modal, ver abajo
     "imagen":        ""                   // "" => placeholder con el nombre
                                           // "fotos/iphone15.jpg" => foto real
   }

   El campo "detalle" son pares clave-valor que se muestran en el modal
   del producto, en el mismo orden en que los escribas:

     "detalle": {
       "Pantalla": "6.1\" Super Retina XDR",
       "Procesador": "A16 Bionic",
       "Almacenamiento": "128 GB"
     }

   Reglas rápidas:
   · Los precios se formatean solos en pesos argentinos. Escribí el número
     pelado: 1749000, no "$1.749.000".
   · "stock": 0 NO esconde el producto: lo muestra atenuado, con el cartel
     "Sin stock", y cambia el botón por "Avisame cuando llegue".
     Si un producto no tiene el campo "stock", se asume que hay.
   · Para sacar un producto, borrá su bloque { ... } completo (y la coma
     que lo separa del siguiente). El último producto NO lleva coma final.
   · Para que aparezca en el carrusel poné "destacado": true. Lo ideal 3 o 4.
   · Si agregás una categoría nueva, aparece sola en los filtros y como
     sección propia al final del catálogo.

   SUBCATEGORÍAS (campo "subcategoria")
   ------------------------------------
   · Sólo se usa en los productos de "Accesorios". iPhone, Mac e iPad se
     filtran por categoría a secas y NO llevan "subcategoria".
   · Hoy hay tres: "Auriculares", "Relojes", "Cargadores".
   · Para agregar una subcategoría nueva (por ejemplo "Fundas" o
     "Cables") alcanza con ponerla en el campo "subcategoria" de un
     producto de Accesorios. El desplegable "Productos" del menú lee las
     subcategorías del JSON: la nueva aparece sola, sin tocar código.
   · Una subcategoría sin ningún producto no se muestra en el menú.
     (Nota: JSON no admite comentarios; por eso esta guía vive acá y no
     dentro de productos.json.)
   ---------------------------------------------------------------------
*/

(function () {
  'use strict';

  /* ------------------------- CONFIGURACIÓN ------------------------- */

  // Nombre del negocio: se usa en todos los mensajes de WhatsApp.
  var NEGOCIO = 'IPHONE ALLEN';

  // WhatsApp en formato internacional, sin + ni espacios.
  var WHATSAPP = '5492613900039';

  // Mensaje del botón "Escribinos" (consulta general). Lo usan también el
  // botón flotante de WhatsApp y los enlaces de redes.
  var MENSAJE_CONSULTA = '¡Hola ' + NEGOCIO + '! Quería hacerles una consulta sobre los equipos.';

  // DIRECCIÓN PROVISORIA - confirmar con el cliente antes de publicar
  // (aparece también en index.html, con el mismo comentario)
  var DIRECCION = 'Río Cuarto 2341, Allen, Río Negro';

  // URL pública del sitio. Se usa para armar el link que se comparte desde
  // el modal de producto.
  // OJO: si el sitio pasa a un dominio propio hay que cambiarla acá Y en
  // las etiquetas og:url / og:image de los seis HTML.
  var SITIO = 'https://iphone-allen.vercel.app/';

  var STORAGE_KEY = 'nombre-carrito-v1';
  var ENTREGA_STORAGE_KEY = 'nombre-entrega-v1';

  // Orden fijo de las secciones del catálogo. Una categoría que aparezca
  // en productos.json y no esté acá se agrega al final.
  var ORDEN_CATEGORIAS = ['iPhone', 'Mac', 'iPad', 'Accesorios'];

  // Cada categoría tiene su propia página. El nombre del archivo no se
  // puede derivar del nombre de la categoría ("iPhone" -> iphones.html),
  // así que el mapa es explícito: si mañana se agrega una categoría a
  // productos.json hay que crear su HTML y sumarla acá, o el ítem del
  // menú va a apuntar a un archivo que no existe.
  var PAGINA_DE_CATEGORIA = {
    'iPhone': 'iphones.html',
    'Mac': 'mac.html',
    'iPad': 'ipad.html',
    'Accesorios': 'accesorios.html'
  };

  // Datos de contacto. Un valor que quede con el placeholder ("[ALGO]")
  // sencillamente no se renderiza: un ícono que lleva a una cuenta que
  // no existe es peor que no tenerlo.
  // El WhatsApp se usa en el hero, en el FAQ y en la compra; Instagram
  // sólo en la sección Contacto. Ni el footer ni el hero muestran redes.
  // OJO: "email" hoy no se muestra en ninguna parte — queda acá como dato
  // del negocio para cuando se defina dónde publicarlo.
  var CONTACTO = {
    whatsapp: WHATSAPP,
    instagram: 'iphone.allen',
    email: '[CORREO]'
  };

  // ---------------------------------------------------------------------
  // ENTREGA ESTIMADA — se edita ACÁ y cambia en todo el sitio: aparece en
  // el modal de cada producto y en el resumen de finalizar compra. Vale
  // igual para nuevos y usados.
  // Es un ESTIMADO a propósito, no una promesa: el texto de al lado
  // (ENTREGA_NOTA) aclara que se coordina, así no queda como un plazo
  // garantizado que después haya que explicar.
  // ---------------------------------------------------------------------
  var ENTREGA_ESTIMADA = '12 a 36 hs';
  var ENTREGA_NOTA = 'Coordinamos por WhatsApp';

  // ---------------------------------------------------------------------
  // TARJETAS DE LA FRANJA DE PROMO — TEXTO PROVISORIO.
  // Las cuotas (el título de la franja, en index.html) y esta lista de
  // medios de pago están puestas como ejemplo: hay que CONFIRMARLAS CON
  // EL CLIENTE antes de publicar, porque dependen de lo que le ofrezca
  // cada banco y de las promos vigentes.
  // Todas se pintan con el MISMO ícono genérico de tarjeta y el nombre al
  // lado: no se usan los logos oficiales, que son marcas registradas.
  // Agregar o sacar una tarjeta es editar este array y nada más.
  // ---------------------------------------------------------------------
  var TARJETAS = ['Visa', 'Mastercard', 'Cabal'];

  // Opciones del filtro nuevo/usado de la barra del catálogo. Va acá
  // arriba y no al lado de htmlCondicion() porque montarPaginaCatalogo()
  // se ejecuta antes de esa parte del archivo: declarada más abajo, el
  // `var` valdría undefined justo cuando se pinta la barra.
  var CONDICIONES = [
    { valor: 'todos',  texto: 'Todos'  },
    { valor: 'nuevos', texto: 'Nuevos' },
    { valor: 'usados', texto: 'Usados' }
  ];

  // Title propio de la página, para anteponerle el contador del carrito
  // (ver actualizarTituloPestana). Se lee antes de tocarlo nunca.
  var TITULO_BASE = document.title;

  // ---------------------------------------------------------------------
  // FORMAS DE PAGO — los medios ya están confirmados. Los "detalle" de
  // abajo son TEXTO PROVISORIO: neutros, sin afirmar descuentos, recargos
  // ni cuotas. Reemplazar por las condiciones reales cuando estén
  // definidas. Se pueden agregar o quitar elementos libremente.
  // ---------------------------------------------------------------------
  // "icono" es el nombre de una clave del objeto ICONOS (más abajo).
  var FORMAS_PAGO = [
    { titulo: 'Efectivo', detalle: 'En el local o contra entrega.', icono: 'billete' },
    { titulo: 'Transferencia', detalle: 'Te pasamos los datos por WhatsApp.', icono: 'transferencia' },
    { titulo: 'Tarjeta', detalle: 'Consultanos por las opciones disponibles.', icono: 'tarjeta' }
  ];

  // ---------------------------------------------------------------------
  // PREGUNTAS FRECUENTES — las respuestas son TEXTO PROVISORIO: neutras y
  // remiten a consultar, sin afirmar garantías, plazos ni condiciones que
  // no estén confirmadas. Reemplazar por la información real antes de
  // publicar. (La de "liberados" sí afirma algo concreto porque ya está
  // afirmado en el hero.) Se pueden agregar o quitar preguntas libremente.
  // ---------------------------------------------------------------------
  var FAQ = [
    { p: '¿Los equipos son nuevos o usados?', r: 'Trabajamos con equipos en distintas condiciones. Consultanos por el estado del modelo que te interesa.' },
    { p: '¿Qué garantía tienen?', r: 'Consultanos por la garantía disponible según el equipo.' },
    { p: '¿Los equipos vienen liberados?', r: 'Sí, los equipos vienen liberados para usar con cualquier compañía.' },
    { p: '¿Cómo puedo pagar?', r: 'Aceptamos efectivo, transferencia y tarjeta. Escribinos para coordinar la forma de pago.' },
    { p: '¿Hacen envíos? ¿A qué zonas?', r: 'Hacemos envíos a Allen y ciudades vecinas. Consultanos por tu zona.' },
    { p: '¿Puedo retirar en persona?', r: 'Sí, podés retirar tu pedido en el local. Coordinamos el horario por WhatsApp.' },
    { p: '¿Qué pasa si el equipo viene con una falla?', r: 'Escribinos apenas lo notes y lo resolvemos juntos.' }
  ];

  /* ------------------------------ ESTADO ---------------------------- */

  var productos = [];
  var combos = [];                   // ver construirCombos()
  var carrito = leerCarrito();       // [{ id, cantidad }]
  var busqueda = '';
  // Filtro por precio y orden de la grilla. Se combinan entre sí y con el
  // buscador: los tres se aplican en productosVisibles()/pintarCatalogo().
  var precioDesde = null;            // número o null
  var precioHasta = null;
  var rangoInvalido = false;         // "Desde" > "Hasta": se avisa y no se aplica
  var orden = 'defecto';             // 'defecto' | 'asc' | 'desc'
  var condicion = 'todos';           // 'todos' | 'nuevos' | 'usados'
  var slideActivo = 0;
  var destacados = [];
  var primeraPintada = true;         // el escalonado [10] es sólo la 1ra vez
  var idsEntrando = [];              // líneas del carrito que animan su entrada
  var bloquearClick = false;         // evita abrir el modal al terminar un swipe
  var comparadorA = null;            // id del producto en la columna 1
  var comparadorB = null;            // id del producto en la columna 2

  // El contador de la pestaña se pone YA, sin esperar el fetch del
  // catálogo: las cantidades están en el propio localStorage. Si no, al
  // entrar a cualquier página se vería un instante el title sin el
  // número, justo cuando el carrito no está vacío. Después de que
  // carguen los productos, pintarCarrito() lo recalcula contra el
  // catálogo real (por si algún id guardado ya no existe).
  actualizarTituloPestana(carrito.reduce(function (t, i) { return t + i.cantidad; }, 0));

  /* ----------------------------- UTILIDADES ------------------------- */

  var $ = function (sel) { return document.querySelector(sel); };

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function sinMovimiento() { return mqReduce.matches; }

  var pesos = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  function precio(valor) { return pesos.format(valor); }

  function esc(txt) {
    return String(txt)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Para buscar sin depender de tildes ni mayusculas. NFD separa el acento
  // de la letra; el rango U+0300-U+036F son esas marcas sueltas.
  var DIACRITICOS = new RegExp('[̀-ͯ]', 'g');

  function normalizar(txt) {
    return String(txt).toLowerCase().normalize('NFD').replace(DIACRITICOS, '');
  }

  // "Auriculares" -> "auriculares". Se usa para las anclas de las
  // subcategorías de accesorios (accesorios.html#auriculares).
  function slug(txt) {
    return normalizar(txt).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function paginaDe(categoria) {
    return PAGINA_DE_CATEGORIA[categoria] || (slug(categoria) + '.html');
  }

  /* ------------------------------- ICONOS ---------------------------
     Trazos estilo Tabler embebidos: sin CDN ni webfont de íconos.
     ------------------------------------------------------------------ */
  var ICONOS = {
    check: '<path d="M5 12l5 5l10 -10"></path>',
    carrito: '<circle cx="6" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle>' +
             '<path d="M17 17h-11v-14h-2"></path><path d="M6 5l14 1l-1 7h-13"></path>',
    sinResultados: '<path d="M5.039 5.062a7 7 0 0 0 9.91 9.89m1.584 -2.434a7 7 0 0 0 -9.038 -9.057"></path>' +
                   '<path d="M21 21l-6 -6"></path><path d="M3 3l18 18"></path>',
    chevron: '<path d="M6 9l6 6l6 -6"></path>',
    whatsapp: '<path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9"></path>' +
              '<path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"></path>',
    instagram: '<path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z"></path>' +
               '<path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>' +
               '<path d="M16.5 7.5m-.5 0a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0"></path>',
    lista: '<path d="M9 6l11 0"></path><path d="M9 12l11 0"></path><path d="M9 18l11 0"></path>' +
           '<path d="M5 6l0 .01"></path><path d="M5 12l0 .01"></path><path d="M5 18l0 .01"></path>',
    campana: '<path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"></path>' +
             '<path d="M9 17v1a3 3 0 0 0 6 0v-1"></path>',
    flecha: '<path d="M5 12l14 0"></path><path d="M13 18l6 -6"></path><path d="M13 6l6 6"></path>',
    cruz: '<path d="M18 6l-12 12"></path><path d="M6 6l12 12"></path>',
    billete: '<path d="M7 9m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z"></path>' +
             '<path d="M14 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>' +
             '<path d="M17 9v-2a2 2 0 0 0 -2 -2h-10a2 2 0 0 0 -2 2v6a2 2 0 0 0 2 2h2"></path>',
    transferencia: '<path d="M7 10h14l-4 -4"></path><path d="M17 14h-14l4 4"></path>',
    tarjeta: '<path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z"></path>' +
             '<path d="M3 10l18 0"></path><path d="M7 15l.01 0"></path><path d="M11 15l2 0"></path>',
    lupa: '<circle cx="10" cy="10" r="7"></circle><path d="M21 21l-6 -6"></path>',
    volver: '<path d="M15 6l-6 6l6 6"></path>',
    compartir: '<circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="6" r="3"></circle>' +
               '<circle cx="18" cy="18" r="3"></circle>' +
               '<path d="M8.7 10.7l6.6 -3.4"></path><path d="M8.7 13.3l6.6 3.4"></path>',
    sol: '<circle cx="12" cy="12" r="4"></circle>' +
         '<path d="M3 12h1M20 12h1M12 3v1M12 20v1M5.6 5.6l.7 .7M17.7 17.7l.7 .7M18.4 5.6l-.7 .7M6.3 17.7l-.7 .7"></path>',
    luna: '<path d="M12 3c.13 0 .26 0 .39 .04a6.5 6.5 0 1 0 8.57 8.57 .5 .5 0 0 1 .87 .38 9 9 0 1 1 -9.83 -9.83Z"></path>',
    flechaArriba: '<path d="M12 19V5"></path><path d="M5 12l7 -7l7 7"></path>',
    reloj: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    // tarjeta genérica de la franja de promo: a propósito NO es el logo de
    // ninguna marca (Visa/Mastercard/Cabal son marcas registradas), es una
    // tarjeta dibujada con el mismo trazo que el resto de los íconos
    tarjetaGenerica: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"></rect>' +
                     '<path d="M2.5 9.5h19"></path><path d="M6 15h3"></path>'
  };

  function icono(nombre, clase) {
    return '<svg class="ico ' + (clase || '') + '" viewBox="0 0 24 24" fill="none" ' +
           'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
           'stroke-linejoin="round" aria-hidden="true">' + ICONOS[nombre] + '</svg>';
  }

  // Interior de un botón con el tratamiento de bloque: el ícono a la
  // izquierda (aria-hidden, viene de icono()) y el texto a la derecha.
  // `extraSr` agrega texto sólo para lectores de pantalla.
  function btnPartes(nombreIcono, texto, extraSr) {
    return '<span class="btn__ico">' + icono(nombreIcono) + '</span>' +
           '<span class="btn__txt">' + texto + (extraSr || '') + '</span>';
  }

  // Los botones que ya vienen escritos en index.html marcan su ícono con
  // data-ico="nombre" en vez de repetir el SVG en el markup: así los
  // trazos viven en un solo lugar (ICONOS). Se rellenan una vez al cargar.
  function hidratarIconos(raiz) {
    Array.prototype.forEach.call((raiz || document).querySelectorAll('[data-ico]'), function (span) {
      var nombre = span.dataset.ico;
      if (ICONOS[nombre]) span.innerHTML = icono(nombre);
    });
  }

  /* --------------------------- PRODUCTO: PARTES --------------------- */

  // Si un producto no declara "stock", se asume que hay.
  function hayStock(p) { return p.stock === undefined || p.stock === null || p.stock > 0; }

  // ---------------------------------------------------------------------
  // CONTADOR DE UNIDADES — a partir del campo "stock" de productos.json.
  //   0            → no se dice nada acá: ya lo cubren el badge "Sin stock"
  //                  y el botón "Avisame". Igual se renderiza la línea
  //                  vacía para que todas las tarjetas midan lo mismo.
  //   1 a 5        → el número exacto, con urgencia ("¡Últimas 3 unidades!").
  //   6 o más      → "Disponible", sin número: "quedan 47" no apura a nadie.
  //   sin declarar → "Disponible" (se asume que hay).
  // Para cambiar el umbral alcanza con tocar STOCK_BAJO.
  // ---------------------------------------------------------------------
  var STOCK_BAJO = 5;

  function htmlStock(p) {
    if (!hayStock(p)) return '<p class="stock" aria-hidden="true"></p>';

    var n = p.stock;
    // Infinity lo puede traer un combo armado con productos sin "stock"
    var sinDato = n === undefined || n === null || n === Infinity;

    if (!sinDato && n <= STOCK_BAJO) {
      var texto = n === 1 ? '¡Última unidad!' : '¡Últimas ' + n + ' unidades!';
      return '<p class="stock stock--bajo">' + esc(texto) + '</p>';
    }
    return '<p class="stock">Disponible</p>';
  }

  /* ============================== COMBOS ==============================
     Un combo son DOS productos del catálogo vendidos juntos con un
     descuento. Se definen en productos.json, en el array "combos":

       {
         "id": "combo-iphone-16-magsafe",
         "categoria": "iPhone",
         "productos": ["iphone-16-pro-max-256", "magsafe-15w"],
         "descuento": 10,
         "etiqueta": "combo"
       }

     - "productos": los ids de los dos productos. Tienen que existir en el
       catálogo; si alguno no existe, el combo se ignora y se avisa por
       consola.
     - "categoria": en qué sección se muestra como tarjeta principal.
     - "descuento": porcentaje sobre la suma de los dos precios. El precio
       final NO se escribe a mano: se calcula acá.

     construirCombos() arma con cada definición un objeto con la misma
     forma que un producto (id, nombre, precio, stock, imagen…), así el
     carrito, el modal y el mensaje de WhatsApp no necesitan saber que es
     un combo. Lo único propio es la marca `esCombo` y la lista `items`.
     ================================================================== */
  function construirCombos(defs) {
    return (defs || []).map(function (def) {
      var ids = def.productos || [];
      var items = ids.map(function (id) {
        for (var i = 0; i < productos.length; i++) {
          if (productos[i].id === id) return productos[i];
        }
        return null;
      });

      if (items.length < 2 || items.indexOf(null) !== -1) {
        console.warn('Combo "' + def.id + '": necesita dos ids que existan en el ' +
                     'catálogo. Se ignora.');
        return null;
      }

      // Los combos son sólo de productos nuevos. Un usado es una unidad
      // única con su propio estado: no se puede prometer el mismo combo
      // dos veces ni mezclar su ficha con la de un producto sellado.
      var usados = items.filter(esUsado);
      if (usados.length) {
        console.warn('Combo "' + def.id + '": incluye producto(s) usado(s) (' +
                     usados.map(function (p) { return p.id; }).join(', ') +
                     '). Los combos son sólo de productos nuevos. Se ignora.');
        return null;
      }

      var suma = items.reduce(function (t, p) { return t + p.precio; }, 0);
      var pct = Number(def.descuento) || 0;
      var nombres = items.map(function (p) { return p.nombre; });

      return {
        id: def.id,
        esCombo: true,
        items: items,
        categoria: def.categoria,
        nombre: nombres.join(' + '),
        // En el carrito y en el WhatsApp se antepone "Combo:" para que no
        // se confunda con dos productos sueltos comprados por separado.
        nombreCarrito: 'Combo: ' + nombres.join(' + '),
        precio: Math.round(suma * (1 - pct / 100)),
        precioAnterior: suma,      // la suma sin descuento, para tacharla
        descuento: pct,
        // el combo se agota con el primero de los dos que se agote
        stock: Math.min.apply(null, items.map(function (p) {
          return (p.stock === undefined || p.stock === null) ? Infinity : p.stock;
        })),
        // foto de la línea del carrito: la del primer producto
        imagen: rutaImagen(items[0]),
        specs: nombres,
        etiqueta: def.etiqueta || 'combo'
      };
    }).filter(Boolean);
  }

  function ahorroCombo(c) { return c.precioAnterior - c.precio; }

  // El combo de una sección, si corresponde mostrarlo. Devuelve null y la
  // sección cae en su tarjeta principal de siempre cuando:
  //   - la sección no es la categoría entera (las subcategorías de
  //     accesorios comparten categoría y no deben repetir el combo),
  //   - alguno de los dos productos se quedó sin stock,
  //   - hay una búsqueda o un rango de precio puestos y el combo no
  //     entra: sería raro filtrar "hasta $100.000" y ver un combo de
  //     millones ocupando la celda grande.
  function comboDeSeccion(categoria, titulo) {
    if (titulo !== categoria) return null;
    // Un combo es de productos nuevos: filtrando por "usados" no pinta.
    if (condicion === 'usados') return null;

    for (var i = 0; i < combos.length; i++) {
      var c = combos[i];
      if (c.categoria !== categoria) continue;
      if (!hayStock(c)) return null;
      if (busqueda) return null;
      if (!rangoInvalido) {
        if (precioDesde !== null && c.precio < precioDesde) return null;
        if (precioHasta !== null && c.precio > precioHasta) return null;
      }
      return c;
    }
    return null;
  }

  // Ruta de la foto: si el producto trae "imagen" en productos.json esa
  // gana (para casos como compartir foto entre dos productos); si no,
  // se arma sola por convención a partir del id: img/<id>.jpg.
  // Para agregar la foto de un producto nuevo alcanza con guardarla en
  // img/ con ese nombre, sin tocar el JSON.
  function rutaImagen(p) {
    return p.imagen || ('img/' + p.id + '.jpg');
  }

  // Siempre se intenta la foto real. Si el archivo no existe o no carga,
  // el listener de "error" (más abajo, en captura) la reemplaza por el
  // mismo placeholder .media__ph que ya se usaba antes.
  // "eager" es true sólo para el hero y el carrusel de destacados: esas
  // se ven de entrada, ahí NO conviene loading="lazy".
  function media(p, clase, extra, eager) {
    var contenido =
      '<img class="media__img" src="' + esc(rutaImagen(p)) + '" alt="' + esc(p.nombre) + '"' +
      (eager ? '' : ' loading="lazy"') + '>';
    return '<div class="media ' + (clase || '') + '">' + contenido + (extra || '') + '</div>';
  }

  // El evento "error" de <img> no burbujea, por eso se escucha en fase
  // de captura sobre todo el documento: un único listener alcanza para
  // tarjetas, carrusel, modal y comparador, sin agregar "onerror" inline
  // en cada <img> ni exponer nada global.
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.classList.contains('media__img')) return;
    var ph = document.createElement('div');
    ph.className = 'media__ph';
    ph.textContent = img.alt;
    img.replaceWith(ph);
  }, true);

  function bloquePrecios(p) {
    var anterior = p.precioAnterior
      ? '<span class="precio--anterior">' + precio(p.precioAnterior) + '</span>'
      : '';
    return '<div class="card__precios">' + anterior +
           '<span class="precio">' + precio(p.precio) + '</span></div>';
  }

  // Con stock agrega al carrito; sin stock abre WhatsApp para que le avisen.
  // `texto` permite la versión compacta ("Agregar") de las tarjetas chicas.
  // "texto" y "textoSinStock" son las etiquetas cortas para donde el
  // espacio manda (las tarjetas de la grilla). Sin ellas se usan las
  // largas, que son las que van en el modal, el hero y el carrusel.
  // OJO: el texto corto del caso sin stock no es un detalle estético —
  // "Avisame cuando llegue" no entra al lado de "Comparar" en una tarjeta
  // angosta, envuelve a dos filas y esa tarjeta queda más alta que las
  // demás de la grilla.
  function botonAccion(p, clase, texto, textoSinStock) {
    var sr = '<span class="sr-only"> — ' + esc(p.nombre) + '</span>';

    if (hayStock(p)) {
      return '<button class="btn ' + (clase || '') + '" type="button" data-agregar="' + esc(p.id) + '">' +
             btnPartes('carrito', texto || 'Agregar al carrito', sr) + '</button>';
    }
    return '<a class="btn btn--sec ' + (clase || '') + '" data-avisar="' + esc(p.id) + '" ' +
           'href="' + urlWhatsapp(msgAviso(p)) + '" target="_blank" rel="noopener">' +
           btnPartes('campana', textoSinStock || 'Avisame cuando llegue', sr) + '</a>';
  }

  // El comparador está en index.html. Desde una página de categoría el
  // botón no puede cargar nada en pantalla: cruza de página llevando el
  // id en la URL, y del otro lado aplicarCompararDeLaUrl() lo carga.
  function botonComparar(p) {
    var sr = '<span class="sr-only"> — ' + esc(p.nombre) + '</span>';

    if (esInicio) {
      return '<button class="btn btn--sec btn--comparar" type="button" data-comparar="' + esc(p.id) + '">' +
             btnPartes('lista', 'Comparar', sr) + '</button>';
    }
    return '<a class="btn btn--sec btn--comparar" href="index.html?comparar=' + encodeURIComponent(p.id) + '">' +
           btnPartes('lista', 'Comparar', sr) + '</a>';
  }

  function badgeStock(p) {
    return hayStock(p) ? '' : '<span class="badge-stock">Sin stock</span>';
  }

  // ---------------------------------------------------------------------
  // ETIQUETAS DE PRODUCTO — campo "etiqueta" en productos.json.
  // Valores admitidos: "nuevo" (muestra "Nuevo ingreso") y "oferta"
  // (muestra "Oferta"). Sin el campo, en null, o con cualquier otro valor,
  // no se muestra nada. Va arriba a la IZQUIERDA de la foto; el badge
  // "Sin stock" va arriba a la derecha, así que los dos pueden convivir.
  // ---------------------------------------------------------------------
  var ETIQUETAS = {
    nuevo:  'Nuevo ingreso',
    oferta: 'Oferta'
  };

  function etiqueta(p) {
    var texto = ETIQUETAS[p.etiqueta];
    if (!texto) return '';
    return '<span class="etiqueta etiqueta--' + esc(p.etiqueta) + '">' + esc(texto) + '</span>';
  }

  /* =====================================================================
     PRODUCTOS USADOS — campos "condicion", "anio" y "estado"
     ---------------------------------------------------------------------
     Cada categoría se parte en dos secciones: primero los nuevos, abajo
     los usados. Un producto es usado sólo si lo dice explícitamente:

       "condicion": "usado"     // sin el campo se asume "nuevo"
       "anio": 2023             // año del modelo; ordena la sección
       "estado": {              // TODOS los campos son opcionales:
         "bateria": 87,                 // número, se muestra "87%"
         "pantalla": "Sin rayones",
         "carcasa": "Marca leve en el borde inferior",
         "uso": "6 meses",
         "reparaciones": "Ninguna",     // o qué se cambió
         "accesorios": "Con caja y cargador"
       }

     El que falte no se muestra: ni en la tarjeta ni en el modal queda una
     línea vacía.

     Un usado es SIEMPRE una entrada propia, no un campo que se le pone al
     producto nuevo: el mismo modelo puede estar a la venta sellado y
     usado a la vez, a precios distintos. Se duplica la entrada con otro
     id, se le baja el precio y se apunta "imagen" a la foto que ya tiene
     el nuevo — ese campo gana sobre la convención img/<id>.jpg, así que
     no hay que duplicar ningún archivo. Ejemplo completo, tal como está
     cargado hoy:

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
         "detalle": { ... },
         "imagen": "img/iphone-14-128.jpg"
       }

     Dónde aparece cada cosa:
     - La tarjeta lleva el chip "Usado" sobre la foto y un RESUMEN en la
       línea de specs (batería + estado de pantalla). No va todo: el alto
       de esa línea está reservado para que todas las tarjetas midan lo
       mismo, así que el detalle completo va al modal.
     - El modal abre con el bloque "Estado del equipo": todos los campos
       cargados, uno por fila. Es el informe de transparencia.

     Un usado se compra, se busca, se filtra y se ordena como cualquier
     otro producto. Lo único que NO puede es entrar en un combo (ver
     construirCombos): los combos son sólo de productos nuevos.
     ================================================================== */
  function esUsado(p) {
    return p.condicion === 'usado';
  }

  // Año del modelo, o null si no está cargado (esos van al final).
  function anioDe(p) {
    var n = Number(p.anio);
    return isFinite(n) && n > 0 ? n : null;
  }

  // Del modelo más nuevo al más viejo. Los que no tienen "anio" no se
  // pierden: quedan al final, en el orden en que vienen del JSON.
  function ordenarPorAnio(lista) {
    return lista.slice().sort(function (a, b) {
      var aa = anioDe(a), ab = anioDe(b);
      if (aa === null && ab === null) return 0;
      if (aa === null) return 1;
      if (ab === null) return -1;
      return ab - aa;
    });
  }

  function etiquetaUsado(p) {
    return esUsado(p) ? '<span class="etiqueta etiqueta--usado">Usado</span>' : '';
  }

  // Lo que va encima de la foto: las marcas de la IZQUIERDA (oferta/nuevo
  // y "Usado", apiladas) + el badge de stock a la derecha. Van en un
  // contenedor propio para que "Usado" y "Oferta" conviven sin pisarse:
  // el que apila es el flex de .marcas, no un top: en píxeles.
  function marcasSobreFoto(p) {
    var izquierda = etiqueta(p) + etiquetaUsado(p);
    return (izquierda ? '<div class="marcas">' + izquierda + '</div>' : '') + badgeStock(p);
  }

  /* --------------------- ESTADO DE UN USADO --------------------------
     El orden de las filas del modal lo fija ESTADO_ORDEN, no el orden en
     que estén escritas en el JSON: así todas las fichas se leen igual.
     Una clave que no esté en la lista igual se muestra (al final): más
     vale mostrar de más que esconder algo que el vendedor cargó.
     ------------------------------------------------------------------ */
  var ESTADO_ETIQUETAS = {
    bateria:      'Batería',
    pantalla:     'Pantalla',
    carcasa:      'Carcasa',
    uso:          'Tiempo de uso',
    reparaciones: 'Reparaciones',
    accesorios:   'Accesorios'
  };
  var ESTADO_ORDEN = ['bateria', 'pantalla', 'carcasa', 'uso', 'reparaciones', 'accesorios'];

  function valorEstado(clave, valor) {
    // la batería se carga como número y se muestra como porcentaje
    return clave === 'bateria' && typeof valor === 'number' ? valor + '%' : String(valor);
  }

  // Claves cargadas, en el orden de ESTADO_ORDEN y con las desconocidas
  // detrás. Descarta vacíos para no dejar filas huérfanas.
  function clavesEstado(p) {
    var e = p.estado || {};
    var cargada = function (k) {
      return e[k] !== undefined && e[k] !== null && String(e[k]).trim() !== '';
    };
    var conocidas = ESTADO_ORDEN.filter(cargada);
    var otras = Object.keys(e).filter(function (k) {
      return ESTADO_ORDEN.indexOf(k) === -1 && cargada(k);
    });
    return conocidas.concat(otras);
  }

  /* ------------- CUÁNTO SE AHORRA CONTRA EL MISMO MODELO NUEVO -------
     El usado puede declarar con qué producto nuevo del catálogo se
     compara, por id:

       "equivaleNuevo": "iphone-14-128"

     Sin ese campo —o si el id no existe— el usado se muestra como
     cualquier otro: no se inventa ninguna comparación.
     Además se exige que el nuevo sea MÁS CARO. Si alguna vez el usado
     quedara igual o más caro (un error de carga, o el nuevo en
     liquidación) mostrar "Ahorrás $0" o un número negativo sería peor
     que no mostrar nada.
     ------------------------------------------------------------------ */
  function equivalenteNuevo(p) {
    if (!esUsado(p) || !p.equivaleNuevo) return null;
    for (var i = 0; i < productos.length; i++) {
      var n = productos[i];
      if (n.id !== p.equivaleNuevo) continue;
      if (esUsado(n) || n.precio <= p.precio) return null;
      return n;
    }
    return null;
  }

  // { nuevo, monto, pct } o null. El porcentaje va sobre el precio del
  // nuevo, que es contra lo que se compara el ahorro.
  function ahorroVsNuevo(p) {
    var n = equivalenteNuevo(p);
    if (!n) return null;
    var monto = n.precio - p.precio;
    return { nuevo: n, monto: monto, pct: Math.round(monto / n.precio * 100) };
  }

  // Línea de la TARJETA. Se pinta SIEMPRE, aunque venga vacía: el CSS le
  // reserva el alto de un renglón a todas las tarjetas de la grilla, así
  // el precio y los botones siguen cayendo a la misma altura en las que
  // no tienen ahorro que mostrar (mismo criterio que el espaciador del
  // precio tachado).
  function lineaAhorro(p) {
    var a = ahorroVsNuevo(p);
    if (!a) return '<p class="card__ahorro" aria-hidden="true"></p>';
    return '<p class="card__ahorro">' +
             '<span class="card__ahorro-nuevo">Nuevo ' + precio(a.nuevo.precio) + '</span>' +
             '<span class="card__ahorro-sep" aria-hidden="true"> · </span>' +
             '<strong class="card__ahorro-monto">Ahorrás ' + precio(a.monto) + '</strong>' +
           '</p>';
  }

  // Entrega estimada del modal. El plazo sale de ENTREGA_ESTIMADA, arriba
  // de todo: se edita una vez y cambia acá y en el checkout.
  function bloqueEntrega() {
    return '<p class="entrega">' +
             icono('reloj', 'entrega__ico') +
             '<span class="entrega__txt">' +
               'Entrega estimada: <strong>' + esc(ENTREGA_ESTIMADA) + '</strong>' +
               '<span class="entrega__nota">' + esc(ENTREGA_NOTA) + '</span>' +
             '</span>' +
           '</p>';
  }

  // Bloque del MODAL: las dos puntas y el ahorro destacado. Va dentro del
  // informe de estado (ver bloqueEstado) porque es parte del mismo
  // argumento: esto es lo que tiene, y esto es lo que te ahorrás.
  function bloqueAhorro(p) {
    var a = ahorroVsNuevo(p);
    if (!a) return '';
    return '<div class="ahorro">' +
             '<div class="ahorro__filas">' +
               '<div class="ahorro__fila">' +
                 '<span class="ahorro__etq">Nuevo</span>' +
                 '<span class="ahorro__val ahorro__val--tachado">' + precio(a.nuevo.precio) + '</span>' +
               '</div>' +
               '<div class="ahorro__fila">' +
                 '<span class="ahorro__etq">Usado</span>' +
                 '<span class="ahorro__val">' + precio(p.precio) + '</span>' +
               '</div>' +
             '</div>' +
             '<p class="ahorro__total">Ahorrás ' + precio(a.monto) +
               ' <span class="ahorro__pct">(' + a.pct + '%)</span></p>' +
           '</div>';
  }

  // Resumen para la TARJETA: lo mínimo para decidir sin abrir el modal.
  // Devuelve un array porque se suma a las specs con el mismo separador.
  function resumenEstado(p) {
    var e = p.estado || {};
    var partes = [];
    if (typeof e.bateria === 'number') partes.push('Batería ' + e.bateria + '%');
    if (e.pantalla) partes.push(String(e.pantalla));
    else if (e.carcasa) partes.push(String(e.carcasa));
    return partes;
  }

  /* =====================================================================
     PÁGINA ACTUAL
     El sitio son cinco HTML que comparten este archivo. index.html es la
     portada; las otras cuatro son una categoría cada una y se identifican
     con data-categoria en su <main>. Todo lo que cambia entre páginas
     (qué se pinta, a dónde apuntan los enlaces del menú, cuál se marca
     como activo) sale de acá.
     ===================================================================== */

  var mainEl = document.querySelector('main');
  // data-categoria="iPhone" => página de una categoría
  // data-catalogo="completo" => productos.html, las cuatro juntas
  // sin ninguno de los dos => portada
  var categoriaPagina = mainEl ? (mainEl.dataset.categoria || null) : null;
  var catalogoCompleto = mainEl ? mainEl.dataset.catalogo === 'completo' : false;
  var esInicio = !categoriaPagina && !catalogoCompleto;

  /* =====================================================================
     ARMAZÓN COMPARTIDO (header, footer, carrito, modal, toast)
     No se escribe en los cinco HTML: se genera acá y se inyecta. Cada
     página sólo trae los contenedores vacíos #app-header y #app-footer
     más su contenido propio. Cambiar el menú se hace en un solo lugar.
     ===================================================================== */

  function htmlHeader() {
    // "Inicio" y el logotipo siempre van a la portada. "Contacto" vive en
    // index.html: desde una categoría hay que saltar de página.
    var hrefContacto = esInicio ? '#contacto' : 'index.html#contacto';
    var anclaSalto = esInicio ? '#destacados' : '#catalogo';

    return '<a class="skip-link" href="' + anclaSalto + '">Saltar al contenido</a>' +
      '<header class="header">' +
        '<div class="wrap">' +
          '<div class="navbar">' +
            '<a class="brand" href="index.html">' + htmlLogo() + '</a>' +
            '<span class="navbar__sep" aria-hidden="true"></span>' +
            '<nav class="nav" aria-label="Principal">' +
              '<a class="link-sub nav__link' + (esInicio ? ' is-activo' : '') + '" href="index.html"' +
                (esInicio ? ' aria-current="page"' : '') + '>Inicio</a>' +
              '<div class="nav-drop" id="navProductos">' +
                '<button class="link-sub nav__link nav-drop__btn' + (esInicio ? '' : ' is-activo') + '" ' +
                        'type="button" id="btnProductos" aria-haspopup="true" aria-expanded="false" ' +
                        'aria-controls="menuProductos">' +
                  'Productos' + icono('chevron', 'nav-drop__chevron') +
                '</button>' +
                '<div class="nav-drop__panel" id="menuProductos" role="menu" aria-label="Categorías de productos"></div>' +
              '</div>' +
              '<a class="link-sub nav__link" href="' + hrefContacto + '">Contacto</a>' +
            '</nav>' +
            '<button class="tema-btn" type="button" id="temaBtn" aria-label="Cambiar tema">' +
              '<span class="tema-btn__ico" id="temaBtnIco" aria-hidden="true"></span>' +
            '</button>' +
            '<button class="cart-btn" type="button" id="abrirCarrito" aria-haspopup="dialog" aria-controls="carrito">' +
              '<svg class="ico cart-btn__ico" id="iconoCarrito" viewBox="0 0 24 24" fill="none" ' +
                   'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
                   'stroke-linejoin="round" aria-hidden="true">' + ICONOS.carrito + '</svg>' +
              '<span class="sr-only">Carrito</span>' +
              '<span class="cart-btn__count" id="contadorCarrito" aria-hidden="true">0</span>' +
              '<span class="sr-only" id="contadorCarritoTexto">0 productos en el carrito</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  /* ---------------------------- TEMA -------------------------------
     El atributo data-tema ya lo dejó puesto un script inline en el <head>
     (antes de pintar, para que no haya destello). Acá sólo sincronizamos
     el ícono/aria del botón y enganchamos el interruptor. La misma clave
     de localStorage la lee ese script inline: si cambia una, cambiar la
     otra (nombre-tema).
     ------------------------------------------------------------------ */
  var TEMA_KEY = 'nombre-tema';

  function temaActual() {
    return document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro';
  }

  // El botón muestra el ícono del tema al que va a cambiar: en claro se ve
  // la luna (cambiar a oscuro), en oscuro el sol (cambiar a claro).
  function pintarBotonTema() {
    var oscuro = temaActual() === 'oscuro';
    var btn = $('#temaBtn');
    $('#temaBtnIco').innerHTML = icono(oscuro ? 'sol' : 'luna');
    btn.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }

  function aplicarTema(tema) {
    var raiz = document.documentElement;
    // la clase habilita la transición de 200ms sólo durante el cambio
    raiz.classList.add('cambiando-tema');
    raiz.dataset.tema = tema;
    try { localStorage.setItem(TEMA_KEY, tema); } catch (e) {}
    pintarBotonTema();
    // sacar la clase después de la transición para no dejarla puesta
    // (si no, cada hover volvería a animar el color)
    window.setTimeout(function () { raiz.classList.remove('cambiando-tema'); }, 260);
  }

  /* ------------------------ VOLVER ARRIBA ---------------------------
     Aparece recién pasados los 400px de scroll. El listener no hace nada
     por evento: sólo marca que hay trabajo pendiente y deja que el
     requestAnimationFrame siguiente lea el scroll una única vez por
     cuadro (leer scrollY en cada evento fuerza reflow y en mobile se
     disparan decenas por segundo).
     ------------------------------------------------------------------ */
  var MOSTRAR_ARRIBA_DESDE = 400;

  function iniciarVolverArriba() {
    var btn = $('#arribaBtn');
    var pendiente = false;

    function evaluar() {
      pendiente = false;
      btn.classList.toggle('is-visible', window.scrollY > MOSTRAR_ARRIBA_DESDE);
      // Se aprovecha este tick (uno por cuadro, ya throttleado) para
      // revelar lo que haya entrado en pantalla: cubre los saltos de
      // scroll y el caso de que el observer no dispare.
      revelarVisibles();
      if ($('#catalogoSecciones')) mostrarTarjetasVisibles();
    }

    window.addEventListener('scroll', function () {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(evaluar);
    }, { passive: true });

    // estado inicial: al recargar a media página el botón ya tiene que estar
    evaluar();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: sinMovimiento() ? 'auto' : 'smooth' });
    });
  }

  function iniciarTema() {
    pintarBotonTema();
    $('#temaBtn').addEventListener('click', function () {
      aplicarTema(temaActual() === 'oscuro' ? 'claro' : 'oscuro');
    });
  }

  /* --------------------------- LOGOTIPO -----------------------------
     Marca tipográfica, sin nada de Apple. Parte NEGOCIO en dos: la
     primera palabra (categoría) va liviana y espaciada, el resto (el
     lugar, que es lo distintivo) va en negrita. El elemento gráfico lo
     pone el CSS con un ::before, así no agrega nodos al árbol de
     accesibilidad: el texto sigue leyéndose "IPHONE ALLEN".

     Para cambiar de variante, tocar sólo esta constante:
       'regla'   — IPHONE │ ALLEN   (línea vertical fina)   [actual]
       'punto'   — IPHONE · ALLEN   (punto)
       'apilado' — IPHONE           (dos líneas)
                   ALLEN
     ------------------------------------------------------------------ */
  var LOGO_VARIANTE = 'regla';

  function htmlLogo(clase) {
    var partes = NEGOCIO.trim().split(/\s+/);
    var primera = partes.shift();
    var resto = partes.join(' ');

    var cls = 'logo logo--' + LOGO_VARIANTE + (clase ? ' ' + clase : '');
    // Sin segunda palabra no hay contraste que hacer: se rinde tal cual.
    if (!resto) return '<span class="' + cls + '">' + esc(primera) + '</span>';

    // El espacio entre los dos <span> es literal a propósito: es lo que
    // separa las palabras para un lector de pantalla.
    return '<span class="' + cls + '">' +
             '<span class="logo__cat">' + esc(primera) + '</span> ' +
             '<span class="logo__lugar">' + esc(resto) + '</span>' +
           '</span>';
  }

  function htmlFooter() {
    return '<footer class="footer">' +
      '<div class="wrap footer__inner">' +
        '<p class="footer__brand">' + htmlLogo('logo--grande') + '</p>' +
        // DIRECCIÓN PROVISORIA - confirmar con el cliente antes de publicar
        // (sale de la constante DIRECCION, arriba de este archivo)
        '<p class="footer__nota">' + esc(DIRECCION) + ' · Envíos a ciudades vecinas</p>' +
        '<p class="footer__legal">No somos revendedor oficial de Apple. Apple, iPhone, iPad y Mac ' +
          'son marcas registradas de Apple Inc.</p>' +
      '</div>' +
    '</footer>';
  }

  function htmlPasoCarrito(n, etiqueta, activo) {
    return '<li class="paso" data-activo="' + (activo ? 'true' : 'false') + '">' +
             '<span class="paso__barra" aria-hidden="true"></span>' +
             '<span class="paso__label">' + n + ' · ' + etiqueta + '</span>' +
           '</li>';
  }

  function htmlHorario(rango) {
    return '<label class="opcion"><input type="radio" name="horario" value="' + rango + '">' +
           '<span>' + rango + '</span></label>';
  }

  function htmlDrawer() {
    var horarios = ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00',
                    '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00'];

    return '<div class="overlay" id="overlayCarrito" hidden></div>' +
      '<aside class="drawer" id="carrito" role="dialog" aria-modal="true" aria-labelledby="carritoTitulo" hidden>' +
        '<div class="drawer__head">' +
          '<h2 class="drawer__titulo" id="carritoTitulo">Tu carrito</h2>' +
          '<button class="drawer__cerrar" type="button" id="cerrarCarrito" aria-label="Cerrar carrito">' +
            '<span aria-hidden="true">✕</span>' +
          '</button>' +
        '</div>' +

        '<div class="drawer__body">' +
          '<div class="carrito-lista" id="carritoLista"><div id="carritoItems"></div></div>' +
        '</div>' +

        '<div class="drawer__foot" id="pieCarrito">' +
          '<div class="drawer__anclado">' +
            '<div class="drawer__total">' +
              '<span>Total</span>' +
              '<strong class="precio precio--total" id="carritoTotal">$ 0</strong>' +
            '</div>' +
            '<button class="btn btn--compacto" type="button" id="pedirWhatsapp">' +
              btnPartes('flecha', 'Finalizar compra') +
            '</button>' +
          '</div>' +
          '<button class="btn-plano" type="button" id="vaciarCarrito">Vaciar carrito</button>' +
        '</div>' +
      '</aside>';
  }

  /* ------------------- VISTA DE FINALIZAR COMPRA ---------------------
     Pantalla completa, se abre desde "Finalizar compra" del drawer. Trae
     el resumen del pedido, el formulario de entrega, un bloque
     informativo con el total y los medios de pago, y una fila de
     productos sugeridos.
     ------------------------------------------------------------------ */
  function htmlCheckout() {
    var horarios = ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00',
                    '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00'];

    return '<div class="checkout" id="checkout" role="dialog" aria-modal="true" ' +
                'aria-labelledby="checkoutTitulo" hidden>' +
        '<div class="drawer__head">' +
          '<button class="drawer__volver" type="button" id="volverAlCarrito">' +
            icono('volver') + '<span>Volver</span>' +
          '</button>' +
          '<h2 class="drawer__titulo" id="checkoutTitulo">Finalizar compra</h2>' +
        '</div>' +

        '<ol class="pasos" id="pasosCarrito" aria-label="Pasos de la compra">' +
          htmlPasoCarrito(1, 'Carrito', true) +
          htmlPasoCarrito(2, 'Datos', false) +
          htmlPasoCarrito(3, 'WhatsApp', false) +
        '</ol>' +

        '<div class="checkout__scroll">' +
          '<div class="checkout__grid">' +
            '<div class="checkout__principal">' +

              '<section class="resumen-pedido" aria-labelledby="resumenPedidoTitulo">' +
                '<h3 class="resumen__titulo" id="resumenPedidoTitulo">Tu pedido</h3>' +
                '<div id="checkoutPedido"></div>' +
              '</section>' +

          '<form class="form-entrega" id="formEntrega" novalidate>' +

            '<h3 class="form-entrega__titulo" id="formEntregaTitulo" tabindex="-1">Datos de entrega</h3>' +
            '<p class="form-entrega__bajada">Completá tus datos para confirmar la compra.</p>' +

            '<fieldset class="campo">' +
              '<legend class="campo__label">Método de entrega <span class="req" aria-hidden="true">*</span></legend>' +
              '<div class="opciones" role="radiogroup" aria-label="Método de entrega">' +
                '<label class="opcion"><input type="radio" name="metodoEntrega" value="Envío" id="metodoEnvio" checked><span>Envío</span></label>' +
                '<label class="opcion"><input type="radio" name="metodoEntrega" value="Retiro" id="metodoRetiro"><span>Retiro</span></label>' +
              '</div>' +
            '</fieldset>' +

            '<div class="campo">' +
              '<label class="campo__label" for="entregaNombre">Nombre y apellido <span class="req" aria-hidden="true">*</span></label>' +
              '<input class="input" type="text" id="entregaNombre" name="nombre" placeholder="Ej: Juan Pérez" autocomplete="name">' +
              '<p class="campo__error" id="errorNombre" hidden></p>' +
            '</div>' +

            '<div class="campo" id="campoDireccion">' +
              '<label class="campo__label" for="entregaDireccion">Dirección completa <span class="req" aria-hidden="true">*</span></label>' +
              '<input class="input" type="text" id="entregaDireccion" name="direccion" placeholder="Ej: Río Cuarto 2341" autocomplete="street-address">' +
              '<p class="campo__error" id="errorDireccion" hidden></p>' +
            '</div>' +

            '<div class="campo">' +
              '<label class="campo__label" for="entregaTelefono">Número de teléfono <span class="req" aria-hidden="true">*</span></label>' +
              '<input class="input" type="tel" id="entregaTelefono" name="telefono" placeholder="Ej: 2985551234" autocomplete="tel" inputmode="tel">' +
              '<p class="campo__error" id="errorTelefono" hidden></p>' +
            '</div>' +

            '<div class="campo">' +
              '<label class="campo__label" for="entregaEmail">Correo electrónico <span class="campo__opcional">(opcional)</span></label>' +
              '<input class="input" type="email" id="entregaEmail" name="email" placeholder="Ej: tu@email.com" autocomplete="email">' +
              '<p class="campo__error" id="errorEmail" hidden></p>' +
            '</div>' +

            '<fieldset class="campo">' +
              '<legend class="campo__label">' +
                '<span id="horarioLabelTexto">Horario de entrega</span> <span class="req" aria-hidden="true">*</span>' +
              '</legend>' +
              '<div class="opciones opciones--horarios" id="grupoHorario" role="radiogroup" aria-labelledby="horarioLabelTexto">' +
                horarios.map(htmlHorario).join('') +
              '</div>' +
              '<p class="campo__error" id="errorHorario" hidden></p>' +
            '</fieldset>' +

            '<button class="btn btn--compacto" type="submit">' +
              btnPartes('whatsapp', 'Confirmar compra por WhatsApp') +
            '</button>' +

            '<p class="enviado" id="pedidoEnviado" hidden>' +
              '<svg class="enviado__tilde" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
                   'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M5 12l5 5l10 -10"></path>' +
              '</svg>' +
              '<span>Te abrimos WhatsApp con el pedido</span>' +
            '</p>' +

            '<p class="form-entrega__nota">Se abrirá WhatsApp con los productos del carrito para coordinar el pago y la entrega.</p>' +
            '<p class="form-entrega__privacidad">Tus datos se envían sólo por WhatsApp, no se guardan en el sitio. ' +
              'Quedan escritos en este navegador para no tener que repetirlos.</p>' +
            // Los campos se completan solos con lo último que se escribió
            // (ver aplicarDatosGuardados). Sin una salida, un dato mal
            // cargado —o una prueba— se queda para siempre y parece parte
            // del formulario. Este botón sólo aparece si hay algo guardado.
            '<button class="btn-plano" type="button" id="olvidarDatos" hidden>Borrar mis datos guardados</button>' +
          '</form>' +
            '</div>' +

            // Columna informativa: no agrega campos, sólo cierra las dudas
            // que suelen frenar la compra (cuánto es, cómo se paga, cómo
            // llega). En mobile cae debajo del formulario.
            '<aside class="checkout__resumen" aria-labelledby="resumenTitulo">' +
              '<h3 class="resumen__titulo" id="resumenTitulo">Resumen de compra</h3>' +
              '<dl class="resumen__cuentas">' +
                '<div class="resumen__fila">' +
                  '<dt>Subtotal</dt><dd id="resumenSubtotal">$ 0</dd>' +
                '</div>' +
                '<div class="resumen__fila">' +
                  '<dt>Envío</dt><dd class="resumen__suave">A coordinar por WhatsApp</dd>' +
                '</div>' +
                // el plazo sale de ENTREGA_ESTIMADA (arriba de todo), el
                // mismo que muestra el modal de cada producto
                '<div class="resumen__fila">' +
                  '<dt>Entrega estimada</dt>' +
                  '<dd class="resumen__suave" id="resumenEntrega"></dd>' +
                '</div>' +
                '<div class="resumen__fila resumen__fila--total">' +
                  '<dt>Total</dt>' +
                  '<dd><strong class="precio precio--total" id="resumenTotal">$ 0</strong></dd>' +
                '</div>' +
              '</dl>' +
              '<p class="resumen__label">Medios de pago</p>' +
              '<ul class="resumen__pagos" id="resumenPagos"></ul>' +
              '<p class="resumen__nota">' + icono('check') +
                '<span>Equipos liberados, con soporte después de la venta.</span></p>' +
            '</aside>' +
          '</div>' +

          // Sugeridos: sólo con stock y fuera del carrito (ver pintarSugeridos)
          '<section class="sugeridos" id="sugeridos" aria-labelledby="sugeridosTitulo" hidden>' +
            '<h3 class="resumen__titulo" id="sugeridosTitulo">También te puede interesar</h3>' +
            '<div class="sugeridos__fila" id="sugeridosFila"></div>' +
          '</section>' +
        '</div>' +
      '</div>';
  }

  // Único botón flotante del sitio: vuelve al tope. Fijo abajo a la
  // derecha en las seis páginas, con z-index 30 (por debajo del header,
  // del velo, del carrito y del modal), y app.js lo oculta del todo
  // mientras haya una capa abierta (ver ocultarFlotantes). Aparece recién
  // después de scrollear: arranca sin la clase .is-visible.
  function htmlBotonArriba() {
    return '<button class="arriba-btn" id="arribaBtn" type="button" ' +
           'aria-label="Volver arriba">' + icono('flechaArriba') + '</button>';
  }

  function htmlModal() {
    return '<div class="overlay" id="overlayModal" hidden></div>' +
      '<div class="modal" id="modalProducto" role="dialog" aria-modal="true" aria-labelledby="modalNombre" hidden>' +
        '<button class="modal__cerrar" type="button" id="modalCerrar" aria-label="Cerrar detalle del producto">' +
          '<span aria-hidden="true">✕</span>' +
        '</button>' +
        '<div class="modal__scroll" id="modalContenido"></div>' +
      '</div>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
  }

  // El armazón se inyecta ANTES de cualquier otra cosa: el resto del
  // archivo consulta #carrito, #modalProducto, #toast y los campos del
  // formulario en el nivel superior, y todos viven acá adentro.
  document.getElementById('app-header').innerHTML = htmlHeader();
  document.getElementById('app-footer').innerHTML = htmlFooter();
  document.body.insertAdjacentHTML('beforeend',
    htmlDrawer() + htmlCheckout() + htmlModal() + htmlBotonArriba());

  iniciarTema();
  iniciarVolverArriba();

  /* ---------------------------- CARGA DE DATOS ---------------------- */

  // La grilla sólo existe en las páginas de catálogo; en la portada no
  // hay catálogo, así que tampoco hay esqueletos que mostrar.
  if (!esInicio) montarPaginaCatalogo();

  hidratarIconos();
  // Estas tres son contenido estático de la portada: se pintan de una y
  // siguen ahí aunque el fetch de productos falle.
  if (esInicio) {
    pintarPagos();
    pintarFaq();
    pintarRedesContacto();
    pintarTarjetasPromo();
  }

  fetch('productos.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      // productos.json puede venir en dos formas: la vieja (un array de
      // productos, sin combos) y la actual ({ productos: [...],
      // combos: [...] }). Se aceptan las dos para que un JSON viejo siga
      // funcionando sin tocar nada.
      productos = Array.isArray(data) ? data : (data.productos || []);
      combos = construirCombos(Array.isArray(data) ? [] : (data.combos || []));

      destacados = productos.filter(function (p) { return p.destacado; });
      if (!destacados.length) destacados = productos.slice(0, 3);

      construirMenuProductos();
      pintarCarrito();

      if (esInicio) {
        pintarHero();
        iniciarCarrusel();
        iniciarComparador();
      } else {
        pintarCatalogo();
        // sólo al cargar: pintarCatalogo() vuelve a correr con cada tecla
        // del buscador y no corresponde reabrir el modal cada vez.
        abrirProductoDeLaUrl();
      }

      // Recién acá: hasta que no está el contenido, las secciones miden
      // poco y entrarían TODAS juntas en pantalla, revelándose de una.
      revelarSecciones();
    })
    .catch(function (err) {
      // Ocurre al abrir el HTML con doble clic (file://): el navegador
      // bloquea fetch. Hay que servirlo por HTTP.
      var aviso =
        '<div class="aviso"><strong>No se pudieron cargar los productos.</strong><br>' +
        'Si abriste el archivo con doble clic, el navegador bloquea la lectura de ' +
        '<code>productos.json</code>. Levantá un servidor local desde esta carpeta, ' +
        'por ejemplo con <code>python -m http.server</code>, y entrá a ' +
        '<code>http://localhost:8000</code>.<br><small>Detalle: ' + esc(err.message) + '</small></div>';

      var destino = $('#catalogoSecciones') || $('#heroProducto');
      if (destino) destino.innerHTML = aviso;
      console.error('[tienda] no se pudo cargar productos.json:', err);

      // que un fetch fallido no deje las secciones invisibles
      revelarSecciones();
    });

  // [9] esqueletos con la misma forma que la tarjeta real
  function pintarEsqueletos() {
    var tarjetaFalsa =
      '<div class="skel-card">' +
        '<div class="skel skel--media"></div>' +
        '<div class="skel skel--linea"></div>' +
        '<div class="skel skel--corta"></div>' +
        '<div class="skel skel--precio"></div>' +
        '<div class="skel skel--boton"></div>' +
      '</div>';

    var tarjetas = '';
    for (var i = 0; i < 8; i++) tarjetas += tarjetaFalsa;

    $('#catalogoSecciones').innerHTML =
      '<section class="cat" aria-hidden="true">' +
        '<header class="cat__head"><span class="skel skel--linea" style="width:130px;height:22px"></span></header>' +
        '<div class="skel-grilla">' + tarjetas + '</div>' +
      '</section>';
  }

  /* ------------------------------- HERO ----------------------------- */

  function pintarHero() {
    var p = destacados[0];
    if (!p) return;

    $('#heroProducto').innerHTML =
      '<article class="destacado-card">' +
        '<span class="destacado-card__cinta">Destacado</span>' +
        media(p, '', marcasSobreFoto(p), true) +
        '<div>' +
          '<h2 class="destacado-card__nombre">' + esc(p.nombre) + '</h2>' +
          '<p class="destacado-card__specs">' + esc((p.specs || []).join(' · ')) + '</p>' +
        '</div>' +
        '<div class="destacado-card__fila">' +
          bloquePrecios(p) +
        '</div>' +
        botonAccion(p, 'btn--compacto') +
      '</article>';
  }

  /* ----------------------------- CARRUSEL ---------------------------
     Sólo existe en la portada: las variables se resuelven dentro de
     iniciarCarrusel(), que se llama nada más si el markup está presente.
     ------------------------------------------------------------------ */

  var track, barras, viewport, btnPrev, btnNext;

  function iniciarCarrusel() {
    track = $('#carruselTrack');
    barras = $('#carruselBarras');
    viewport = $('#carruselViewport');
    btnPrev = $('#carruselPrev');
    btnNext = $('#carruselNext');
    if (!track) return;

    btnPrev.addEventListener('click', function () { irASlide(slideActivo - 1); });
    btnNext.addEventListener('click', function () { irASlide(slideActivo + 1); });

    barras.addEventListener('click', function (e) {
      var b = e.target.closest('[data-slide]');
      if (b) irASlide(Number(b.dataset.slide));
    });

    // Flechas del teclado sobre el carrusel
    $('#carrusel').addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { irASlide(slideActivo + 1); enfocarBarra(); }
      if (e.key === 'ArrowLeft')  { irASlide(slideActivo - 1); enfocarBarra(); }
    });

    // Swipe táctil (pointer events: sirve para dedo y mouse)
    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      arrastre = { x: e.clientX, y: e.clientY, dx: 0, decidido: false, horizontal: false };
    });

    viewport.addEventListener('pointermove', function (e) {
      if (!arrastre) return;
      arrastre.dx = e.clientX - arrastre.x;
      var dy = e.clientY - arrastre.y;

      // Primer movimiento: decidir si el gesto es horizontal (swipe) o vertical (scroll)
      if (!arrastre.decidido && (Math.abs(arrastre.dx) > 8 || Math.abs(dy) > 8)) {
        arrastre.decidido = true;
        arrastre.horizontal = Math.abs(arrastre.dx) > Math.abs(dy);
      }
      if (!arrastre.horizontal) return;

      var ancho = viewport.offsetWidth || 1;
      var pct = (arrastre.dx / ancho) * 100;
      track.style.transition = 'none';
      track.style.transform = 'translateX(' + (-slideActivo * 100 + pct) + '%)';
    });

    viewport.addEventListener('pointerup', terminarArrastre);
    viewport.addEventListener('pointercancel', terminarArrastre);
    viewport.addEventListener('pointerleave', terminarArrastre);

    pintarCarrusel();
  }

  function pintarCarrusel() {
    track.innerHTML = destacados.map(function (p, i) {
      return '<article class="carrusel__slide" id="slide-' + i + '">' +
               media(p, '', marcasSobreFoto(p), true) +
               '<div>' +
                 '<h3 class="carrusel__nombre">' +
                   '<button class="card__abrir" type="button" data-modal="' + esc(p.id) + '">' +
                     esc(p.nombre) +
                   '</button>' +
                 '</h3>' +
                 '<p class="carrusel__specs">' + esc((p.specs || []).join(' · ')) + '</p>' +
               '</div>' +
               '<div class="carrusel__pie">' +
                 bloquePrecios(p) +
                 botonAccion(p, 'btn--compacto') +
               '</div>' +
             '</article>';
    }).join('');

    barras.innerHTML = destacados.map(function (p, i) {
      return '<button class="barra" type="button" role="tab" data-slide="' + i + '" ' +
             'aria-controls="slide-' + i + '" ' +
             'aria-label="Ver ' + esc(p.nombre) + '"></button>';
    }).join('');

    irASlide(0);
  }

  function irASlide(i) {
    slideActivo = Math.max(0, Math.min(i, destacados.length - 1));
    track.style.transform = 'translateX(' + (-slideActivo * 100) + '%)';

    Array.prototype.forEach.call(track.children, function (slide, idx) {
      var visible = idx === slideActivo;
      slide.setAttribute('aria-hidden', visible ? 'false' : 'true');
      // los controles de los slides ocultos quedan fuera del orden de tabulación
      Array.prototype.forEach.call(slide.querySelectorAll('button, a'), function (b) {
        b.tabIndex = visible ? 0 : -1;
      });
    });

    Array.prototype.forEach.call(barras.children, function (b, idx) {
      b.setAttribute('aria-selected', idx === slideActivo ? 'true' : 'false');
      b.tabIndex = idx === slideActivo ? 0 : -1;
    });

    btnPrev.disabled = slideActivo === 0;
    btnNext.disabled = slideActivo === destacados.length - 1;
  }

  function enfocarBarra() {
    if (document.activeElement && document.activeElement.classList.contains('barra')) {
      barras.children[slideActivo].focus();
    }
  }

  var arrastre = null;

  function terminarArrastre() {
    if (!arrastre) return;
    var dx = arrastre.horizontal ? arrastre.dx : 0;
    arrastre = null;
    track.style.transition = '';

    // si hubo swipe, el click que viene después no debe abrir el modal
    if (Math.abs(dx) > 8) {
      bloquearClick = true;
      setTimeout(function () { bloquearClick = false; }, 350);
    }

    var umbral = Math.min(80, viewport.offsetWidth * 0.18);
    if (dx < -umbral) irASlide(slideActivo + 1);
    else if (dx > umbral) irASlide(slideActivo - 1);
    else irASlide(slideActivo);
  }

  /* ------------------------- CATEGORÍAS Y BUSCADOR ------------------ */

  function categoriasConProductos() {
    var presentes = [];
    productos.forEach(function (p) {
      if (presentes.indexOf(p.categoria) === -1) presentes.push(p.categoria);
    });

    var ordenadas = ORDEN_CATEGORIAS.filter(function (c) {
      return presentes.indexOf(c) !== -1;
    });
    presentes.forEach(function (c) {
      if (ordenadas.indexOf(c) === -1) ordenadas.push(c);
    });
    return ordenadas;
  }

  function conteo(categoria, n) {
    var palabra = categoria === 'Accesorios' ? 'accesorio' : 'equipo';
    return n + ' ' + palabra + (n === 1 ? '' : 's');
  }

  /* --------------------- PÁGINAS DE CATÁLOGO -------------------------
     Las cuatro de categoría y productos.html (todas juntas). El armazón
     —título, fila de pastillas, buscador, contenedor de la grilla— se
     arma acá para no repetirlo en los cinco HTML.
     ------------------------------------------------------------------ */

  var buscador, campoBusqueda, lupa;

  // Fila de pastillas: navegación entre las páginas del catálogo, no un
  // filtro que repinta. Sale de ORDEN_CATEGORIAS y no de productos.json
  // para poder pintarse junto al armazón, antes de que llegue el fetch.
  function htmlFiltrosNavegacion() {
    var pastillas = ORDEN_CATEGORIAS.map(function (c) {
      var activa = c === categoriaPagina;
      return '<a class="filtro" href="' + esc(paginaDe(c)) + '"' +
             (activa ? ' aria-current="page"' : '') + '>' + esc(c) + '</a>';
    });

    pastillas.push('<a class="filtro" href="productos.html"' +
                   (catalogoCompleto ? ' aria-current="page"' : '') + '>Ver todo</a>');

    return '<nav class="filtros" aria-label="Categorías del catálogo">' +
             pastillas.join('') +
           '</nav>';
  }

  function montarPaginaCatalogo() {
    var titulo = catalogoCompleto ? 'Todos los productos' : categoriaPagina;

    mainEl.innerHTML =
      '<section class="seccion" id="catalogo">' +
        '<div class="wrap">' +
          '<header class="seccion__head seccion__head--catalogo">' +
            '<h1 class="seccion__titulo">' + esc(titulo) + '</h1>' +
            '<p class="seccion__sub" id="conteoCategoria">Precios finales en pesos. Consultá por financiación.</p>' +
          '</header>' +
          '<div class="barra-catalogo">' +
            htmlFiltrosNavegacion() +
            '<div class="herramientas">' +
              htmlRangoPrecio() +
              htmlCondicion() +
              htmlOrden() +
              // combobox: el input filtra la grilla como siempre y además
              // abre la lista de sugerencias (ver iniciarSugerencias)
              '<div class="buscador" id="buscador" data-abierto="false">' +
                '<button class="buscador__lupa" type="button" id="buscadorToggle" ' +
                        'aria-expanded="false" aria-controls="busqueda" aria-label="Buscar productos">' +
                  icono('lupa') +
                '</button>' +
                '<input class="buscador__campo" id="busqueda" type="search" placeholder="Buscar equipo…" ' +
                       'aria-label="Buscar productos por nombre" tabindex="-1" autocomplete="off" ' +
                       'role="combobox" aria-expanded="false" aria-controls="sugerencias" ' +
                       'aria-autocomplete="list">' +
                '<ul class="sugerencias" id="sugerencias" role="listbox" ' +
                    'aria-label="Sugerencias de productos" hidden></ul>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<p class="rango__error" id="rangoError" role="alert" hidden></p>' +
          '<div class="secciones" id="catalogoSecciones" aria-live="polite"></div>' +
          '<div id="catalogoVacio" hidden></div>' +
        '</div>' +
      '</section>';

    pintarEsqueletos();
    iniciarBuscador();
    iniciarRangoPrecio();
    iniciarCondicion();
    iniciarOrden();
  }

  /* --------------------- FILTRO POR PRECIO ---------------------------
     Dos campos opcionales que se combinan con el buscador y con el orden.
     Van en type=text (no number) porque se muestran formateados con
     separador de miles y `number` no admite puntos; el teclado numérico
     en mobile lo pide inputmode.
     ------------------------------------------------------------------ */
  function htmlRangoPrecio() {
    return '<div class="rango" role="group" aria-labelledby="rangoLabel">' +
             '<span class="sr-only" id="rangoLabel">Filtrar por precio</span>' +
             '<input class="rango__campo" id="precioDesde" type="text" inputmode="numeric" ' +
                    'placeholder="Desde" aria-label="Precio desde" autocomplete="off">' +
             '<span class="rango__sep" aria-hidden="true">–</span>' +
             '<input class="rango__campo" id="precioHasta" type="text" inputmode="numeric" ' +
                    'placeholder="Hasta" aria-label="Precio hasta" autocomplete="off">' +
             '<button class="rango__limpiar" type="button" id="limpiarRango" ' +
                     'aria-label="Limpiar filtro de precio" hidden>' + icono('cruz') + '</button>' +
           '</div>';
  }

  /* -------------------- FILTRO NUEVO / USADO -------------------------
     Tres opciones excluyentes, así que van como radios de verdad y no
     como botones con aria: el grupo se recorre con las flechas y lo
     anuncia el lector de pantalla sin que haya que programar nada. El
     input real queda oculto y la pastilla visible es el <label>.
     (La lista CONDICIONES se declara arriba de todo, con el resto de las
     constantes: montarPaginaCatalogo() corre antes que esta parte del
     archivo y un `var` de acá todavía valdría undefined.)
     ------------------------------------------------------------------ */
  function htmlCondicion() {
    var opciones = CONDICIONES.map(function (o) {
      var id = 'cond-' + o.valor;
      return '<input class="condicion__radio" type="radio" name="condicion" ' +
                    'id="' + id + '" value="' + o.valor + '"' +
                    (condicion === o.valor ? ' checked' : '') + '>' +
             '<label class="condicion__op" for="' + id + '">' + esc(o.texto) + '</label>';
    }).join('');

    return '<fieldset class="condicion" id="condicion">' +
             '<legend class="sr-only">Filtrar por condición</legend>' +
             opciones +
           '</fieldset>';
  }

  function iniciarCondicion() {
    $('#condicion').addEventListener('change', function (e) {
      var radio = e.target.closest('.condicion__radio');
      if (!radio) return;
      condicion = radio.value;
      pintarCatalogo();
    });
  }

  // "usado" / "usados" según cuántos sean, para que el subtítulo concuerde
  // ("1 equipo usado" y no "1 equipo usados"). Cadena vacía con "todos".
  function adjCondicion(n) {
    if (condicion === 'todos') return '';
    var base = condicion === 'usados' ? 'usado' : 'nuevo';
    return n === 1 ? base : base + 's';
  }

  // ¿El producto pasa el filtro de condición?
  function pasaCondicion(p) {
    if (condicion === 'nuevos') return !esUsado(p);
    if (condicion === 'usados') return esUsado(p);
    return true;
  }

  function htmlOrden() {
    return '<label class="orden">' +
             '<span class="sr-only">Ordenar por</span>' +
             '<select class="orden__select" id="ordenPrecio">' +
               '<option value="defecto">Orden: por defecto</option>' +
               '<option value="asc">Menor precio</option>' +
               '<option value="desc">Mayor precio</option>' +
             '</select>' +
           '</label>';
  }

  function soloDigitos(v) { return String(v).replace(/\D+/g, ''); }

  // 3249000 -> "3.249.000" (mismo separador que los precios del sitio)
  function conMiles(digitos) {
    return digitos ? Number(digitos).toLocaleString('es-AR') : '';
  }

  function iniciarRangoPrecio() {
    var desde = $('#precioDesde');
    var hasta = $('#precioHasta');
    var limpiar = $('#limpiarRango');

    function alEscribir() {
      // se reescribe formateado; el caret queda al final, que es donde
      // está escribiendo el usuario
      this.value = conMiles(soloDigitos(this.value));
      leerRango();
      pintarCatalogo();
    }

    function leerRango() {
      var d = soloDigitos(desde.value);
      var h = soloDigitos(hasta.value);
      precioDesde = d ? Number(d) : null;
      precioHasta = h ? Number(h) : null;

      // "Desde" mayor que "Hasta" no filtra nada: se avisa en línea (no
      // con alert) y se ignora el rango para no vaciar la grilla sin
      // explicación.
      rangoInvalido = precioDesde !== null && precioHasta !== null && precioDesde > precioHasta;

      var err = $('#rangoError');
      err.hidden = !rangoInvalido;
      err.textContent = rangoInvalido
        ? 'El precio "Desde" no puede ser mayor que el "Hasta".'
        : '';
      desde.setAttribute('aria-invalid', rangoInvalido ? 'true' : 'false');
      hasta.setAttribute('aria-invalid', rangoInvalido ? 'true' : 'false');

      limpiar.hidden = !(desde.value || hasta.value);
    }

    desde.addEventListener('input', alEscribir);
    hasta.addEventListener('input', alEscribir);

    limpiar.addEventListener('click', function () {
      desde.value = '';
      hasta.value = '';
      leerRango();
      pintarCatalogo();
      desde.focus();
    });
  }

  function iniciarOrden() {
    $('#ordenPrecio').addEventListener('change', function () {
      orden = this.value;
      pintarCatalogo();
    });
  }

  // Reordena una lista por precio. 'defecto' devuelve el orden del JSON.
  function ordenarPorPrecio(lista) {
    if (orden === 'defecto') return lista;
    return lista.slice().sort(function (a, b) {
      return orden === 'asc' ? a.precio - b.precio : b.precio - a.precio;
    });
  }

  // [32] buscador que se abre desde la lupa. Acotado a la categoría de
  // la página: filtra sobre productosDeCategoria(), no sobre todo el JSON.
  function iniciarBuscador() {
    buscador = $('#buscador');
    campoBusqueda = $('#busqueda');
    lupa = $('#buscadorToggle');

    lupa.addEventListener('click', function () {
      if (buscador.dataset.abierto === 'true') cerrarBuscador(true);
      else abrirBuscador();
    });

    campoBusqueda.addEventListener('input', function () {
      busqueda = this.value.trim();
      pintarCatalogo();          // el filtrado de la grilla no cambia
      pintarSugerencias();       // las sugerencias son un atajo aparte
    });

    campoBusqueda.addEventListener('keydown', function (e) {
      if (manejarTeclaSugerencias(e)) return;   // flechas / Enter dentro de la lista
      if (e.key === 'Escape') {
        // Escape primero cierra las sugerencias; si no había, cierra el buscador
        if (!listaSugerencias.hidden) cerrarSugerencias();
        else cerrarBuscador(true);
      }
    });

    iniciarSugerencias();
  }

  /* --------------------- SUGERENCIAS DEL BUSCADOR --------------------
     Atajo para saltar directo al detalle de un producto. No reemplaza ni
     interfiere con el filtrado: la grilla se sigue filtrando igual en el
     mismo evento 'input'.
     Patrón combobox: el input tiene role=combobox y aria-activedescendant
     apuntando a la opción marcada; la lista es un role=listbox.
     ------------------------------------------------------------------ */
  var MIN_SUGERENCIAS = 2;   // caracteres mínimos
  var MAX_SUGERENCIAS = 5;
  var listaSugerencias, sugerenciasActuales = [], indiceSugerencia = -1;

  function iniciarSugerencias() {
    listaSugerencias = $('#sugerencias');

    // clic en una sugerencia -> abre el modal de ese producto
    listaSugerencias.addEventListener('click', function (e) {
      var opcion = e.target.closest('.sugerencia');
      if (opcion) elegirSugerencia(Number(opcion.dataset.indice));
    });

    // clic fuera del buscador -> cierra
    document.addEventListener('click', function (e) {
      if (!listaSugerencias || listaSugerencias.hidden) return;
      if (!e.target.closest('#buscador')) cerrarSugerencias();
    });
  }

  // Coincidencias sobre el mismo universo que la grilla: en una página de
  // categoría, sólo esa categoría; en productos.html, todo el catálogo.
  function buscarSugerencias(texto) {
    var q = normalizar(texto);
    return productos.filter(function (p) {
      if (categoriaPagina && p.categoria !== categoriaPagina) return false;
      return normalizar(p.nombre).indexOf(q) !== -1;
    }).slice(0, MAX_SUGERENCIAS);
  }

  function pintarSugerencias() {
    if (!listaSugerencias) return;

    if (busqueda.length < MIN_SUGERENCIAS) return cerrarSugerencias();

    sugerenciasActuales = buscarSugerencias(busqueda);
    if (!sugerenciasActuales.length) return cerrarSugerencias();

    indiceSugerencia = -1;
    listaSugerencias.innerHTML = sugerenciasActuales.map(function (p, i) {
      return '<li class="sugerencia" role="option" id="sug-' + i + '" ' +
                 'aria-selected="false" data-indice="' + i + '">' +
               '<img class="sugerencia__foto" src="' + esc(rutaImagen(p)) + '" ' +
                    'alt="" loading="lazy">' +
               '<span class="sugerencia__nombre">' + esc(p.nombre) + '</span>' +
               '<span class="sugerencia__precio">' + precio(p.precio) + '</span>' +
             '</li>';
    }).join('');

    listaSugerencias.hidden = false;
    campoBusqueda.setAttribute('aria-expanded', 'true');
    campoBusqueda.removeAttribute('aria-activedescendant');
  }

  function cerrarSugerencias() {
    if (!listaSugerencias) return;
    listaSugerencias.hidden = true;
    listaSugerencias.innerHTML = '';
    sugerenciasActuales = [];
    indiceSugerencia = -1;
    campoBusqueda.setAttribute('aria-expanded', 'false');
    campoBusqueda.removeAttribute('aria-activedescendant');
  }

  function marcarSugerencia(i) {
    var opciones = listaSugerencias.querySelectorAll('.sugerencia');
    indiceSugerencia = i;
    Array.prototype.forEach.call(opciones, function (op, j) {
      op.setAttribute('aria-selected', j === i ? 'true' : 'false');
      op.classList.toggle('is-activa', j === i);
    });
    if (i >= 0) {
      campoBusqueda.setAttribute('aria-activedescendant', 'sug-' + i);
      opciones[i].scrollIntoView({ block: 'nearest' });
    } else {
      campoBusqueda.removeAttribute('aria-activedescendant');
    }
  }

  function elegirSugerencia(i) {
    var p = sugerenciasActuales[i];
    if (!p) return;
    var disparador = campoBusqueda;
    cerrarSugerencias();
    abrirModal(p.id, disparador);
  }

  // Devuelve true si consumió la tecla (para que no siga el handler de al lado)
  function manejarTeclaSugerencias(e) {
    if (!listaSugerencias || listaSugerencias.hidden) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      marcarSugerencia((indiceSugerencia + 1) % sugerenciasActuales.length);
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      marcarSugerencia(indiceSugerencia <= 0 ? sugerenciasActuales.length - 1 : indiceSugerencia - 1);
      return true;
    }
    if (e.key === 'Enter' && indiceSugerencia >= 0) {
      e.preventDefault();
      elegirSugerencia(indiceSugerencia);
      return true;
    }
    return false;
  }

  function abrirBuscador() {
    buscador.dataset.abierto = 'true';
    lupa.setAttribute('aria-expanded', 'true');
    campoBusqueda.tabIndex = 0;
    campoBusqueda.focus();
  }

  function cerrarBuscador(devolverFoco) {
    buscador.dataset.abierto = 'false';
    lupa.setAttribute('aria-expanded', 'false');
    campoBusqueda.tabIndex = -1;   // cerrado no debe recibir foco por Tab
    cerrarSugerencias();
    if (campoBusqueda.value) {
      campoBusqueda.value = '';
      busqueda = '';
      pintarCatalogo();
    }
    if (devolverFoco) lupa.focus();
  }

  /* ---------------------------- CATÁLOGO ---------------------------- */

  // Tarjeta normal: imagen, nombre y precio. Sin specs y con el botón
  // de agregar compacto — la ficha completa está en el modal.
  function tarjeta(p) {
    // El nombre va envuelto en un <span> propio porque el recorte a dos
    // líneas necesita overflow:hidden, y eso no puede ir en .card__abrir
    // ni en ningún ancestro: recortaría también su ::after, que es lo que
    // hace clickeable toda la tarjeta. En el span, hermano del ::after,
    // el recorte alcanza sólo al texto.
    return '<article class="card' + (hayStock(p) ? '' : ' card--agotado') + '">' +
             media(p, '', marcasSobreFoto(p)) +
             '<div>' +
               '<p class="card__cat">' + esc(p.categoria) + '</p>' +
               '<h4 class="card__nombre">' +
                 '<button class="card__abrir" type="button" data-modal="' + esc(p.id) + '">' +
                   '<span class="card__nombre-txt">' + esc(p.nombre) + '</span>' +
                 '</button>' +
               '</h4>' +
               descripcionCorta(p) +
             '</div>' +
             bloquePrecios(p) +
             lineaAhorro(p) +
             htmlStock(p) +
             '<div class="card__acciones">' +
               botonAccion(p, 'btn--compacto', 'Agregar', 'Avisame') +
               // un combo no se puede comparar: el comparador trabaja
               // sobre productos sueltos del catálogo
               (p.esCombo ? '' : botonComparar(p)) +
             '</div>' +
           '</article>';
  }

  // Descripción corta de la tarjeta: las mismas specs del JSON unidas en
  // una línea. El CSS la recorta a dos líneas y le reserva esa altura
  // siempre, para que todas las tarjetas de la grilla sigan midiendo lo
  // mismo aunque un producto tenga menos specs que otro.
  //
  // En un usado esa misma línea lleva el resumen de estado (batería +
  // pantalla) en lugar de las specs de más atrás. Va ACÁ y no en una
  // línea nueva justamente por el alto reservado: una línea extra sólo en
  // las tarjetas de usado las haría más altas que las de al lado, que es
  // el desalineado que estas reglas vienen evitando.
  function descripcionCorta(p) {
    var partes = (p.specs || []).slice();
    if (esUsado(p)) {
      var resumen = resumenEstado(p);
      if (resumen.length) partes = partes.slice(0, 2).concat(resumen);
    }
    return '<p class="card__specs">' + esc(partes.join(' · ')) + '</p>';
  }

  // Bloque "Estado del equipo" del modal: todos los campos cargados, uno
  // por fila. Es lo primero que se lee después del precio porque en un
  // usado es lo que decide la compra, antes que la ficha técnica.
  function bloqueEstado(p) {
    if (!esUsado(p)) return '';
    var e = p.estado || {};
    var filas = clavesEstado(p).map(function (k) {
      var nombre = ESTADO_ETIQUETAS[k] || (k.charAt(0).toUpperCase() + k.slice(1));
      return '<div class="detalle__fila"><dt>' + esc(nombre) + '</dt>' +
             '<dd>' + esc(valorEstado(k, e[k])) + '</dd></div>';
    }).join('');
    var ahorro = bloqueAhorro(p);
    // Sin ningún campo de estado Y sin comparación de precio no hay nada
    // que contar; con cualquiera de las dos el bloque vale la pena.
    if (!filas && !ahorro) return '';

    return '<section class="estado-equipo">' +
             '<h3 class="estado-equipo__titulo">Estado del equipo</h3>' +
             '<p class="estado-equipo__nota">Equipo usado, revisado y probado. ' +
               'Esto es lo que encontramos:</p>' +
             ahorro +
             (filas ? '<dl class="detalle detalle--estado">' + filas + '</dl>' : '') +
           '</section>';
  }

  /* ------------------------- TARJETA DE COMBO ------------------------
     Ocupa la misma celda grande que la principal (por eso conserva la
     clase .card--principal) pero con su propio contenido: las dos fotos
     juntas, lo que incluye, el precio con descuento contra la suma
     tachada y cuánto se ahorra.
     ------------------------------------------------------------------ */
  // Banner horizontal de ancho completo, ya no la celda grande de la
  // grilla: las fotos van a un lado (tamaño contenido, sin estirar) y el
  // resto de la info al otro, en .combo__info. Ver seccionGrilla(), que
  // lo ubica FUERA de .grilla — así no participa del grid-row: span 2
  // ni de ninguna cuenta de columnas, y las tarjetas normales quedan
  // libres de su influencia.
  function tarjetaCombo(c) {
    var fotos = c.items.map(function (p) {
      return '<div class="combo__foto">' + media(p) + '</div>';
    }).join('<span class="combo__mas" aria-hidden="true">+</span>');

    var incluye = c.items.map(function (p) {
      return '<li>' + esc(p.nombre) + '</li>';
    }).join('');

    return '<article class="card card--combo">' +
             '<div class="combo__fotos">' +
               '<span class="etiqueta etiqueta--combo">Combo</span>' +
               fotos +
             '</div>' +

             '<div class="combo__info">' +
               '<p class="card__cat">' + esc(c.categoria) + '</p>' +
               '<h4 class="card__nombre">' +
                 '<button class="card__abrir" type="button" data-modal="' + esc(c.id) + '">' +
                   esc(c.nombre) +
                 '</button>' +
               '</h4>' +
               '<p class="combo__label">Incluye</p>' +
               '<ul class="combo__incluye">' + incluye + '</ul>' +
             '</div>' +

             // Tercera columna: precio y acciones. Separarla de .combo__info
             // es lo que mantiene el banner bajo: con precio+botones apilados
             // debajo del texto, la columna de la izquierda quedaba mucho más
             // alta que las fotos y sobraba un hueco blanco enorme al lado.
             '<div class="combo__compra">' +
               '<div class="card__precios">' +
                 '<span class="precio--anterior">' + precio(c.precioAnterior) + '</span>' +
                 '<span class="precio">' + precio(c.precio) + '</span>' +
                 '<p class="combo__ahorro">Ahorrás ' + precio(ahorroCombo(c)) +
                   ' (' + c.descuento + '%)</p>' +
               '</div>' +
               htmlStock(c) +

               '<div class="card__acciones">' +
                 '<button class="btn btn--compacto" type="button" data-agregar="' + esc(c.id) + '">' +
                   btnPartes('carrito', 'Agregar combo',
                             '<span class="sr-only"> — ' + esc(c.nombre) + '</span>') +
                 '</button>' +
                 '<button class="btn btn--sec btn--compacto" type="button" data-modal="' + esc(c.id) + '">' +
                   btnPartes('lista', 'Ver detalle') +
                 '</button>' +
               '</div>' +
             '</div>' +
           '</article>';
  }

  // Tarjeta principal: ocupa el doble de alto en la primera columna.
  // Mantiene las specs y el botón con el texto completo.
  function tarjetaPrincipal(p) {
    return '<article class="card card--principal' + (hayStock(p) ? '' : ' card--agotado') + '">' +
             media(p, 'media--principal', marcasSobreFoto(p)) +
             '<div>' +
               '<p class="card__cat">' + esc(p.categoria) + '</p>' +
               '<h4 class="card__nombre">' +
                 '<button class="card__abrir" type="button" data-modal="' + esc(p.id) + '">' +
                   esc(p.nombre) +
                 '</button>' +
               '</h4>' +
               descripcionCorta(p) +
             '</div>' +
             bloquePrecios(p) +
             lineaAhorro(p) +
             htmlStock(p) +
             '<div class="card__acciones">' +
               botonAccion(p, 'btn--compacto') +
               botonComparar(p) +
             '</div>' +
           '</article>';
  }

  // Elige el producto principal de una categoría: el primero marcado con
  // "principal": true en productos.json. Si no hay ninguno, el primero de
  // la lista. Si hay más de uno, usa el primero (y lo avisa por consola).
  function elegirPrincipal(lista, categoria) {
    var marcados = lista.filter(function (p) { return p.principal; });
    if (marcados.length > 1) {
      console.warn('[tienda] la categoría "' + categoria + '" tiene ' + marcados.length +
                   ' productos con "principal": true. Se usa el primero (' + marcados[0].id +
                   '). Dejá uno solo en productos.json.');
    }
    return marcados[0] || lista[0];
  }

  // Productos visibles en la página, aplicando la búsqueda. En una
  // página de categoría el filtro por categoría no es opcional; en
  // productos.html no hay filtro y el buscador busca en todo el catálogo.
  function productosVisibles() {
    return productos.filter(function (p) {
      if (categoriaPagina && p.categoria !== categoriaPagina) return false;

      if (!pasaCondicion(p)) return false;

      // el rango sólo se aplica si es coherente (ver leerRango)
      if (!rangoInvalido) {
        if (precioDesde !== null && p.precio < precioDesde) return false;
        if (precioHasta !== null && p.precio > precioHasta) return false;
      }

      if (!busqueda) return true;
      return normalizar(p.nombre).indexOf(normalizar(busqueda)) !== -1;
    });
  }

  // ¿Hay un rango de precio realmente aplicado?
  function rangoActivo() {
    return !rangoInvalido && (precioDesde !== null || precioHasta !== null);
  }

  // "de $ 1.000.000 a $ 2.000.000" / "desde $ 1.000.000" / "hasta $ 2.000.000"
  function textoRango() {
    if (precioDesde !== null && precioHasta !== null) {
      return 'de ' + precio(precioDesde) + ' a ' + precio(precioHasta);
    }
    if (precioDesde !== null) return 'desde ' + precio(precioDesde);
    return 'hasta ' + precio(precioHasta);
  }

  // Una sección con su grilla (principal + resto). El encabezado se
  // omite sólo cuando la página tiene una sección única (iPhone, Mac,
  // iPad): ahí repetiría el título de la página.
  function encabezadoSeccion(titulo, idAncla, conEncabezado, categoria, lista) {
    if (!conEncabezado) return '';
    return '<header class="cat__head">' +
             '<h2 class="cat__titulo" id="tit-' + esc(idAncla) + '">' + esc(titulo) + '</h2>' +
             '<p class="cat__conteo">' + conteo(categoria, lista.length) + '</p>' +
           '</header>';
  }

  // opts.combo    — el combo a mostrar, o null. Si no se pasa, lo busca.
  //                 La sección de usados pasa null a propósito.
  // opts.uniforme — grilla pareja sin tarjeta principal. La usan los
  //                 usados: ahí la jerarquía la da el año, no una celda
  //                 grande, y así todas las tarjetas miden igual.
  function seccionGrilla(titulo, lista, idAncla, conEncabezado, categoria, opts) {
    opts = opts || {};
    var combo = ('combo' in opts) ? opts.combo : comboDeSeccion(categoria, titulo);
    var porPrecio = orden !== 'defecto';

    // Ordenado por precio: la grilla se vuelve UNIFORME. No hay celda
    // grande ni combo destacado, porque una tarjeta fija arriba que no es
    // la más barata se lee como un error. El combo no se pierde: entra
    // como una tarjeta normal más, con su precio de combo, en el lugar
    // que le toca por precio.
    // La sección de usados entra por acá siempre (opts.uniforme), pero
    // sin reordenar cuando el orden es el de defecto: ahí ya viene
    // ordenada del modelo más nuevo al más viejo.
    if (porPrecio || opts.uniforme) {
      var todo = combo ? lista.concat([combo]) : lista;
      if (porPrecio) todo = ordenarPorPrecio(todo);
      return '<section class="cat" id="' + esc(idAncla) + '"' +
               (conEncabezado ? ' aria-labelledby="tit-' + esc(idAncla) + '"' : '') + '>' +
               encabezadoSeccion(titulo, idAncla, conEncabezado, categoria, lista) +
               '<div class="grilla grilla--uniforme">' + todo.map(tarjeta).join('') + '</div>' +
             '</section>';
    }

    // Orden por defecto: si la categoría tiene combo, va como un banner
    // horizontal ARRIBA de la grilla (fuera de ella, no como celda
    // grande): así no participa de ningún cálculo de columnas y las
    // tarjetas normales quedan en su grilla de siempre, todas iguales.
    // Sin combo, la principal ocupa la celda grande como antes.
    var principal = combo ? null : elegirPrincipal(lista, titulo);
    var resto = lista.filter(function (p) { return p !== principal; });

    var encabezado = encabezadoSeccion(titulo, idAncla, conEncabezado, categoria, lista);
    var bannerCombo = combo ? '<div class="combo-destacado">' + tarjetaCombo(combo) + '</div>' : '';

    return '<section class="cat" id="' + esc(idAncla) + '"' +
             (conEncabezado ? ' aria-labelledby="tit-' + esc(idAncla) + '"' : '') + '>' +
             encabezado +
             bannerCombo +
             '<div class="grilla">' +
               (combo ? '' : tarjetaPrincipal(principal)) +
               resto.map(tarjeta).join('') +
             '</div>' +
           '</section>';
  }

  /* --------------- NUEVOS ARRIBA, USADOS ABAJO -----------------------
     Cada sección del catálogo se parte en dos. Si la categoría no tiene
     ningún usado no se pinta ningún título de más: queda exactamente la
     sección de siempre, con su combo y su tarjeta principal.
     ------------------------------------------------------------------ */
  function seccionesNuevosYUsados(titulo, lista, idAncla, conEncabezado, categoria) {
    var nuevos = lista.filter(function (p) { return !esUsado(p); });
    var usados = lista.filter(esUsado);

    if (!usados.length) {
      return seccionGrilla(titulo, nuevos, idAncla, conEncabezado, categoria);
    }

    var html = '';

    // Con dos secciones la de arriba necesita título sí o sí: en una
    // página de una sola categoría el <h1> dejó de alcanzar, porque
    // ahora estaría encabezando a las dos por igual.
    if (nuevos.length) {
      html += seccionGrilla(conEncabezado ? titulo : 'Nuevos', nuevos, idAncla, true, categoria,
                            { combo: comboDeSeccion(categoria, titulo) });
    }

    html += seccionGrilla(conEncabezado ? titulo + ' usados' : 'Usados',
                          ordenarPorAnio(usados), idAncla + '-usados', true, categoria,
                          { combo: null, uniforme: true });
    return html;
  }

  // Cuenta para el subtítulo de la página. En productos.html se mezclan
  // equipos y accesorios, así que ahí la palabra tiene que ser neutra.
  function conteoPagina(n) {
    if (catalogoCompleto) return n + ' producto' + (n === 1 ? '' : 's');
    return conteo(categoriaPagina, n);
  }

  // Una sección por categoría; las que tienen subcategorías (accesorios)
  // se parten en una sección por subcategoría, cada una con su ancla
  // (accesorios.html#auriculares). Una subcategoría sin productos —o sin
  // resultados de búsqueda— no se muestra. En una página de categoría
  // esto rinde una sola categoría; en productos.html, las cuatro.
  function pintarCatalogo() {
    var lista = productosVisibles();
    var cats = catalogoCompleto ? categoriasConProductos() : [categoriaPagina];

    // Con varias categorías en pantalla cada una necesita su encabezado
    // para saber dónde empieza; con una sola lo pone el <h1> de arriba.
    var conEncabezado = catalogoCompleto;
    var html = '';

    cats.forEach(function (c) {
      var deLaCat = lista.filter(function (p) { return p.categoria === c; });
      if (!deLaCat.length) return;

      var subs = subcategoriasDe(c);
      if (!subs.length) {
        html += seccionesNuevosYUsados(c, deLaCat, slug(c), conEncabezado, c);
        return;
      }

      // Las subcategorías siempre llevan encabezado: son varias secciones
      // dentro de la misma categoría.
      subs.forEach(function (sub) {
        var deLaSub = deLaCat.filter(function (p) { return p.subcategoria === sub; });
        if (deLaSub.length) html += seccionesNuevosYUsados(sub, deLaSub, slug(sub), true, c);
      });

      // Un accesorio sin subcategoría quedaría fuera de todas las
      // secciones: va al final, agrupado, en vez de desaparecer.
      var sueltos = deLaCat.filter(function (p) { return !p.subcategoria; });
      if (sueltos.length) html += seccionesNuevosYUsados('Otros', sueltos, slug(c) + '-otros', true, c);
    });

    $('#catalogoSecciones').innerHTML = html;
    // El subtítulo dice qué filtros están puestos: con búsqueda y/o rango
    // el número de productos por sí solo no explica por qué hay menos.
    var detalles = [];
    if (adjCondicion(lista.length)) detalles.push(adjCondicion(lista.length));
    if (busqueda) detalles.push('que coinciden con la búsqueda');
    if (rangoActivo()) detalles.push(textoRango());

    $('#conteoCategoria').textContent = conteoPagina(lista.length) +
      (detalles.length ? ' ' + detalles.join(' · ') : ' · precios finales en pesos');

    pintarVacio(html === '');
    revelarTarjetas();
    irAlAncla();
  }

  // El ancla de una subcategoría no puede resolverla el navegador solo:
  // cuando llega el hash, la sección todavía no existe (la pinta este
  // archivo después del fetch). Por eso el salto se hace a mano acá.
  //
  // El salto va en 'instant' a propósito, aunque el resto del sitio use
  // scroll suave: con 'smooth' la animación dura mientras las fotos de
  // arriba todavía se están cargando, cada una empuja el contenido hacia
  // abajo y el scroll termina lejos del destino. Un salto de ancla al
  // entrar tampoco es animado en el navegador.
  function irAlAncla() {
    if (!location.hash) return;
    var destino = document.getElementById(location.hash.slice(1));
    if (destino) destino.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  // Elegir otra subcategoría del menú estando ya en accesorios.html sólo
  // cambia el hash: no hay recarga, así que hay que mover el scroll.
  window.addEventListener('hashchange', irAlAncla);

  // [13] sin resultados. En una página de categoría el caso habitual ya
  // no es "categoría vacía" sino "la búsqueda no encontró nada": el texto
  // cambia para que la salida sugerida tenga sentido en cada caso.
  function pintarVacio(vacio) {
    var cont = $('#catalogoVacio');
    cont.hidden = !vacio;

    if (!vacio) { cont.innerHTML = ''; return; }

    // El título nombra lo que efectivamente se filtró, para que no parezca
    // que la categoría está vacía cuando en realidad es el rango o la
    // búsqueda lo que no da resultados.
    var titulo, salida;
    // Si lo que vació la vista fue el filtro de condición, el cartel tiene
    // que nombrarlo: si no, parece que la categoría entera está vacía.
    // "en usados" / "en nuevos" se intercala como complemento para que la
    // frase cierre igual con y sin filtro.
    var enCond = condicion === 'todos' ? '' : ' en ' + condicion;
    var unProducto = condicion === 'todos' ? 'producto' : 'producto ' + adjCondicion(1);
    var volverATodos = condicion === 'todos' ? '' : 'Probá con “Todos”, ';

    if (busqueda && rangoActivo()) {
      titulo = 'Ningún resultado' + enCond + ' para “' + esc(busqueda) + '” ' + esc(textoRango());
      salida = volverATodos + 'buscá otro nombre, ampliá el rango de precio o ';
    } else if (rangoActivo()) {
      titulo = 'Ningún ' + unProducto + ' ' + esc(textoRango());
      salida = volverATodos + 'ampliá el rango de precio o ';
    } else if (busqueda) {
      titulo = 'Ningún resultado' + enCond + ' para “' + esc(busqueda) + '”';
      salida = volverATodos + 'buscá otro nombre o ';
    } else if (enCond) {
      titulo = 'No hay ' + adjCondicion(0) + ' en esta sección';
      salida = 'Probá con “Todos”, mirá otra categoría en el menú o ';
    } else {
      titulo = 'Todavía no hay productos en esta sección';
      salida = 'Mirá otra categoría en el menú o ';
    }
    // la frase arranca la oración cuando no la abre "Probá con “Todos”"
    if (!volverATodos) salida = salida.charAt(0).toUpperCase() + salida.slice(1);

    cont.innerHTML =
      '<div class="estado-vacio">' +
        icono('sinResultados', 'ico--grande') +
        '<p class="estado-vacio__titulo">' + titulo + '</p>' +
        '<p class="estado-vacio__texto">' + salida +
          '<a class="enlace link-sub" href="' + urlWhatsapp(MENSAJE_CONSULTA) + '" ' +
          'target="_blank" rel="noopener">escribinos</a>' +
        '</p>' +
      '</div>';
  }

  /* ------------------ [10] ENTRADA ESCALONADA (IO) ------------------ */

  var observador = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-visible');
          observador.unobserve(e.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
    : null;

  /* ---------------- APARICIÓN DE SECCIONES AL SCROLLEAR --------------
     Mismo criterio que las tarjetas: aparecen una sola vez y con un
     recorrido corto. Al terminar la transición se sacan las dos clases,
     de modo que el elemento vuelve a su estado natural — sin transform y
     sin will-change encima. Eso importa: un transform o una capa de
     composición que quede colgada sobre un ancestro de .media es
     exactamente lo que reabría el bug del scroll sobre las imágenes.
     ------------------------------------------------------------------ */
  /* --------------- APARICIÓN DE SECCIONES AL SCROLLEAR ---------------
     Las secciones arrancan en opacity 0 (lo pone el CSS con la clase
     .con-animacion del <head>, así no hay parpadeo) y se revelan al
     entrar en pantalla.

     REGLA DE ORO: el IntersectionObserver es una MEJORA, nunca la única
     vía. Se comprobó que puede no disparar nunca para un elemento
     perfectamente visible (pasaba con la franja de promo: quedaba en
     opacity 0 estando en pantalla, y sólo aparecía cuando alguna
     interacción disparaba un evento de scroll). Por eso el estado
     visible se recalcula además en varios momentos —al cargar, cuando
     terminan las imágenes y las fuentes, y en cada cuadro de scroll— y
     hay un rescate final si el observer resultó no servir.
     ------------------------------------------------------------------ */

  var observadorSecciones = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) revelarSeccion(e.target, true);
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -60px 0px' })
    : null;

  /* ¿Sirve el IntersectionObserver en este navegador?
     No alcanza con preguntar si existe: se comprobó un caso donde existe,
     acepta observe() y NUNCA llama al callback, ni para un elemento
     perfectamente visible. Con eso, todo lo que dependa de él queda
     invisible para siempre.
     Tampoco sirve preguntar "¿ya disparó alguna vez?": al cargar, un
     observer sano tampoco disparó todavía para lo que está abajo del
     pliegue, así que no se puede distinguir "roto" de "el visitante no
     scrolleó". Por eso se lo prueba de verdad: se observa una sonda de
     1px puesta en pantalla y se espera su callback. */
  function probarObserver(listo) {
    if (!observadorSecciones) return listo(false);

    var sonda = document.createElement('div');
    sonda.setAttribute('aria-hidden', 'true');
    sonda.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;' +
                          'pointer-events:none;opacity:0';
    document.body.appendChild(sonda);

    var respondio = false;
    var io = new IntersectionObserver(function (entradas) {
      if (entradas.some(function (e) { return e.isIntersecting; })) respondio = true;
    });
    io.observe(sonda);

    window.setTimeout(function () {
      io.disconnect();
      if (sonda.parentNode) sonda.parentNode.removeChild(sonda);
      listo(respondio);
    }, 400);
  }

  // Revela una sección. `conAnimacion` decide si entra con transición
  // (viene de abajo mientras se scrollea) o de una (ya estaba en pantalla).
  function revelarSeccion(el, conAnimacion) {
    if (el.dataset.revelado) return;
    if (observadorSecciones) observadorSecciones.unobserve(el);

    if (!conAnimacion) {
      el.dataset.revelado = 'listo';
      return;
    }

    el.dataset.revelado = 'animando';
    var hecho = false;
    var fin = function () {
      if (hecho) return;
      hecho = true;
      el.removeEventListener('transitionend', fin);
      el.dataset.revelado = 'listo';    // saca transform y will-change
    };
    el.addEventListener('transitionend', fin);
    window.setTimeout(fin, 700);
  }

  function seccionesOcultas() {
    return document.querySelectorAll('main > .seccion:not([data-revelado])');
  }

  // Revela TODO lo que ya esté dentro de la pantalla (o más arriba, si el
  // scroll pasó de largo). No depende del observer: es lo que garantiza
  // que nada visible quede invisible, ni al cargar ni después.
  function revelarVisibles() {
    Array.prototype.forEach.call(seccionesOcultas(), function (sec) {
      if (sec.getBoundingClientRect().top < window.innerHeight) {
        revelarSeccion(sec, false);
      }
    });
  }

  // Revela TODO lo que quede oculto, incluso abajo del pliegue. Se usa
  // cuando la sonda dice que el observer no responde: es preferible
  // perder la animación que dejar contenido invisible esperando un
  // callback que no va a llegar nunca.
  function revelarTodo() {
    Array.prototype.forEach.call(seccionesOcultas(), function (sec) {
      revelarSeccion(sec, false);
    });
  }

  function revelarSecciones() {
    // La clase del <head> es la que las dejó ocultas; sin ella no hay nada
    // que revelar. El hero queda afuera a propósito: es lo primero que se
    // ve y aparecer sobre el pliegue se siente como un error de carga.
    if (!document.documentElement.classList.contains('con-animacion')) return;

    // Le avisa al timeout de seguridad del <head> que desde acá se maneja
    // el revelado, así no desarma la animación a los 2,5 s.
    document.documentElement.dataset.anim = 'ok';

    var objetivos = document.querySelectorAll('main > .seccion');

    if (!observadorSecciones || sinMovimiento()) {
      Array.prototype.forEach.call(objetivos, function (sec) {
        revelarSeccion(sec, false);
      });
      return;
    }

    // Lo de más abajo queda a cargo del observer...
    Array.prototype.forEach.call(objetivos, function (sec) {
      observadorSecciones.observe(sec);
    });
    // ...y lo que ya se ve se muestra ahora mismo, sin esperarlo.
    revelarVisibles();

    // El layout sigue moviéndose un rato: fotos que cargan, fuentes que
    // reemplazan la de sistema. Cada uno de esos momentos puede meter una
    // sección dentro de la pantalla sin que haya scroll de por medio, así
    // que se vuelve a mirar en todos ellos.
    window.addEventListener('load', revelarVisibles);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(revelarVisibles).catch(function () {});
    }
    [100, 400, 1000, 2000].forEach(function (ms) {
      window.setTimeout(revelarVisibles, ms);
    });

    // Y si el observer no responde, se muestra todo y listo.
    probarObserver(function (sirve) {
      if (!sirve) revelarTodo();
    });
  }

  function tarjetasDelCatalogo() {
    // TODAS las tarjetas de la sección, no sólo las de .grilla: el banner
    // de combo vive FUERA de la grilla (en .combo-destacado) y si se lo
    // deja afuera de esta consulta nunca recibe .is-visible y queda en
    // opacity 0 — visible como un hueco blanco con su altura reservada.
    return $('#catalogoSecciones').querySelectorAll('.card');
  }

  function mostrarTodasLasTarjetas() {
    Array.prototype.forEach.call(tarjetasDelCatalogo(), function (c) {
      c.classList.add('is-visible');
    });
  }

  // Muestra las tarjetas que ya están dentro de la pantalla. Igual que con
  // las secciones: no puede depender de que el observer dispare.
  function mostrarTarjetasVisibles() {
    Array.prototype.forEach.call(tarjetasDelCatalogo(), function (c) {
      if (c.classList.contains('is-visible')) return;
      if (c.getBoundingClientRect().top < window.innerHeight) {
        if (observador) observador.unobserve(c);
        c.classList.add('is-visible');
      }
    });
  }

  function revelarTarjetas() {
    // Sin observer, sin movimiento, o ya re-pintando (filtro/búsqueda):
    // el usuario ya está mirando el catálogo, no corresponde escalonar.
    if (!observador || sinMovimiento() || !primeraPintada) {
      mostrarTodasLasTarjetas();
      primeraPintada = false;
      return;
    }

    var tarjetas = tarjetasDelCatalogo();
    Array.prototype.forEach.call(tarjetas, function (card, i) {
      // el escalonado se corta a 500ms para que una fila entera no tarde más
      card.style.setProperty('--delay', Math.min(i * 60, 500) + 'ms');
      observador.observe(card);
    });

    // Lo que ya se ve, se ve ahora: no espera al observer.
    mostrarTarjetasVisibles();

    // Mismos momentos de asentamiento que las secciones (fotos, fuentes).
    window.addEventListener('load', mostrarTarjetasVisibles);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(mostrarTarjetasVisibles).catch(function () {});
    }
    [100, 400, 1000, 2000].forEach(function (ms) {
      window.setTimeout(mostrarTarjetasVisibles, ms);
    });

    // Y si el observer no responde, se muestran todas: el catálogo es el
    // contenido principal de la página, no puede quedar en blanco.
    // Además se apaga la animación de entrada: en un navegador que no
    // avanza las animaciones (misma causa por la que el observer no
    // dispara), el keyframe se queda clavado en su estado inicial
    // —opacity 0— y la tarjeta nunca se ve, aunque tenga .is-visible.
    probarObserver(function (sirve) {
      if (sirve) return;
      document.documentElement.dataset.animEntrada = 'no';
      mostrarTodasLasTarjetas();
    });

    primeraPintada = false;
  }

  /* ----------------------------- COMPARADOR --------------------------
     Reutiliza el campo "detalle" de productos.json: cada fila de la
     tabla es una clave, cada columna un producto.
     ------------------------------------------------------------------ */

  var selectA, selectB;

  // El comparador vive sólo en index.html. Desde una página de categoría
  // el botón "Comparar" es un enlace a index.html?comparar=<id>, que se
  // resuelve acá al terminar de montar la tabla.
  /* ==================== SELECTOR PERSONALIZADO =======================
     Reemplaza a un <select> nativo, que en celular abre la rueda del
     sistema y no se puede estilar. Sigue el patrón combobox + listbox de
     ARIA, con el foco SIEMPRE en el botón: mientras el panel está
     abierto, la opción resaltada se comunica con aria-activedescendant en
     vez de moviendo el foco. Eso es lo que hace que un selector propio
     sea usable con lector de pantalla y con teclado solo.

     Devuelve una API chica para que el comparador lo maneje igual que
     manejaba al <select>: setOpciones / setValor / deshabilitar / valor.
     ------------------------------------------------------------------ */
  function crearSelector(cfg) {
    // cfg: { id, idLabel, placeholder, alElegir(valor) }
    var raiz = $('#' + cfg.id);
    if (!raiz) return null;

    var idBtn = cfg.id + '-btn';
    var idPanel = cfg.id + '-panel';

    raiz.innerHTML =
      '<button class="csel__btn" type="button" id="' + idBtn + '" ' +
              'role="combobox" aria-expanded="false" aria-haspopup="listbox" ' +
              'aria-controls="' + idPanel + '" ' +
              'aria-labelledby="' + cfg.idLabel + ' ' + idBtn + '">' +
        '<span class="csel__valor"></span>' +
        icono('chevron', 'csel__chevron') +
      '</button>' +
      '<div class="csel__panel" id="' + idPanel + '" role="listbox" ' +
           'aria-labelledby="' + cfg.idLabel + '" hidden></div>';

    var btn = $('#' + idBtn);
    var panel = $('#' + idPanel);
    var etiquetaEl = raiz.querySelector('.csel__valor');

    var grupos = [];      // [{ titulo, items: [{ valor, etiqueta }] }]
    var planas = [];      // todas las opciones en orden, para las flechas
    var valorActual = '';
    var idDeshabilitado = null;
    var abierto = false;
    var resaltado = -1;

    function esElegible(op) {
      return !!op && !(op.valor !== '' && op.valor === idDeshabilitado);
    }

    function opcionHTML(op, i) {
      var inhabilitada = op.valor !== '' && op.valor === idDeshabilitado;
      return '<div class="csel__op" role="option" id="' + cfg.id + '-op-' + i + '" ' +
                  'data-valor="' + esc(op.valor) + '" data-i="' + i + '" ' +
                  'aria-selected="' + (op.valor === valorActual ? 'true' : 'false') + '"' +
                  (inhabilitada ? ' aria-disabled="true"' : '') + '>' +
               esc(op.etiqueta) +
             '</div>';
    }

    function pintarPanel() {
      var html = '';
      planas = [];

      // La opción vacía va primera y nunca se deshabilita: es la forma de
      // vaciar la columna.
      var vacia = { valor: '', etiqueta: cfg.placeholder };
      planas.push(vacia);
      html += opcionHTML(vacia, 0);

      grupos.forEach(function (g) {
        html += '<div role="group" aria-label="' + esc(g.titulo) + '">' +
                  '<div class="csel__grupo" aria-hidden="true">' + esc(g.titulo) + '</div>';
        g.items.forEach(function (it) {
          var i = planas.length;
          planas.push(it);
          html += opcionHTML(it, i);
        });
        html += '</div>';
      });

      panel.innerHTML = html;
    }

    function refrescarEstados() {
      Array.prototype.forEach.call(panel.querySelectorAll('.csel__op'), function (el) {
        var v = el.dataset.valor;
        el.setAttribute('aria-selected', v === valorActual ? 'true' : 'false');
        if (v !== '' && v === idDeshabilitado) el.setAttribute('aria-disabled', 'true');
        else el.removeAttribute('aria-disabled');
      });

      var elegida = null;
      planas.forEach(function (o) { if (o.valor === valorActual) elegida = o; });
      etiquetaEl.textContent = elegida ? elegida.etiqueta : cfg.placeholder;
      raiz.dataset.vacio = valorActual ? 'false' : 'true';
    }

    function marcar(i) {
      resaltado = i;
      Array.prototype.forEach.call(panel.querySelectorAll('.csel__op'), function (el) {
        var esta = Number(el.dataset.i) === i;
        el.classList.toggle('is-resaltada', esta);
        if (esta) {
          btn.setAttribute('aria-activedescendant', el.id);
          el.scrollIntoView({ block: 'nearest' });
        }
      });
      if (i < 0) btn.removeAttribute('aria-activedescendant');
    }

    // Salta las deshabilitadas: no se alcanzan ni con las flechas.
    function siguienteElegible(desde, paso) {
      var i = desde;
      for (var n = 0; n < planas.length; n++) {
        i += paso;
        if (i < 0) i = planas.length - 1;
        if (i >= planas.length) i = 0;
        if (esElegible(planas[i])) return i;
      }
      return desde;
    }

    function indiceDelValor() {
      var idx = -1;
      planas.forEach(function (o, k) { if (o.valor === valorActual) idx = k; });
      return idx;
    }

    function abrir() {
      if (abierto) return;
      abierto = true;
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      var i = indiceDelValor();
      if (i < 0 || !esElegible(planas[i])) i = siguienteElegible(-1, 1);
      marcar(i);
    }

    function cerrar(devolverFoco) {
      if (!abierto) return;
      abierto = false;
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      btn.removeAttribute('aria-activedescendant');
      marcar(-1);
      if (devolverFoco) btn.focus();
    }

    function elegir(i) {
      var op = planas[i];
      if (!esElegible(op)) return;      // una deshabilitada no se elige
      valorActual = op.valor;
      refrescarEstados();
      cerrar(true);
      if (cfg.alElegir) cfg.alElegir(valorActual);
    }

    btn.addEventListener('click', function () {
      if (abierto) cerrar(false);
      else abrir();
    });

    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!abierto) { abrir(); return; }
        marcar(siguienteElegible(resaltado, e.key === 'ArrowDown' ? 1 : -1));
        return;
      }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (!abierto) abrir();
        else elegir(resaltado);
        return;
      }
      if (e.key === 'Escape') {
        if (abierto) { e.preventDefault(); cerrar(true); }
        return;
      }
      if (e.key === 'Tab') { cerrar(false); return; }
      if (e.key === 'Home' && abierto) { e.preventDefault(); marcar(siguienteElegible(-1, 1)); }
      if (e.key === 'End' && abierto) { e.preventDefault(); marcar(siguienteElegible(planas.length, -1)); }
    });

    // mousedown y no click: así el botón no recibe el foco de vuelta y
    // vuelve a abrir el panel en el mismo gesto.
    panel.addEventListener('mousedown', function (e) {
      var op = e.target.closest('.csel__op');
      if (!op) return;
      e.preventDefault();
      elegir(Number(op.dataset.i));
    });

    panel.addEventListener('mousemove', function (e) {
      var op = e.target.closest('.csel__op');
      if (!op) return;
      var i = Number(op.dataset.i);
      if (esElegible(planas[i])) marcar(i);
    });

    document.addEventListener('click', function (e) {
      if (abierto && !raiz.contains(e.target)) cerrar(false);
    });

    return {
      setOpciones: function (nuevos) { grupos = nuevos || []; pintarPanel(); refrescarEstados(); },
      setValor: function (v) { valorActual = v || ''; pintarPanel(); refrescarEstados(); },
      deshabilitar: function (id) { idDeshabilitado = id || null; refrescarEstados(); },
      valor: function () { return valorActual; }
    };
  }

  function iniciarComparador() {
    if (!$('#compararA')) return;

    selectA = crearSelector({
      id: 'compararA',
      idLabel: 'compararALabel',
      placeholder: 'Elegir producto\u2026',
      alElegir: function (valor) {
        comparadorA = valor || null;
        actualizarDisponibilidadComparador();
        pintarComparador();
      }
    });

    selectB = crearSelector({
      id: 'compararB',
      idLabel: 'compararBLabel',
      placeholder: 'Elegir producto\u2026',
      alElegir: function (valor) {
        comparadorB = valor || null;
        actualizarDisponibilidadComparador();
        pintarComparador();
      }
    });

    $('#compararLimpiar').addEventListener('click', function () {
      comparadorA = null;
      comparadorB = null;
      selectA.setValor('');
      selectB.setValor('');
      actualizarDisponibilidadComparador(); // rehabilita las dos opciones
      pintarComparador();
    });

    pintarSelectsComparador();
    pintarComparador();
    aplicarCompararDeLaUrl();
  }

  // ?comparar=<id> — lo pone el botón "Comparar" de las tarjetas, que
  // desde una categoría tiene que cruzar de página para llegar acá.
  function aplicarCompararDeLaUrl() {
    var id = new URLSearchParams(location.search).get('comparar');
    if (!id || !buscarProducto(id)) return;
    cargarEnComparador(id);
  }

  function pintarSelectsComparador() {
    // Mismos grupos por categoría que tenían los <optgroup>.
    var grupos = categoriasConProductos().map(function (c) {
      var lista = productos.filter(function (p) { return p.categoria === c; });
      if (!lista.length) return null;
      return {
        titulo: c,
        items: lista.map(function (p) { return { valor: p.id, etiqueta: p.nombre }; })
      };
    }).filter(Boolean);

    selectA.setOpciones(grupos);
    selectB.setOpciones(grupos);
    selectA.setValor(comparadorA || '');
    selectB.setValor(comparadorB || '');
    actualizarDisponibilidadComparador();
  }

  // No tiene sentido comparar un producto consigo mismo: la opción ya
  // elegida en una columna se deshabilita en la otra (la opción vacía
  // nunca se toca). Se llama después de cualquier cambio de estado.
  function actualizarDisponibilidadComparador() {
    selectA.deshabilitar(comparadorB);
    selectB.deshabilitar(comparadorA);
  }

  /* ------------------- GANADOR POR FILA (comparador) -----------------
     Sólo se marca ganador donde la comparación es objetiva y sale de un
     número. Las filas que no estén en este mapa se muestran normales en
     las dos columnas: nada de inventar que un color o un conector "gana".

     Para agregar un campo: poné la clave EXACTA como aparece en el
     objeto "detalle" de productos.json y elegí 'mayor' o 'menor'.
     Ej: "Memoria": "mayor" haría ganar al que tenga más GB de RAM.

     Se compara el PRIMER número que aparezca en el texto:
       "6.9\" Super Retina XDR"        -> 6.9
       "256 GB"                        -> 256
       "Hasta 33 h de video · salud 100%" -> 33
     Si de alguno de los dos valores no sale un número, la fila no se
     marca. Si los dos números son iguales, tampoco.
     ------------------------------------------------------------------ */
  var CRITERIO_COMPARACION = {
    'Pantalla': 'mayor',        // pulgadas
    'Batería': 'mayor',         // horas de uso
    'Almacenamiento': 'mayor',  // GB
    'Precio': 'menor'
  };

  function primerNumero(valor) {
    if (typeof valor === 'number') return valor;
    if (valor === undefined || valor === null) return null;
    var m = String(valor).match(/-?\d+(?:[.,]\d+)?/);
    return m ? parseFloat(m[0].replace(',', '.')) : null;
  }

  // Devuelve 'a', 'b' o null (sin ganador / no comparable).
  function ganadorDeFila(clave, va, vb) {
    var criterio = CRITERIO_COMPARACION[clave];
    if (!criterio) return null;

    var na = primerNumero(va);
    var nb = primerNumero(vb);
    if (na === null || nb === null || isNaN(na) || isNaN(nb)) return null;
    if (na === nb) return null;

    var ganaA = criterio === 'menor' ? na < nb : na > nb;
    return ganaA ? 'a' : 'b';
  }

  // Une las claves de "detalle" de los dos productos preservando el orden
  // de aparición: primero las de A, después las de B que A no tenía.
  function comparadorUnionClaves(a, b) {
    var claves = [];
    Object.keys(a.detalle || {}).forEach(function (k) {
      if (claves.indexOf(k) === -1) claves.push(k);
    });
    Object.keys(b.detalle || {}).forEach(function (k) {
      if (claves.indexOf(k) === -1) claves.push(k);
    });
    return claves;
  }

  function comparadorCeldaProducto(p) {
    return '<div class="comparador__prod">' +
             media(p, 'media--comparador') +
             '<p class="comparador__nombre">' + esc(p.nombre) + '</p>' +
             bloquePrecios(p) +
           '</div>';
  }

  function comparadorCeldaValor(valor, nombreProducto, gana) {
    var contenido = (valor === undefined || valor === null)
      ? '<span aria-hidden="true">—</span><span class="sr-only">Sin dato</span>'
      : esc(valor);
    // el "gana" se anuncia también en texto: el color solo no alcanza
    if (gana) contenido += '<span class="sr-only"> (mejor valor)</span>';
    return '<td class="' + (gana ? 'comparador__gana' : '') + '" ' +
           'data-label="' + esc(nombreProducto) + '">' + contenido + '</td>';
  }

  function pintarComparador() {
    var cont = $('#comparadorTabla');
    var a = comparadorA ? buscarProducto(comparadorA) : null;
    var b = comparadorB ? buscarProducto(comparadorB) : null;

    if (!a || !b) {
      cont.innerHTML = '<p class="comparador__vacio">' +
        (a || b ? 'Elegí el segundo producto para comparar.' : 'Elegí dos productos para ver la comparación.') +
        '</p>';
      return;
    }

    // El precio va como primera fila comparable: es el campo donde el
    // criterio "menor gana" tiene más sentido y no vive en "detalle".
    var filasDatos = [{ clave: 'Precio', va: precio(a.precio), vb: precio(b.precio),
                        numA: a.precio, numB: b.precio }];

    comparadorUnionClaves(a, b).forEach(function (k) {
      var va = a.detalle ? a.detalle[k] : undefined;
      var vb = b.detalle ? b.detalle[k] : undefined;
      filasDatos.push({ clave: k, va: va, vb: vb, numA: va, numB: vb });
    });

    var filas = filasDatos.map(function (f) {
      // difieren también cuenta cuando la clave falta en uno de los dos:
      // esa diferencia es justamente lo que hay que resaltar de un vistazo.
      var difiere = f.va !== f.vb;
      var gana = ganadorDeFila(f.clave, f.numA, f.numB);

      return '<tr class="' + (difiere ? 'comparador__fila--difiere' : '') + '">' +
               '<th scope="row">' + esc(f.clave) + '</th>' +
               comparadorCeldaValor(f.va, a.nombre, gana === 'a') +
               comparadorCeldaValor(f.vb, b.nombre, gana === 'b') +
             '</tr>';
    }).join('');

    cont.innerHTML =
      '<div class="comparador__scroll">' +
        '<table class="comparador__tabla">' +
          '<caption class="sr-only">Comparación entre ' + esc(a.nombre) + ' y ' + esc(b.nombre) + '</caption>' +
          '<thead><tr>' +
            '<th scope="col"><span class="sr-only">Especificación</span></th>' +
            '<th scope="col">' + comparadorCeldaProducto(a) + '</th>' +
            '<th scope="col">' + comparadorCeldaProducto(b) + '</th>' +
          '</tr></thead>' +
          '<tbody>' + filas + '</tbody>' +
          '<tfoot><tr>' +
            '<td></td>' +
            '<td>' + botonAccion(a, 'btn--bloque') + '</td>' +
            '<td>' + botonAccion(b, 'btn--bloque') + '</td>' +
          '</tr></tfoot>' +
        '</table>' +
      '</div>';
  }

  // Botón "Comparar" de cada tarjeta: ocupa la primera columna libre y,
  // si las dos ya están ocupadas, reemplaza la segunda. Si el producto
  // ya está cargado en alguna de las dos, no lo duplica: sólo lleva la
  // vista al comparador para que se vea que ya está.
  function cargarEnComparador(id) {
    if (id !== comparadorA && id !== comparadorB) {
      if (!comparadorA) comparadorA = id;
      else if (!comparadorB) comparadorB = id;
      else comparadorB = id;

      selectA.setValor(comparadorA || '');
      selectB.setValor(comparadorB || '');
      actualizarDisponibilidadComparador();
      pintarComparador();
    }

    $('#comparar').scrollIntoView({ block: 'start' });
  }

  /* --------------------------- MODAL PRODUCTO ----------------------- */

  var modal = $('#modalProducto');
  var overlayModal = $('#overlayModal');
  var ultimoFocoModal = null;

  // Detalle de un combo: las dos fotos, qué incluye cada producto con sus
  // specs, y el precio con el ahorro. No reusa contenidoModal() porque un
  // combo no tiene ficha técnica propia — tiene dos.
  function contenidoModalCombo(c) {
    var fotos = c.items.map(function (p) {
      return '<div class="combo__foto">' + media(p) + '</div>';
    }).join('<span class="combo__mas" aria-hidden="true">+</span>');

    var detalle = c.items.map(function (p) {
      var specs = (p.specs || []).join(' · ');
      return '<div class="combo-detalle__item">' +
               '<p class="combo-detalle__nombre">' + esc(p.nombre) + '</p>' +
               (specs ? '<p class="combo-detalle__specs">' + esc(specs) + '</p>' : '') +
               '<p class="combo-detalle__precio">' + precio(p.precio) + ' por separado</p>' +
             '</div>';
    }).join('');

    return '<div class="combo__fotos combo__fotos--modal">' +
             '<span class="etiqueta etiqueta--combo">Combo</span>' + fotos +
           '</div>' +
      '<p class="modal__cat">' + esc(c.categoria) + '</p>' +
      '<h2 class="modal__nombre" id="modalNombre">' + esc(c.nombre) + '</h2>' +
      '<p class="modal__precios">' +
        '<span class="precio--anterior">' + precio(c.precioAnterior) + '</span>' +
        '<span class="precio">' + precio(c.precio) + '</span>' +
      '</p>' +
      '<p class="combo__ahorro">Ahorrás ' + precio(ahorroCombo(c)) +
        ' (' + c.descuento + '%) comprando los dos juntos</p>' +
      htmlStock(c) +
      '<div class="combo-detalle">' + detalle + '</div>' +
      '<div class="modal__acciones">' +
        '<a class="btn btn--sec btn--compacto" href="' + urlWhatsapp(msgConsultaCombo(c)) + '" ' +
        'target="_blank" rel="noopener">' + btnPartes('whatsapp', 'Consultar por WhatsApp') + '</a>' +
        '<button class="btn btn--compacto" type="button" data-agregar="' + esc(c.id) + '">' +
          btnPartes('carrito', 'Agregar combo al carrito') + '</button>' +
      '</div>';
  }

  function contenidoModal(p) {
    if (p.esCombo) return contenidoModalCombo(p);
    var d = p.detalle || {};
    var filas = Object.keys(d).map(function (k) {
      return '<div class="detalle__fila"><dt>' + esc(k) + '</dt><dd>' + esc(d[k]) + '</dd></div>';
    }).join('');

    var anterior = p.precioAnterior
      ? '<span class="precio--anterior">' + precio(p.precioAnterior) + '</span>'
      : '';

    var primario = hayStock(p)
      ? '<button class="btn btn--compacto" type="button" data-agregar="' + esc(p.id) + '">' +
        btnPartes('carrito', 'Agregar al carrito') + '</button>'
      : '<a class="btn btn--sec btn--compacto" href="' + urlWhatsapp(msgAviso(p)) + '" ' +
        'target="_blank" rel="noopener">' + btnPartes('campana', 'Avisame cuando llegue') + '</a>';

    return media(p, '', marcasSobreFoto(p)) +
      // Vacío y oculto salvo que se detecten fotos extra (ver montarGaleria):
      // con una sola foto el modal queda igual que siempre.
      '<div class="galeria" id="modalGaleria" role="tablist" ' +
           'aria-label="Fotos del producto" hidden></div>' +
      '<p class="modal__cat">' + esc(p.categoria) + '</p>' +
      '<h2 class="modal__nombre" id="modalNombre">' + esc(p.nombre) + '</h2>' +
      '<p class="modal__precios">' +
        '<span class="precio">' + precio(p.precio) + '</span>' + anterior +
      '</p>' +
      htmlStock(p) +
      (hayStock(p) ? '' : '<p class="modal__agotado">Sin stock por ahora. Dejanos tu mensaje y te avisamos apenas entre.</p>') +
      // sólo tiene sentido prometer un plazo de lo que se puede entregar
      (hayStock(p) ? bloqueEntrega() : '') +
      bloqueEstado(p) +
      (filas ? '<dl class="detalle">' + filas + '</dl>' : '') +
      '<div class="modal__acciones">' +
        '<a class="btn btn--sec btn--compacto" href="' + urlWhatsapp(msgConsulta(p)) + '" ' +
        'target="_blank" rel="noopener">' + btnPartes('whatsapp', 'Consultar por WhatsApp') + '</a>' +
        '<button class="btn btn--sec btn--compacto" type="button" data-compartir="' + esc(p.id) + '">' +
          btnPartes('compartir', 'Compartir') + '</button>' +
        primario +
      '</div>';
  }

  /* --------------------------- COMPARTIR -----------------------------
     No hay una página por producto, así que el link apunta a la página de
     su categoría con ?producto=<id>: al abrirla, abrirProductoDeLaUrl()
     levanta el modal de ese producto.
     ------------------------------------------------------------------ */

  function linkProducto(p) {
    return SITIO + paginaDe(p.categoria) + '?producto=' + encodeURIComponent(p.id);
  }

  function compartirProducto(id) {
    var p = buscarProducto(id);
    if (!p) return;

    var url = linkProducto(p);

    // navigator.share sólo existe en contexto seguro y sobre todo en
    // mobile; donde no está, el plan B es copiar el link.
    if (navigator.share) {
      navigator.share({
        title: p.nombre,
        text: p.nombre + ' — ' + precio(p.precio),
        url: url
      }).catch(function () {
        // cancelar el diálogo del sistema no es un error que haya que avisar
      });
      return;
    }

    copiarLink(url);
  }

  function copiarLink(url) {
    // La API moderna necesita HTTPS (o localhost); si no está disponible
    // o falla, se cae al textarea + execCommand de siempre.
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        avisar('Link copiado');
      }).catch(function () {
        avisar(copiarConTextarea(url) ? 'Link copiado' : 'No se pudo copiar el link');
      });
      return;
    }
    avisar(copiarConTextarea(url) ? 'Link copiado' : 'No se pudo copiar el link');
  }

  function copiarConTextarea(texto) {
    var ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();

    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }

    document.body.removeChild(ta);
    return ok;
  }

  // ?producto=<id> — lo pone el botón "Compartir". Un id que no existe, o
  // que es de otra categoría, se ignora: la página carga normal.
  function abrirProductoDeLaUrl() {
    var id = new URLSearchParams(location.search).get('producto');
    if (!id) return;

    var p = buscarProducto(id);
    if (!p) return;
    if (categoriaPagina && p.categoria !== categoriaPagina) return;

    abrirModal(id);
  }

  /* ------------------- GALERÍA DE FOTOS DEL MODAL --------------------
     Misma convención que la foto principal, con sufijo: si existen
     img/<id>-2.jpg, -3, -4, -5, se suman a la galería. No hay índice en
     el JSON: se detectan intentando cargarlas y se corta en la primera
     que falta (probando hasta MAX_FOTOS en total).

     La búsqueda es asíncrona y la galería se inyecta DESPUÉS de que el
     modal ya está abierto: así el modal abre igual de rápido y, cuando
     el producto no tiene fotos extra (el caso de hoy), queda exactamente
     como antes, sin controles.
     ------------------------------------------------------------------ */
  var MAX_FOTOS = 5;
  var galeriaCache = {};      // id -> array de rutas extra ya detectadas
  var productoEnModal = null; // evita que una búsqueda lenta pinte sobre otro producto

  function probarImagen(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = src;
    });
  }

  function buscarFotosExtra(p) {
    if (galeriaCache[p.id]) return Promise.resolve(galeriaCache[p.id]);

    var encontradas = [];

    function terminar() {
      galeriaCache[p.id] = encontradas;
      return encontradas;
    }

    function siguiente(n) {
      if (n > MAX_FOTOS) return Promise.resolve(terminar());
      var src = 'img/' + p.id + '-' + n + '.jpg';
      return probarImagen(src).then(function (existe) {
        if (!existe) return terminar();
        encontradas.push(src);
        return siguiente(n + 1);
      });
    }

    return siguiente(2);
  }

  function montarGaleria(p, fotos) {
    var caja = $('#modalGaleria');
    if (!caja) return;

    caja.innerHTML = fotos.map(function (src, i) {
      return '<button class="galeria__mini" type="button" role="tab" ' +
             'aria-selected="' + (i === 0 ? 'true' : 'false') + '" ' +
             'data-foto="' + esc(src) + '" data-indice="' + i + '">' +
               '<img src="' + esc(src) + '" alt="' + esc(p.nombre) +
               ' — foto ' + (i + 1) + ' de ' + fotos.length + '" loading="lazy">' +
             '</button>';
    }).join('');
    caja.hidden = false;

    var grande = $('#modalContenido .media__img');
    var minis = Array.prototype.slice.call(caja.querySelectorAll('.galeria__mini'));

    function mostrar(i) {
      if (i < 0) i = fotos.length - 1;
      if (i >= fotos.length) i = 0;
      if (grande) {
        grande.src = fotos[i];
        grande.alt = p.nombre + ' — foto ' + (i + 1) + ' de ' + fotos.length;
      }
      minis.forEach(function (m, j) {
        m.setAttribute('aria-selected', j === i ? 'true' : 'false');
      });
    }

    caja.addEventListener('click', function (e) {
      var mini = e.target.closest('.galeria__mini');
      if (mini) mostrar(Number(mini.dataset.indice));
    });

    // Flechas para cambiar de foto, con el foco dentro de la galería.
    caja.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var actual = minis.findIndex(function (m) { return m.getAttribute('aria-selected') === 'true'; });
      var proximo = e.key === 'ArrowRight' ? actual + 1 : actual - 1;
      if (proximo < 0) proximo = fotos.length - 1;
      if (proximo >= fotos.length) proximo = 0;
      mostrar(proximo);
      minis[proximo].focus();
    });
  }

  function abrirModal(id, disparador) {
    var p = buscarProducto(id);
    if (!p) return;

    ultimoFocoModal = disparador || document.activeElement;
    $('#modalContenido').innerHTML = contenidoModal(p);
    productoEnModal = p.id;

    modal.hidden = false;
    overlayModal.hidden = false;
    void modal.offsetWidth;           // fuerza reflow para que se vea la entrada
    modal.dataset.visible = 'true';
    overlayModal.dataset.visible = 'true';
    bloquearScroll();
    $('#modalCerrar').focus();

    buscarFotosExtra(p).then(function (extras) {
      // si mientras buscaba se abrió otro producto (o se cerró), no pinta
      if (!extras.length || productoEnModal !== p.id || modal.hidden) return;
      montarGaleria(p, [rutaImagen(p)].concat(extras));
    });
  }

  function cerrarModal() {
    if (modal.hidden) return;
    modal.dataset.visible = 'false';
    overlayModal.dataset.visible = 'false';

    var ocultar = function () {
      modal.hidden = true;
      overlayModal.hidden = true;
      liberarScroll();
    };
    if (sinMovimiento()) ocultar();
    else setTimeout(ocultar, 220);

    // el foco vuelve a la tarjeta que lo abrió
    if (ultimoFocoModal && document.contains(ultimoFocoModal)) ultimoFocoModal.focus();
    ultimoFocoModal = null;
  }

  $('#modalCerrar').addEventListener('click', cerrarModal);
  overlayModal.addEventListener('click', cerrarModal);

  /* ------------------------------ CARRITO --------------------------- */

  function leerCarrito() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function guardarCarrito() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    } catch (e) {
      // modo privado / sin espacio: el carrito sigue funcionando en memoria
      console.warn('[tienda] no se pudo guardar el carrito:', e);
    }
  }

  // Busca por id en el catálogo y también entre los combos: así el
  // carrito, el modal y el mensaje de WhatsApp tratan a un combo como a
  // cualquier otro producto, sin ramas especiales en cada lugar.
  function buscarProducto(id) {
    for (var i = 0; i < productos.length; i++) {
      if (productos[i].id === id) return productos[i];
    }
    for (var j = 0; j < combos.length; j++) {
      if (combos[j].id === id) return combos[j];
    }
    return null;
  }

  // Líneas del carrito con los datos del producto ya resueltos.
  // Descarta ítems cuyo producto ya no existe en productos.json.
  function lineas() {
    return carrito.reduce(function (acc, item) {
      var p = buscarProducto(item.id);
      if (p) acc.push({ producto: p, cantidad: item.cantidad });
      return acc;
    }, []);
  }

  function agregar(id) {
    var p = buscarProducto(id);
    if (!p || !hayStock(p)) return;

    var existente = null;
    carrito.forEach(function (i) { if (i.id === id) existente = i; });

    if (existente) {
      existente.cantidad += 1;
    } else {
      carrito.push({ id: id, cantidad: 1 });
      idsEntrando.push(id);          // [28] sólo animan las líneas nuevas
    }

    guardarCarrito();
    pintarCarrito();
    saltarIcono();                   // [8]
    avisar('Agregado al carrito');   // [25]
  }

  function cambiarCantidad(id, delta) {
    var actual = null;
    carrito.forEach(function (i) { if (i.id === id) actual = i; });
    if (!actual) return;

    // llegar a 0 restando sale por la misma animación que "Quitar"
    if (actual.cantidad + delta <= 0) { quitar(id); return; }

    actual.cantidad += delta;
    guardarCarrito();
    pintarCarrito();
  }

  // [27] la línea se va a la derecha y colapsa; las de abajo suben suave
  function quitar(id) {
    var nodo = $('#carritoItems').querySelector('[data-linea="' + id + '"]');

    if (!nodo || sinMovimiento()) { quitarDelEstado(id); return; }
    if (nodo.classList.contains('linea-wrap--sale')) return;   // ya está saliendo

    nodo.classList.add('linea-wrap--sale');
    setTimeout(function () { quitarDelEstado(id); }, 400);
  }

  function quitarDelEstado(id) {
    carrito = carrito.filter(function (i) { return i.id !== id; });
    guardarCarrito();
    pintarCarrito();
  }

  function total() {
    return lineas().reduce(function (t, l) {
      return t + l.producto.precio * l.cantidad;
    }, 0);
  }

  function unidades() {
    return lineas().reduce(function (t, l) { return t + l.cantidad; }, 0);
  }

  /* ------------- CONTADOR DEL CARRITO EN LA PESTAÑA ------------------
     "(2) iPhones — IPHONE ALLEN…". El title propio de cada página no se
     reemplaza: TITULO_BASE se guarda arriba de todo, al arrancar, y el
     número se le antepone, así las seis páginas conservan el suyo.
     Se lee del carrito, que vive en localStorage, de modo que el número
     sigue estando al navegar de una página a otra.
     ------------------------------------------------------------------ */
  function actualizarTituloPestana(n) {
    document.title = n > 0 ? '(' + n + ') ' + TITULO_BASE : TITULO_BASE;
  }

  function pintarCarrito() {
    var ls = lineas();
    var cont = $('#carritoItems');

    if (!ls.length) {
      // [31] carrito vacío. No es sólo un cartel: el ícono en tono suave
      // explica DE QUÉ está vacío, y el botón da la salida al catálogo
      // completo (productos.html, que sirve para cualquier página desde
      // la que se haya abierto el drawer).
      cont.innerHTML =
        '<div class="carrito-vacio">' +
          '<span class="carrito-vacio__ico" aria-hidden="true">' + icono('carrito') + '</span>' +
          '<p class="carrito-vacio__titulo">Tu carrito está vacío</p>' +
          '<p class="carrito-vacio__texto">Descubrí nuestros iPhones y accesorios.</p>' +
          '<a class="btn btn--sec btn--compacto" href="productos.html" data-ir-catalogo>' +
            btnPartes('lista', 'Ver el catálogo') +
          '</a>' +
        '</div>';
    } else {
      cont.innerHTML = ls.map(function (l) {
        var p = l.producto;
        var entra = idsEntrando.indexOf(p.id) !== -1 && !sinMovimiento();

        var specs = (p.specs || []).slice(0, 2).join(' · ');

        return '<div class="linea-wrap' + (entra ? ' linea-wrap--entra' : '') + '" ' +
                    'data-linea="' + esc(p.id) + '">' +
                 '<div class="linea">' +
                   media(p) +
                   '<div>' +
                     '<p class="linea__nombre">' + esc(nombreDePedido(p)) + '</p>' +
                     (specs ? '<p class="linea__specs">' + esc(specs) + '</p>' : '') +
                     '<p class="linea__precio">' + precio(p.precio) + '</p>' +
                     '<div class="linea__controles">' +
                       '<button class="qty" type="button" data-menos="' + esc(p.id) + '" ' +
                         'aria-label="Quitar una unidad de ' + esc(p.nombre) + '">−</button>' +
                       '<span class="qty__valor" aria-label="Cantidad">' + l.cantidad + '</span>' +
                       '<button class="qty" type="button" data-mas="' + esc(p.id) + '" ' +
                         'aria-label="Agregar una unidad de ' + esc(p.nombre) + '">+</button>' +
                       '<button class="linea__quitar" type="button" data-quitar="' + esc(p.id) + '">Quitar</button>' +
                     '</div>' +
                   '</div>' +
                 '</div>' +
               '</div>';
      }).join('');
    }

    idsEntrando = [];

    var n = unidades();
    $('#contadorCarrito').textContent = n;
    $('#contadorCarritoTexto').textContent = n + (n === 1 ? ' producto en el carrito' : ' productos en el carrito');
    actualizarTituloPestana(n);
    $('#abrirCarrito').dataset.lleno = n > 0 ? 'true' : 'false';
    $('#carritoTotal').textContent = precio(total());
    $('#pedirWhatsapp').disabled = n === 0;

    actualizarFade();
    actualizarEnlacesWhatsapp();
    pintarCheckout();     // si está abierto, el total y los sugeridos se recalculan
  }

  /* ------------------ CONTENIDO DE LA VISTA DE CHECKOUT --------------
     Tres bloques que se recalculan cada vez que cambia el carrito: el
     resumen del pedido, las cuentas + medios de pago, y los sugeridos.
     Todo es informativo salvo el botón de agregar de los sugeridos.
     ------------------------------------------------------------------ */
  function pintarCheckout() {
    if (checkout.hidden) return;    // no vale la pena calcular a puertas cerradas
    pintarPedidoCheckout();
    pintarResumenCheckout();
    pintarSugeridos();
  }

  // Resumen del pedido: mismas líneas que el carrito pero de sólo lectura
  // (acá no se editan cantidades; para eso está el botón "Volver").
  function pintarPedidoCheckout() {
    var ls = lineas();
    $('#checkoutPedido').innerHTML = ls.map(function (l) {
      var p = l.producto;
      return '<div class="pedido-linea">' +
               media(p) +
               '<div class="pedido-linea__datos">' +
                 '<p class="pedido-linea__nombre">' + esc(nombreDePedido(p)) + '</p>' +
                 '<p class="pedido-linea__cant">' + l.cantidad + ' × ' + precio(p.precio) + '</p>' +
               '</div>' +
               '<p class="pedido-linea__sub">' + precio(p.precio * l.cantidad) + '</p>' +
             '</div>';
    }).join('');
  }

  function pintarResumenCheckout() {
    // Subtotal y total coinciden: el envío se coordina aparte y todavía no
    // hay costos ni descuentos definidos. Se muestran los dos igual porque
    // es la lectura que espera cualquiera que compró alguna vez online.
    $('#resumenSubtotal').textContent = precio(total());
    $('#resumenTotal').textContent = precio(total());
    $('#resumenEntrega').textContent = ENTREGA_ESTIMADA;

    $('#resumenPagos').innerHTML = FORMAS_PAGO.map(function (f) {
      var ico = ICONOS[f.icono] ? icono(f.icono) : '';
      return '<li class="resumen__pago">' + ico + '<span>' + esc(f.titulo) + '</span></li>';
    }).join('');
  }

  var MAX_SUGERIDOS = 4;

  // Criterio: con stock, que no esté ya en el carrito, y primero los de
  // categorías que el carrito NO tiene (agregar otro iPhone al lado de un
  // iPhone es peor sugerencia que ofrecer el accesorio que le falta).
  // Si no alcanzan, completa con los que queden.
  function elegirSugeridos() {
    var enCarrito = carrito.map(function (i) { return i.id; });
    var catsEnCarrito = lineas().map(function (l) { return l.producto.categoria; });

    var candidatos = productos.filter(function (p) {
      return hayStock(p) && enCarrito.indexOf(p.id) === -1;
    });

    var otraCategoria = candidatos.filter(function (p) {
      return catsEnCarrito.indexOf(p.categoria) === -1;
    });
    var mismaCategoria = candidatos.filter(function (p) {
      return catsEnCarrito.indexOf(p.categoria) !== -1;
    });

    return otraCategoria.concat(mismaCategoria).slice(0, MAX_SUGERIDOS);
  }

  function pintarSugeridos() {
    var lista = elegirSugeridos();
    var seccion = $('#sugeridos');

    // sin candidatos (carrito con todo el catálogo) la sección no se muestra
    seccion.hidden = lista.length === 0;
    if (!lista.length) return;

    $('#sugeridosFila').innerHTML = lista.map(function (p) {
      return '<article class="sugerido">' +
               media(p) +
               '<p class="sugerido__nombre">' + esc(p.nombre) + '</p>' +
               '<p class="sugerido__precio">' + precio(p.precio) + '</p>' +
               '<button class="btn btn--compacto" type="button" data-agregar="' + esc(p.id) + '">' +
                 btnPartes('carrito', 'Agregar',
                           '<span class="sr-only"> — ' + esc(p.nombre) + '</span>') +
               '</button>' +
             '</article>';
    }).join('');
  }

  // El degradado del borde inferior sólo si la lista tiene más contenido
  // del que entra en la caja. Hay que recalcularlo también al abrir el
  // drawer: mientras está [hidden] mide 0 y daría siempre "no hay más".
  function actualizarFade() {
    var cont = $('#carritoItems');
    $('#carritoLista').dataset.hayMas =
      cont.scrollHeight > cont.clientHeight + 1 ? 'true' : 'false';
  }

  // Barra de pasos del drawer: 1 carrito · 2 datos · 3 whatsapp.
  function marcarPaso(n) {
    Array.prototype.forEach.call($('#pasosCarrito').children, function (li, i) {
      var activo = (i + 1) === n;
      li.dataset.activo = activo ? 'true' : 'false';
      if (activo) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
  }

  // [8] salto del ícono del carrito al agregar
  function saltarIcono() {
    if (sinMovimiento()) return;
    var ico = $('#iconoCarrito');
    ico.classList.remove('is-saltando');
    void ico.offsetWidth;            // reinicia la animación si se agrega seguido
    ico.classList.add('is-saltando');
  }

  /* ------------------------ CLICKS DELEGADOS ------------------------ */

  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-agregar]');
    if (add) {
      agregar(add.dataset.agregar);
      cerrarModal();                 // agregar desde el modal lo cierra
      return;
    }

    var abrir = e.target.closest('[data-modal]');
    if (abrir) {
      if (bloquearClick) return;     // veníamos de un swipe del carrusel
      abrirModal(abrir.dataset.modal, abrir);
      return;
    }

    var comparar = e.target.closest('[data-comparar]');
    if (comparar) {
      cargarEnComparador(comparar.dataset.comparar);
      return;
    }

    var compartir = e.target.closest('[data-compartir]');
    if (compartir) {
      compartirProducto(compartir.dataset.compartir);
      return;
    }

    // El botón del carrito vacío navega a otra página, pero si ya se está
    // en productos.html el href no cambia nada: cerrar el drawer deja ver
    // el catálogo igual.
    var irCatalogo = e.target.closest('[data-ir-catalogo]');
    if (irCatalogo) cerrarDrawer();
  });

  $('#carritoItems').addEventListener('click', function (e) {
    var mas = e.target.closest('[data-mas]');
    var menos = e.target.closest('[data-menos]');
    var quit = e.target.closest('[data-quitar]');
    if (mas) cambiarCantidad(mas.dataset.mas, 1);
    if (menos) cambiarCantidad(menos.dataset.menos, -1);
    if (quit) quitar(quit.dataset.quitar);
  });

  $('#vaciarCarrito').addEventListener('click', function () {
    carrito = [];
    guardarCarrito();
    pintarCarrito();
  });

  /* --------------------------- DRAWER (UI) -------------------------- */

  var drawer = $('#carrito');
  var checkout = $('#checkout');
  var overlay = $('#overlayCarrito');
  var ultimoFoco = null;

  // ¿Hay alguna capa del carrito abierta? (drawer lateral o checkout)
  function capaCarritoAbierta() {
    return !drawer.hidden || !checkout.hidden;
  }

  // El botón flotante se esconde mientras hay una capa abierta: aunque su
  // z-index ya lo deja por debajo, con el velo puesto seguiría siendo
  // clickeable y compite con las acciones del carrito.
  function ocultarFlotantes(ocultar) {
    var el = $('#arribaBtn');
    if (el) el.hidden = ocultar;
  }

  function bloquearScroll() {
    document.body.style.overflow = 'hidden';
    ocultarFlotantes(true);
  }

  function liberarScroll() {
    // sólo se libera si no queda ninguna capa abierta
    if (!capaCarritoAbierta() && modal.hidden) {
      document.body.style.overflow = '';
      ocultarFlotantes(false);
    }
  }

  function abrirDrawer() {
    ultimoFoco = document.activeElement;
    drawer.hidden = false;
    overlay.hidden = false;
    void drawer.offsetWidth;
    drawer.dataset.visible = 'true';
    overlay.dataset.visible = 'true';
    bloquearScroll();
    actualizarFade();                // recién ahora la lista tiene altura real
    marcarPaso(1);
    $('#cerrarCarrito').focus();
  }

  // Cierra las dos capas del carrito y devuelve el foco a donde estaba.
  function cerrarDrawer() {
    if (!capaCarritoAbierta()) return;

    checkout.hidden = true;
    checkout.dataset.visible = 'false';
    drawer.dataset.visible = 'false';
    overlay.dataset.visible = 'false';

    var ocultar = function () {
      drawer.hidden = true;
      overlay.hidden = true;
      liberarScroll();
    };
    if (sinMovimiento()) ocultar();
    else setTimeout(ocultar, 300);

    if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus();
    ultimoFoco = null;
  }

  $('#abrirCarrito').addEventListener('click', abrirDrawer);
  $('#cerrarCarrito').addEventListener('click', cerrarDrawer);
  overlay.addEventListener('click', cerrarDrawer);

  /* --------------------- FOCO ATRAPADO (Esc + Tab) ------------------ */

  var SELECTOR_FOCO = 'button:not([disabled]), a[href], input:not([tabindex="-1"]), ' +
                      'select, textarea, [tabindex]:not([tabindex="-1"])';

  function atraparTab(e, contenedor) {
    // querySelectorAll no filtra por visibilidad: desde que el drawer
    // tiene dos vistas (carrito / formulario) que se alternan con
    // [hidden], hay que descartar a mano lo que quedó dentro de la vista
    // oculta. offsetParent es null tanto para display:none como para
    // cualquier ancestro oculto; los hijos normales del drawer (fixed)
    // no son ellos mismos position:fixed, así que este chequeo no da
    // falsos negativos acá.
    var focosables = Array.prototype.filter.call(
      contenedor.querySelectorAll(SELECTOR_FOCO),
      function (el) { return el.offsetParent !== null; }
    );
    if (!focosables.length) return;

    var primero = focosables[0];
    var ultimo = focosables[focosables.length - 1];

    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  document.addEventListener('keydown', function (e) {
    // Orden de arriba hacia abajo: el modal tapa al checkout y el checkout
    // tapa al drawer, así que se atiende al de más arriba.
    var capa = !modal.hidden ? modal
             : (!checkout.hidden ? checkout
             : (!drawer.hidden ? drawer : null));
    if (!capa) return;

    if (e.key === 'Escape') {
      if (capa === modal) cerrarModal();
      // desde el checkout, Escape hace lo mismo que el botón "Volver":
      // retrocede al carrito en vez de perder todo el paso
      else if (capa === checkout) mostrarVistaCarrito();
      else cerrarDrawer();
      return;
    }
    if (e.key === 'Tab') atraparTab(e, capa);
  });

  /* ----------------------------- WHATSAPP --------------------------- */

  function urlWhatsapp(texto) {
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
  }

  function msgConsulta(p) {
    return '¡Hola ' + NEGOCIO + '! Quería consultar por el ' + p.nombre + '.';
  }

  function msgAviso(p) {
    return '¡Hola ' + NEGOCIO + '! ¿Me avisan cuando entre el ' + p.nombre + '?';
  }

  function msgConsultaCombo(c) {
    return '¡Hola ' + NEGOCIO + '! Quería consultar por el combo ' + c.nombre +
           ' (' + precio(c.precio) + ').';
  }

  // Nombre para el carrito y el mensaje: los combos llevan el prefijo
  // "Combo:" y en la misma línea van los dos productos que incluyen.
  function nombreDePedido(p) { return p.nombreCarrito || p.nombre; }

  // Líneas del pedido en texto plano, reutilizadas por el mensaje final.
  function lineasPedidoTexto() {
    return lineas().map(function (l) {
      return '• ' + l.cantidad + 'x ' + nombreDePedido(l.producto) +
             ' — ' + precio(l.producto.precio * l.cantidad);
    });
  }

  // Mensaje final: productos + total + datos de entrega cargados en el formulario.
  function mensajePedidoConEntrega(datos) {
    var partes = ['¡Hola ' + NEGOCIO + '! Quiero hacer este pedido:', ''];
    partes = partes.concat(lineasPedidoTexto());
    partes.push('');
    partes.push('Total: ' + precio(total()));
    partes.push('');
    partes.push('Entrega: ' + datos.metodo);
    partes.push('Nombre: ' + datos.nombre);
    if (datos.metodo === 'Envío') partes.push('Dirección: ' + datos.direccion);
    partes.push('Teléfono: ' + datos.telefono);
    if (datos.email) partes.push('Correo: ' + datos.email);
    partes.push('Horario: ' + datos.horario);

    return partes.join('\n');
  }

  // Los dos botones "Escribinos" (hero y sección de contacto) sólo
  // existen en la portada; pintarCarrito() corre en las cinco páginas.
  function actualizarEnlacesWhatsapp() {
    var consulta = urlWhatsapp(MENSAJE_CONSULTA);
    var botones = document.querySelectorAll('#ctaWhatsapp, #ctaWhatsapp2');
    Array.prototype.forEach.call(botones, function (b) { b.href = consulta; });
  }

  var enviadoTimer = null;

  // "Finalizar compra" ya no manda el WhatsApp directo: abre el
  // formulario de entrega. El envío real pasa por manejarSubmitFormulario.
  $('#pedirWhatsapp').addEventListener('click', function () {
    if (!lineas().length) return;
    mostrarVistaCheckout();
  });

  // [36] el tilde se traza recién acá, después de abrir WhatsApp
  function mostrarEnviado() {
    var el = $('#pedidoEnviado');
    var trazo = el.querySelector('path');

    el.hidden = false;
    trazo.style.animation = 'none';
    void trazo.offsetWidth;          // reinicia el trazo si se manda de nuevo
    trazo.style.animation = '';

    clearTimeout(enviadoTimer);
    enviadoTimer = setTimeout(function () { el.hidden = true; }, 5000);
  }

  actualizarEnlacesWhatsapp();

  /* ------------------------ FORMULARIO DE ENTREGA --------------------
     Vive siempre en el DOM (nunca se recrea con innerHTML): así, alternar
     entre carrito y formulario con [hidden] no pierde lo que el cliente
     ya escribió. Los datos, además, se guardan en localStorage para que
     sobrevivan a un recargo de página.
     ------------------------------------------------------------------ */

  var formEntrega = $('#formEntrega');

  var CAMPO_TEXTO = {
    nombre:    { input: $('#entregaNombre'),    error: $('#errorNombre') },
    direccion: { input: $('#entregaDireccion'), error: $('#errorDireccion') },
    telefono:  { input: $('#entregaTelefono'),  error: $('#errorTelefono') },
    email:     { input: $('#entregaEmail'),     error: $('#errorEmail') }
  };

  function metodoElegido() {
    var marcado = formEntrega.querySelector('input[name="metodoEntrega"]:checked');
    return marcado ? marcado.value : 'Envío';
  }

  function horarioElegido() {
    var marcado = formEntrega.querySelector('input[name="horario"]:checked');
    return marcado ? marcado.value : '';
  }

  // La dirección sólo es obligatoria (y visible) con "Envío"; con
  // "Retiro" la etiqueta del horario también cambia.
  function actualizarSegunMetodo() {
    var esRetiro = metodoElegido() === 'Retiro';
    $('#campoDireccion').hidden = esRetiro;
    $('#horarioLabelTexto').textContent = esRetiro ? 'Horario de retiro' : 'Horario de entrega';
  }

  formEntrega.addEventListener('change', function (e) {
    if (e.target.name === 'metodoEntrega') actualizarSegunMetodo();
  });

  /* ------------------------- PERSISTENCIA (localStorage) -------------- */

  function leerDatosEntrega() {
    try {
      var raw = localStorage.getItem(ENTREGA_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function guardarDatosEntrega() {
    var datos = {
      metodo: metodoElegido(),
      nombre: $('#entregaNombre').value,
      direccion: $('#entregaDireccion').value,
      telefono: $('#entregaTelefono').value,
      email: $('#entregaEmail').value,
      horario: horarioElegido()
    };
    try {
      localStorage.setItem(ENTREGA_STORAGE_KEY, JSON.stringify(datos));
    } catch (e) {
      console.warn('[tienda] no se pudieron guardar los datos de entrega:', e);
    }
  }

  function aplicarDatosGuardados() {
    var datos = leerDatosEntrega();
    if (!datos) return;

    if (datos.metodo) {
      var radioMetodo = formEntrega.querySelector('input[name="metodoEntrega"][value="' + datos.metodo + '"]');
      if (radioMetodo) radioMetodo.checked = true;
    }
    $('#entregaNombre').value = datos.nombre || '';
    $('#entregaDireccion').value = datos.direccion || '';
    $('#entregaTelefono').value = datos.telefono || '';
    $('#entregaEmail').value = datos.email || '';
    if (datos.horario) {
      var radioHorario = formEntrega.querySelector('input[name="horario"][value="' + datos.horario + '"]');
      if (radioHorario) radioHorario.checked = true;
    }

    actualizarSegunMetodo();
  }

  // ¿Hay algo escrito de antes? De eso depende que se ofrezca borrarlo.
  function hayDatosGuardados() {
    var d = leerDatosEntrega();
    return !!(d && (d.nombre || d.direccion || d.telefono || d.email));
  }

  function actualizarBotonOlvidar() {
    $('#olvidarDatos').hidden = !hayDatosGuardados();
  }

  // Cualquier tecleo o cambio de opción guarda: no hace falta esperar al envío.
  formEntrega.addEventListener('input', function () {
    guardarDatosEntrega();
    actualizarBotonOlvidar();
  });
  formEntrega.addEventListener('change', function () {
    guardarDatosEntrega();
    actualizarBotonOlvidar();
  });

  // Vacía los campos y borra lo guardado en este navegador. Es la salida
  // para cuando quedó cargado un dato equivocado o una prueba.
  $('#olvidarDatos').addEventListener('click', function () {
    try { localStorage.removeItem(ENTREGA_STORAGE_KEY); } catch (e) {}
    $('#entregaNombre').value = '';
    $('#entregaDireccion').value = '';
    $('#entregaTelefono').value = '';
    $('#entregaEmail').value = '';
    limpiarErrores();
    actualizarBotonOlvidar();
    $('#entregaNombre').focus();
  });

  aplicarDatosGuardados();
  actualizarBotonOlvidar();

  /* ------------------------------ VALIDACIÓN --------------------------- */

  function limpiarErrores() {
    Object.keys(CAMPO_TEXTO).forEach(function (k) {
      var c = CAMPO_TEXTO[k];
      c.input.removeAttribute('aria-invalid');
      c.input.removeAttribute('aria-describedby');
      c.error.hidden = true;
      c.error.textContent = '';
    });
    $('#grupoHorario').removeAttribute('data-invalid');
    $('#errorHorario').hidden = true;
    $('#errorHorario').textContent = '';
  }

  function marcarError(campo, mensaje) {
    if (campo === 'horario') {
      $('#grupoHorario').setAttribute('data-invalid', 'true');
      var errHorario = $('#errorHorario');
      errHorario.textContent = mensaje;
      errHorario.hidden = false;
      return;
    }
    var c = CAMPO_TEXTO[campo];
    c.input.setAttribute('aria-invalid', 'true');
    c.input.setAttribute('aria-describedby', c.error.id);
    c.error.textContent = mensaje;
    c.error.hidden = false;
  }

  // Devuelve la lista de errores en el mismo orden en que aparecen los
  // campos en el formulario (así el primer error es también el primer
  // campo visualmente, y el foco tiene sentido).
  function validarFormulario() {
    var errores = [];
    var metodo = metodoElegido();

    var nombre = $('#entregaNombre').value.trim();
    if (!nombre) errores.push({ campo: 'nombre', mensaje: 'Falta el nombre y apellido.' });

    if (metodo === 'Envío') {
      var direccion = $('#entregaDireccion').value.trim();
      if (!direccion) errores.push({ campo: 'direccion', mensaje: 'Falta la dirección de entrega.' });
    }

    var telefono = $('#entregaTelefono').value.trim();
    var soloDigitos = telefono.replace(/\D/g, '');
    if (!telefono) {
      errores.push({ campo: 'telefono', mensaje: 'Falta el teléfono.' });
    } else if (!/^[\d\s-]+$/.test(telefono) || soloDigitos.length < 8) {
      errores.push({ campo: 'telefono', mensaje: 'Usá sólo números, espacios y guiones, con al menos 8 dígitos.' });
    }

    var email = $('#entregaEmail').value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errores.push({ campo: 'email', mensaje: 'Revisá el formato del correo.' });
    }

    if (!horarioElegido()) {
      errores.push({ campo: 'horario', mensaje: metodo === 'Retiro' ? 'Elegí un horario de retiro.' : 'Elegí un horario de entrega.' });
    }

    return errores;
  }

  function enfocarCampo(campo) {
    if (campo === 'horario') {
      formEntrega.querySelector('input[name="horario"]').focus();
      return;
    }
    CAMPO_TEXTO[campo].input.focus();
  }

  formEntrega.addEventListener('submit', function (e) {
    e.preventDefault();
    limpiarErrores();

    var errores = validarFormulario();
    if (errores.length) {
      errores.forEach(function (err) { marcarError(err.campo, err.mensaje); });
      enfocarCampo(errores[0].campo);
      return;
    }

    var datos = {
      metodo: metodoElegido(),
      nombre: $('#entregaNombre').value.trim(),
      direccion: $('#entregaDireccion').value.trim(),
      telefono: $('#entregaTelefono').value.trim(),
      email: $('#entregaEmail').value.trim(),
      horario: horarioElegido()
    };

    // el carrito NO se vacía acá: el pedido todavía no está confirmado,
    // sólo se mandó el mensaje para coordinar por WhatsApp.
    window.open(urlWhatsapp(mensajePedidoConEntrega(datos)), '_blank', 'noopener');
    mostrarEnviado();
    marcarPaso(3);
  });

  /* --------------------------- CAMBIO DE VISTA ------------------------ */

  // Del drawer lateral a la pantalla completa. El drawer se oculta: la
  // vista de checkout es opaca y lo taparía igual, pero dejarlo abierto
  // metería sus botones en el recorrido del Tab.
  function mostrarVistaCheckout() {
    drawer.hidden = true;
    drawer.dataset.visible = 'false';
    overlay.hidden = true;
    overlay.dataset.visible = 'false';

    checkout.hidden = false;
    void checkout.offsetWidth;
    checkout.dataset.visible = 'true';

    pintarCheckout();
    marcarPaso(2);
    bloquearScroll();
    $('#formEntregaTitulo').focus();
  }

  // Vuelta del checkout al carrito. Los datos del formulario no se tocan:
  // siguen en el DOM y además persistidos (ver guardarDatosEntrega).
  function mostrarVistaCarrito() {
    checkout.dataset.visible = 'false';
    checkout.hidden = true;

    drawer.hidden = false;
    overlay.hidden = false;
    void drawer.offsetWidth;
    drawer.dataset.visible = 'true';
    overlay.dataset.visible = 'true';

    marcarPaso(1);
    actualizarFade();
    $('#pedirWhatsapp').focus();
  }

  $('#volverAlCarrito').addEventListener('click', function () {
    mostrarVistaCarrito();
  });

  /* --------------------- [25] CONFIRMACIÓN (TOAST) ------------------ */

  var toast = $('#toast');
  var toastTimer = null;

  function avisar(texto) {
    toast.innerHTML = icono('check') + '<span>' + esc(texto) + '</span>';
    toast.dataset.visible = 'true';
    // [7] el pulso del hero se pausa mientras se ve la confirmación
    document.body.dataset.confirmando = 'true';

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.dataset.visible = 'false';
      document.body.dataset.confirmando = 'false';
    }, 2400);
  }

  /* -------------------------- FORMAS DE PAGO ------------------------- */

  function pintarPagos() {
    $('#pagosGrilla').innerHTML = FORMAS_PAGO.map(function (f) {
      var ico = ICONOS[f.icono] ? '<span class="pago-card__ico">' + icono(f.icono) + '</span>' : '';
      return '<article class="pago-card">' +
               ico +
               '<div>' +
                 '<p class="pago-card__titulo">' + esc(f.titulo) + '</p>' +
                 (f.detalle ? '<p class="pago-card__detalle">' + esc(f.detalle) + '</p>' : '') +
               '</div>' +
             '</article>';
    }).join('');
  }

  /* --------------------- PREGUNTAS FRECUENTES (FAQ) ------------------- */

  function pintarFaq() {
    // name="faq" agrupa los <details> nativamente en navegadores nuevos
    // (se cierran solos entre sí); el listener de 'toggle' de más abajo
    // hace lo mismo a mano para los que todavía no lo soportan.
    $('#acordeonFaq').innerHTML = FAQ.map(function (item) {
      return '<details class="faq__item" name="faq">' +
               '<summary class="faq__pregunta">' +
                 '<span>' + esc(item.p) + '</span>' +
                 icono('chevron', 'faq__chevron') +
               '</summary>' +
               '<div class="faq__respuesta"><p>' + esc(item.r) + '</p></div>' +
             '</details>';
    }).join('');
  }

  // 'toggle' no burbujea, pero sí atraviesa la fase de captura: por eso
  // el listener va en el contenedor con el tercer argumento en true.
  // El acordeón sólo existe en la portada.
  if ($('#acordeonFaq')) {
    $('#acordeonFaq').addEventListener('toggle', function (e) {
      if (e.target.tagName !== 'DETAILS' || !e.target.open) return;
      Array.prototype.forEach.call($('#acordeonFaq').querySelectorAll('details[open]'), function (d) {
        if (d !== e.target) d.open = false;
      });
    }, true);
  }

  /* ------------------------------- REDES ------------------------------ */

  // Placeholder sin reemplazar ("[USUARIO_INSTAGRAM]", "[CORREO]", etc.):
  // ese enlace directamente no se renderiza.
  function esPlaceholder(valor) {
    return !valor || /^\[.*\]$/.test(valor);
  }

  // Botón de Instagram con el mismo tratamiento de bloque que el resto de
  // los botones del sitio. Placeholder sin reemplazar => no se renderiza,
  // igual que el resto de los enlaces de CONTACTO.
  function botonInstagram(clase) {
    if (esPlaceholder(CONTACTO.instagram)) return '';
    return '<a class="btn ' + (clase || '') + '" href="https://instagram.com/' + encodeURIComponent(CONTACTO.instagram) + '" ' +
           'target="_blank" rel="noopener">' + btnPartes('instagram', 'Seguinos en Instagram') + '</a>';
  }

  // Instagram vive sólo en la sección Contacto, como botón completo al
  // lado del WhatsApp. El hero ya no lleva un ícono suelto: ahí quedan
  // nada más los dos botones de acción ("Ver iPhones" y "Escribinos").
  // Si Instagram está en placeholder, el botón no se renderiza.
  function pintarRedesContacto() {
    $('#ctaInstagramWrap').innerHTML = botonInstagram('btn--sec');
  }

  // Fila de medios de pago con tarjeta de la franja de promo. Mismo ícono
  // genérico para todas (ver ICONOS.tarjetaGenerica) y el nombre al lado;
  // la lista sale de TARJETAS.
  function pintarTarjetasPromo() {
    var cont = $('#promoTarjetas');
    if (!cont) return;
    cont.innerHTML = TARJETAS.map(function (nombre) {
      return '<li class="promo__tarjeta">' +
               icono('tarjetaGenerica', 'promo__tarjeta-ico') +
               '<span>' + esc(nombre) + '</span>' +
             '</li>';
    }).join('');
  }

  /* =====================================================================
     DESPLEGABLE "PRODUCTOS" DEL MENÚ
     El botón lleva al catálogo (desktop) o abre el acordeón (mobile). El
     panel se arma leyendo el JSON: categorías + subcategorías reales.
     ===================================================================== */

  // Subcategorías presentes en una categoría, en orden de aparición.
  // Una subcategoría sin productos no aparece (se deriva de los productos).
  function subcategoriasDe(categoria) {
    var subs = [];
    productos.forEach(function (p) {
      if (p.categoria === categoria && p.subcategoria && subs.indexOf(p.subcategoria) === -1) {
        subs.push(p.subcategoria);
      }
    });
    return subs;
  }

  var btnProductos = $('#btnProductos');
  var menuProductos = $('#menuProductos');
  var navDrop = $('#navProductos');
  var mqMobile = window.matchMedia('(max-width: 719px)');

  // Cada categoría es ahora una página propia, así que los ítems son
  // enlaces y no botones que filtran. Las subcategorías van a la misma
  // página de accesorios con el ancla de su sección.
  function construirMenuProductos() {
    var html = '';

    categoriasConProductos().forEach(function (c) {
      var subs = subcategoriasDe(c);
      var pagina = paginaDe(c);
      var actual = c === categoriaPagina;
      var marca = actual ? ' is-activo" aria-current="page' : '';

      html += '<a class="nav-drop__item' + marca + '" role="menuitem" href="' + esc(pagina) + '">' +
              esc(c) + '</a>';

      if (subs.length) {
        html += '<div class="nav-drop__grupo" role="group" aria-label="' + esc(c) + '">';
        subs.forEach(function (sub) {
          html += '<a class="nav-drop__item nav-drop__item--sub" role="menuitem" ' +
                  'href="' + esc(pagina) + '#' + esc(slug(sub)) + '">' + esc(sub) + '</a>';
        });
        html += '</div>';
      }
    });

    // Catálogo completo, al final de la lista.
    html += '<a class="nav-drop__item' + (catalogoCompleto ? ' is-activo" aria-current="page' : '') +
            '" role="menuitem" href="productos.html">Ver todo</a>';

    menuProductos.innerHTML = html;
  }

  function itemsMenu() {
    return Array.prototype.slice.call(menuProductos.querySelectorAll('[role="menuitem"]'));
  }

  // La visibilidad real la decide el CSS (hover / focus-within en desktop,
  // data-abierto en mobile). data-abierto + aria-expanded son el estado
  // "explícito"; menuAbierto() mira el display efectivo para cubrir también
  // el caso hover sin click.
  function abrirMenu() {
    navDrop.dataset.abierto = 'true';
    btnProductos.setAttribute('aria-expanded', 'true');
  }

  function cerrarMenu(devolverFoco) {
    navDrop.dataset.abierto = 'false';
    btnProductos.setAttribute('aria-expanded', 'false');
    if (devolverFoco) btnProductos.focus();
  }

  function menuAbierto() {
    return navDrop.dataset.abierto === 'true';
  }

  // Tras Escape, el foco vuelve al botón; sin esta guarda, el focusin que
  // dispara ese .focus() reabriría el panel de inmediato.
  var reabrirBloqueado = false;

  // "Productos" ya no baja a ningún catálogo: no hay catálogo en la
  // portada. Es sólo el disparador del panel, que ahora contiene los
  // enlaces a las páginas de categoría.
  btnProductos.addEventListener('click', function () {
    if (menuAbierto()) cerrarMenu();
    else abrirMenu();
  });

  // Los ítems son enlaces: navegan solos. Sólo hay que cerrar el panel
  // (importante cuando el destino es un ancla de la página actual, que
  // no recarga y dejaría el menú abierto).
  menuProductos.addEventListener('click', function (e) {
    if (e.target.closest('[role="menuitem"]')) cerrarMenu();
  });

  // Teclado del desplegable: flechas mueven entre ítems, Escape cierra y
  // devuelve el foco al botón, Tab sigue el orden natural (no se atrapa).
  navDrop.addEventListener('keydown', function (e) {
    var items = itemsMenu();
    var idx = items.indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!menuAbierto()) abrirMenu();
      var sig = idx < 0 ? 0 : Math.min(idx + 1, items.length - 1);
      items[sig].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx <= 0) { btnProductos.focus(); }
      else items[idx - 1].focus();
    } else if (e.key === 'Escape') {
      if (menuAbierto()) { e.preventDefault(); reabrirBloqueado = true; cerrarMenu(true); }
    } else if (e.key === 'Home' && idx >= 0) {
      e.preventDefault(); items[0].focus();
    } else if (e.key === 'End' && idx >= 0) {
      e.preventDefault(); items[items.length - 1].focus();
    }
  });

  // Desktop: hover y foco abren el panel; salir de ambos lo cierra.
  // (En mobile el toggle es por click, no por hover/foco.)
  navDrop.addEventListener('focusin', function () {
    if (mqMobile.matches) return;
    if (reabrirBloqueado) { reabrirBloqueado = false; return; }
    abrirMenu();
  });
  navDrop.addEventListener('focusout', function (e) {
    if (mqMobile.matches) return;
    if (!navDrop.contains(e.relatedTarget)) cerrarMenu();
  });
  navDrop.addEventListener('mouseenter', function () {
    if (!mqMobile.matches) abrirMenu();
  });
  navDrop.addEventListener('mouseleave', function () {
    if (mqMobile.matches) return;
    if (!navDrop.contains(document.activeElement)) cerrarMenu();
  });

  // Click fuera cierra (sobre todo útil en mobile con el acordeón abierto).
  document.addEventListener('click', function (e) {
    if (menuAbierto() && !navDrop.contains(e.target)) cerrarMenu();
  });

})();
