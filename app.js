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

  // Redes del footer. Un valor que quede con el placeholder ("[ALGO]")
  // sencillamente no se renderiza: un ícono que lleva a una cuenta que
  // no existe es peor que no tenerlo.
  var CONTACTO = {
    whatsapp: WHATSAPP,
    instagram: 'iphone.allen',
    email: '[CORREO]'
  };

  // ---------------------------------------------------------------------
  // FORMAS DE PAGO — los medios ya están confirmados, pero todavía no
  // hay definición de descuentos, recargos o cuotas: el campo "detalle"
  // de cada uno queda vacío a propósito y se completa más adelante. Con
  // "detalle" vacío no se renderiza esa línea (evita un hueco en blanco
  // en la tarjeta). Se pueden agregar o quitar elementos libremente.
  // ---------------------------------------------------------------------
  // "icono" es el nombre de una clave del objeto ICONOS (más abajo).
  var FORMAS_PAGO = [
    { titulo: 'Efectivo', detalle: '', icono: 'billete' },
    { titulo: 'Transferencia', detalle: '', icono: 'transferencia' },
    { titulo: 'Tarjeta', detalle: '', icono: 'tarjeta' }
  ];

  // ---------------------------------------------------------------------
  // PREGUNTAS FRECUENTES — las preguntas están armadas, pero las
  // respuestas son OBLIGATORIAS DE COMPLETAR antes de publicar la página.
  // Se pueden agregar o quitar preguntas libremente.
  // ---------------------------------------------------------------------
  var FAQ = [
    { p: '¿Los equipos son nuevos o usados?', r: '[RESPUESTA — completar]' },
    { p: '¿Qué garantía tienen?', r: '[RESPUESTA — completar]' },
    { p: '¿Los equipos vienen liberados?', r: '[RESPUESTA — completar]' },
    { p: '¿Cómo puedo pagar?', r: '[RESPUESTA — completar]' },
    { p: '¿Hacen envíos? ¿A qué zonas?', r: '[RESPUESTA — completar]' },
    { p: '¿Puedo retirar en persona?', r: '[RESPUESTA — completar]' },
    { p: '¿Qué pasa si el equipo viene con una falla?', r: '[RESPUESTA — completar]' }
  ];

  /* ------------------------------ ESTADO ---------------------------- */

  var productos = [];
  var carrito = leerCarrito();       // [{ id, cantidad }]
  var busqueda = '';
  var slideActivo = 0;
  var destacados = [];
  var primeraPintada = true;         // el escalonado [10] es sólo la 1ra vez
  var idsEntrando = [];              // líneas del carrito que animan su entrada
  var bloquearClick = false;         // evita abrir el modal al terminar un swipe
  var comparadorA = null;            // id del producto en la columna 1
  var comparadorB = null;            // id del producto en la columna 2

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
    correo: '<path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z"></path>' +
            '<path d="M3 7l9 6l9 -6"></path>',
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
               '<path d="M8.7 10.7l6.6 -3.4"></path><path d="M8.7 13.3l6.6 3.4"></path>'
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
  function botonAccion(p, clase, texto) {
    var sr = '<span class="sr-only"> — ' + esc(p.nombre) + '</span>';

    if (hayStock(p)) {
      return '<button class="btn ' + (clase || '') + '" type="button" data-agregar="' + esc(p.id) + '">' +
             btnPartes('carrito', texto || 'Agregar al carrito', sr) + '</button>';
    }
    return '<a class="btn btn--sec ' + (clase || '') + '" data-avisar="' + esc(p.id) + '" ' +
           'href="' + urlWhatsapp(msgAviso(p)) + '" target="_blank" rel="noopener">' +
           btnPartes('campana', 'Avisame cuando llegue', sr) + '</a>';
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
            '<a class="brand" href="index.html"><span class="logo">' + esc(NEGOCIO) + '</span></a>' +
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

  function htmlFooter() {
    return '<footer class="footer">' +
      '<div class="wrap footer__inner">' +
        '<p class="footer__brand"><span class="logo">' + esc(NEGOCIO) + '</span></p>' +
        // DIRECCIÓN PROVISORIA - confirmar con el cliente antes de publicar
        // (sale de la constante DIRECCION, arriba de este archivo)
        '<p class="footer__nota">' + esc(DIRECCION) + ' · Envíos a ciudades vecinas</p>' +
        '<div class="footer__redes" id="footerRedes"></div>' +
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

        '<ol class="pasos" id="pasosCarrito" aria-label="Pasos de la compra">' +
          htmlPasoCarrito(1, 'Carrito', true) +
          htmlPasoCarrito(2, 'Datos', false) +
          htmlPasoCarrito(3, 'WhatsApp', false) +
        '</ol>' +

        '<div class="drawer__body">' +
          '<div class="carrito-lista" id="carritoLista"><div id="carritoItems"></div></div>' +

          '<form class="form-entrega" id="formEntrega" novalidate hidden>' +
            '<button class="form-entrega__volver" type="button" id="volverAlCarrito">' +
              icono('volver') + 'Volver al carrito' +
            '</button>' +

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
              '<input class="input" type="text" id="entregaDireccion" name="direccion" placeholder="Calle, número, piso, ciudad, CP" autocomplete="street-address">' +
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

            '<button class="btn btn--bloque" type="submit">' +
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
            '<p class="form-entrega__privacidad">Tus datos se envían sólo por WhatsApp, no se guardan en el sitio.</p>' +
          '</form>' +
        '</div>' +

        '<div class="drawer__foot" id="pieCarrito">' +
          '<div class="drawer__anclado">' +
            '<div class="drawer__total">' +
              '<span>Total</span>' +
              '<strong class="precio precio--total" id="carritoTotal">$ 0</strong>' +
            '</div>' +
            '<button class="btn btn--bloque" type="button" id="pedirWhatsapp">' +
              btnPartes('flecha', 'Continuar') +
            '</button>' +
          '</div>' +
          '<button class="btn-plano" type="button" id="vaciarCarrito">Vaciar carrito</button>' +
        '</div>' +
      '</aside>';
  }

  // Botón circular fijo abajo a la derecha, en las seis páginas. Su
  // z-index (30) queda por debajo del header, del velo, del drawer y del
  // modal, así que nunca se dibuja encima de una capa abierta; además se
  // oculta del todo mientras haya alguna (ver ocultarWhatsappFlotante).
  function htmlBotonWhatsapp() {
    return '<a class="wa-flotante" id="waFlotante" href="' + urlWhatsapp(MENSAJE_CONSULTA) + '" ' +
           'target="_blank" rel="noopener" ' +
           'aria-label="Escribinos por WhatsApp">' + icono('whatsapp') + '</a>';
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
  document.body.insertAdjacentHTML('beforeend', htmlDrawer() + htmlModal() + htmlBotonWhatsapp());

  /* ---------------------------- CARGA DE DATOS ---------------------- */

  // La grilla sólo existe en las páginas de catálogo; en la portada no
  // hay catálogo, así que tampoco hay esqueletos que mostrar.
  if (!esInicio) montarPaginaCatalogo();

  hidratarIconos();
  pintarRedes();
  // Estas tres son contenido estático de la portada: se pintan de una y
  // siguen ahí aunque el fetch de productos falle.
  if (esInicio) {
    pintarPagos();
    pintarFaq();
    pintarRedesContacto();
  }

  fetch('productos.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      productos = data;
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
        media(p, '', badgeStock(p), true) +
        '<div>' +
          '<h2 class="destacado-card__nombre">' + esc(p.nombre) + '</h2>' +
          '<p class="destacado-card__specs">' + esc((p.specs || []).join(' · ')) + '</p>' +
        '</div>' +
        '<div class="destacado-card__fila">' +
          bloquePrecios(p) +
        '</div>' +
        botonAccion(p, 'btn--bloque') +
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
               media(p, '', badgeStock(p), true) +
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
                 botonAccion(p, 'btn--bloque') +
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
            '<div class="buscador" id="buscador" data-abierto="false">' +
              '<button class="buscador__lupa" type="button" id="buscadorToggle" ' +
                      'aria-expanded="false" aria-controls="busqueda" aria-label="Buscar productos">' +
                icono('lupa') +
              '</button>' +
              '<input class="buscador__campo" id="busqueda" type="search" placeholder="Buscar equipo…" ' +
                     'aria-label="Buscar productos por nombre" tabindex="-1" autocomplete="off">' +
            '</div>' +
          '</div>' +
          '<div class="secciones" id="catalogoSecciones" aria-live="polite"></div>' +
          '<div id="catalogoVacio" hidden></div>' +
        '</div>' +
      '</section>';

    pintarEsqueletos();
    iniciarBuscador();
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
      pintarCatalogo();
    });

    campoBusqueda.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrarBuscador(true);
    });
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
             media(p, '', badgeStock(p)) +
             '<div>' +
               '<p class="card__cat">' + esc(p.categoria) + '</p>' +
               '<h4 class="card__nombre">' +
                 '<button class="card__abrir" type="button" data-modal="' + esc(p.id) + '">' +
                   '<span class="card__nombre-txt">' + esc(p.nombre) + '</span>' +
                 '</button>' +
               '</h4>' +
             '</div>' +
             bloquePrecios(p) +
             botonAccion(p, 'btn--bloque', 'Agregar') +
             botonComparar(p) +
           '</article>';
  }

  // Tarjeta principal: ocupa el doble de alto en la primera columna.
  // Mantiene las specs y el botón con el texto completo.
  function tarjetaPrincipal(p) {
    return '<article class="card card--principal' + (hayStock(p) ? '' : ' card--agotado') + '">' +
             media(p, 'media--principal', badgeStock(p)) +
             '<div>' +
               '<p class="card__cat">' + esc(p.categoria) + '</p>' +
               '<h4 class="card__nombre">' +
                 '<button class="card__abrir" type="button" data-modal="' + esc(p.id) + '">' +
                   esc(p.nombre) +
                 '</button>' +
               '</h4>' +
             '</div>' +
             '<p class="card__specs">' + esc((p.specs || []).join(' · ')) + '</p>' +
             bloquePrecios(p) +
             botonAccion(p, 'btn--bloque') +
             botonComparar(p) +
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
      if (!busqueda) return true;
      return normalizar(p.nombre).indexOf(normalizar(busqueda)) !== -1;
    });
  }

  // Una sección con su grilla (principal + resto). El encabezado se
  // omite sólo cuando la página tiene una sección única (iPhone, Mac,
  // iPad): ahí repetiría el título de la página.
  function seccionGrilla(titulo, lista, idAncla, conEncabezado, categoria) {
    var principal = elegirPrincipal(lista, titulo);
    var resto = lista.filter(function (p) { return p !== principal; });

    var encabezado = conEncabezado
      ? '<header class="cat__head">' +
          '<h2 class="cat__titulo" id="tit-' + esc(idAncla) + '">' + esc(titulo) + '</h2>' +
          '<p class="cat__conteo">' + conteo(categoria, lista.length) + '</p>' +
        '</header>'
      : '';

    return '<section class="cat" id="' + esc(idAncla) + '"' +
             (conEncabezado ? ' aria-labelledby="tit-' + esc(idAncla) + '"' : '') + '>' +
             encabezado +
             '<div class="grilla">' +
               tarjetaPrincipal(principal) +
               resto.map(tarjeta).join('') +
             '</div>' +
           '</section>';
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
        html += seccionGrilla(c, deLaCat, slug(c), conEncabezado, c);
        return;
      }

      // Las subcategorías siempre llevan encabezado: son varias secciones
      // dentro de la misma categoría.
      subs.forEach(function (sub) {
        var deLaSub = deLaCat.filter(function (p) { return p.subcategoria === sub; });
        if (deLaSub.length) html += seccionGrilla(sub, deLaSub, slug(sub), true, c);
      });

      // Un accesorio sin subcategoría quedaría fuera de todas las
      // secciones: va al final, agrupado, en vez de desaparecer.
      var sueltos = deLaCat.filter(function (p) { return !p.subcategoria; });
      if (sueltos.length) html += seccionGrilla('Otros', sueltos, slug(c) + '-otros', true, c);
    });

    $('#catalogoSecciones').innerHTML = html;
    $('#conteoCategoria').textContent = conteoPagina(lista.length) +
      (busqueda ? ' que coinciden con la búsqueda' : ' · precios finales en pesos');

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

    var titulo = busqueda
      ? 'Ningún resultado para “' + esc(busqueda) + '”'
      : 'Todavía no hay productos en esta sección';
    var salida = busqueda ? 'Probá con otro nombre o ' : 'Mirá otra categoría en el menú o ';

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

  function revelarTarjetas() {
    var grillas = $('#catalogoSecciones').querySelectorAll('.grilla');

    // Sin observer, sin movimiento, o ya re-pintando (filtro/búsqueda):
    // el usuario ya está mirando el catálogo, no corresponde escalonar.
    if (!observador || sinMovimiento() || !primeraPintada) {
      Array.prototype.forEach.call($('#catalogoSecciones').querySelectorAll('.card'), function (c) {
        c.classList.add('is-visible');
      });
      primeraPintada = false;
      return;
    }

    Array.prototype.forEach.call(grillas, function (g) {
      // el delay se reinicia en cada sección y se corta a 500ms
      Array.prototype.forEach.call(g.children, function (card, i) {
        card.style.setProperty('--delay', Math.min(i * 60, 500) + 'ms');
        observador.observe(card);
      });
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
  function iniciarComparador() {
    selectA = $('#compararA');
    selectB = $('#compararB');
    if (!selectA) return;

    selectA.addEventListener('change', function () {
      comparadorA = this.value || null;
      actualizarDisponibilidadComparador();
      pintarComparador();
    });
    selectB.addEventListener('change', function () {
      comparadorB = this.value || null;
      actualizarDisponibilidadComparador();
      pintarComparador();
    });

    $('#compararLimpiar').addEventListener('click', function () {
      comparadorA = null;
      comparadorB = null;
      selectA.value = '';
      selectB.value = '';
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
    var optgroups = categoriasConProductos().map(function (c) {
      var lista = productos.filter(function (p) { return p.categoria === c; });
      if (!lista.length) return '';
      return '<optgroup label="' + esc(c) + '">' + lista.map(function (p) {
        return '<option value="' + esc(p.id) + '">' + esc(p.nombre) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');

    var base = '<option value="">Elegir producto…</option>' + optgroups;
    selectA.innerHTML = base;
    selectB.innerHTML = base;
    selectA.value = comparadorA || '';
    selectB.value = comparadorB || '';
    actualizarDisponibilidadComparador();
  }

  // No tiene sentido comparar un producto consigo mismo: la opción ya
  // elegida en una columna se deshabilita en la otra (la opción vacía
  // nunca se toca). Se llama después de cualquier cambio de estado.
  function actualizarDisponibilidadComparador() {
    deshabilitarOpcion(selectA, comparadorB);
    deshabilitarOpcion(selectB, comparadorA);
  }

  function deshabilitarOpcion(select, idADeshabilitar) {
    Array.prototype.forEach.call(select.options, function (opt) {
      opt.disabled = opt.value !== '' && opt.value === idADeshabilitar;
    });
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

      selectA.value = comparadorA || '';
      selectB.value = comparadorB || '';
      actualizarDisponibilidadComparador();
      pintarComparador();
    }

    $('#comparar').scrollIntoView({ block: 'start' });
  }

  /* --------------------------- MODAL PRODUCTO ----------------------- */

  var modal = $('#modalProducto');
  var overlayModal = $('#overlayModal');
  var ultimoFocoModal = null;

  function contenidoModal(p) {
    var d = p.detalle || {};
    var filas = Object.keys(d).map(function (k) {
      return '<div class="detalle__fila"><dt>' + esc(k) + '</dt><dd>' + esc(d[k]) + '</dd></div>';
    }).join('');

    var anterior = p.precioAnterior
      ? '<span class="precio--anterior">' + precio(p.precioAnterior) + '</span>'
      : '';

    var primario = hayStock(p)
      ? '<button class="btn btn--bloque" type="button" data-agregar="' + esc(p.id) + '">' +
        btnPartes('carrito', 'Agregar al carrito') + '</button>'
      : '<a class="btn btn--sec btn--bloque" href="' + urlWhatsapp(msgAviso(p)) + '" ' +
        'target="_blank" rel="noopener">' + btnPartes('campana', 'Avisame cuando llegue') + '</a>';

    return media(p, '', badgeStock(p)) +
      '<p class="modal__cat">' + esc(p.categoria) + '</p>' +
      '<h2 class="modal__nombre" id="modalNombre">' + esc(p.nombre) + '</h2>' +
      '<p class="modal__precios">' +
        '<span class="precio">' + precio(p.precio) + '</span>' + anterior +
      '</p>' +
      (hayStock(p) ? '' : '<p class="modal__agotado">Sin stock por ahora. Dejanos tu mensaje y te avisamos apenas entre.</p>') +
      (filas ? '<dl class="detalle">' + filas + '</dl>' : '') +
      '<div class="modal__acciones">' +
        '<a class="btn btn--sec btn--bloque" href="' + urlWhatsapp(msgConsulta(p)) + '" ' +
        'target="_blank" rel="noopener">' + btnPartes('whatsapp', 'Consultar por WhatsApp') + '</a>' +
        '<button class="btn btn--sec btn--bloque" type="button" data-compartir="' + esc(p.id) + '">' +
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

  function abrirModal(id, disparador) {
    var p = buscarProducto(id);
    if (!p) return;

    ultimoFocoModal = disparador || document.activeElement;
    $('#modalContenido').innerHTML = contenidoModal(p);

    modal.hidden = false;
    overlayModal.hidden = false;
    void modal.offsetWidth;           // fuerza reflow para que se vea la entrada
    modal.dataset.visible = 'true';
    overlayModal.dataset.visible = 'true';
    bloquearScroll();
    $('#modalCerrar').focus();
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

  function buscarProducto(id) {
    for (var i = 0; i < productos.length; i++) {
      if (productos[i].id === id) return productos[i];
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

  function pintarCarrito() {
    var ls = lineas();
    var cont = $('#carritoItems');

    if (!ls.length) {
      // [31] carrito vacío
      cont.innerHTML =
        '<div class="carrito-vacio">' +
          icono('carrito', 'ico--grande') +
          '<p class="carrito-vacio__texto">Todavía no agregaste nada</p>' +
          '<a class="enlace link-sub" href="#destacados" data-ir-destacados>Ver los destacados</a>' +
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
                     '<p class="linea__nombre">' + esc(p.nombre) + '</p>' +
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
    $('#abrirCarrito').dataset.lleno = n > 0 ? 'true' : 'false';
    $('#carritoTotal').textContent = precio(total());
    $('#pedirWhatsapp').disabled = n === 0;

    actualizarFade();
    actualizarEnlacesWhatsapp();
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

    var irDestacados = e.target.closest('[data-ir-destacados]');
    if (irDestacados) cerrarDrawer();
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
  var overlay = $('#overlayCarrito');
  var ultimoFoco = null;

  // El botón flotante de WhatsApp se esconde mientras hay una capa
  // abierta: aunque su z-index ya lo deja por debajo, con el velo puesto
  // seguiría siendo clickeable y compite con las acciones del carrito.
  function ocultarWhatsappFlotante(ocultar) {
    var fab = $('#waFlotante');
    if (fab) fab.hidden = ocultar;
  }

  function bloquearScroll() {
    document.body.style.overflow = 'hidden';
    ocultarWhatsappFlotante(true);
  }

  function liberarScroll() {
    // sólo se libera si no queda ninguna capa abierta
    if (drawer.hidden && modal.hidden) {
      document.body.style.overflow = '';
      ocultarWhatsappFlotante(false);
    }
  }

  function abrirDrawer() {
    ultimoFoco = document.activeElement;
    mostrarVistaCarrito(false);      // siempre arranca en la lista, no en el checkout
    drawer.hidden = false;
    overlay.hidden = false;
    void drawer.offsetWidth;
    drawer.dataset.visible = 'true';
    overlay.dataset.visible = 'true';
    bloquearScroll();
    actualizarFade();                // recién ahora la lista tiene altura real
    $('#cerrarCarrito').focus();
  }

  function cerrarDrawer() {
    if (drawer.hidden) return;
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
    // el modal está por encima del drawer: se atiende primero
    var capa = !modal.hidden ? modal : (!drawer.hidden ? drawer : null);
    if (!capa) return;

    if (e.key === 'Escape') {
      if (capa === modal) cerrarModal();
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

  // Líneas del pedido en texto plano, reutilizadas por el mensaje final.
  function lineasPedidoTexto() {
    return lineas().map(function (l) {
      return '• ' + l.cantidad + 'x ' + l.producto.nombre +
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

  // Cualquier tecleo o cambio de opción guarda: no hace falta esperar al envío.
  formEntrega.addEventListener('input', guardarDatosEntrega);
  formEntrega.addEventListener('change', guardarDatosEntrega);

  aplicarDatosGuardados();

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

  function mostrarVistaCheckout() {
    $('#carritoLista').hidden = true;
    $('#pieCarrito').hidden = true;
    formEntrega.hidden = false;
    marcarPaso(2);
    $('#formEntregaTitulo').focus();
  }

  // `enfocar:false` la usa abrirDrawer(), que ya mueve el foco por su cuenta.
  function mostrarVistaCarrito(enfocar) {
    formEntrega.hidden = true;
    $('#carritoLista').hidden = false;
    $('#pieCarrito').hidden = false;
    marcarPaso(1);
    if (enfocar !== false) $('#pedirWhatsapp').focus();
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

  // Ícono de Instagram solo: lo usan tanto el footer como cualquier lugar
  // de "contacto general" donde tenga que verse junto al WhatsApp
  // (ver pintarRedesContacto). Nunca en los WhatsApp de un paso concreto
  // de la compra (confirmar pedido, consultar un producto, avisar stock).
  function enlaceInstagram() {
    if (esPlaceholder(CONTACTO.instagram)) return '';
    return '<a class="red-link" href="https://instagram.com/' + encodeURIComponent(CONTACTO.instagram) + '" ' +
           'target="_blank" rel="noopener" aria-label="Instagram de ' + esc(NEGOCIO) + '">' + icono('instagram') + '</a>';
  }

  // Correo: sólo si dejó de ser placeholder.
  function enlaceCorreo() {
    if (esPlaceholder(CONTACTO.email)) return '';
    return '<a class="red-link" href="mailto:' + esc(CONTACTO.email) + '" ' +
           'aria-label="Enviar un correo a ' + esc(NEGOCIO) + '">' + icono('correo') + '</a>';
  }

  function pintarRedes() {
    var enlaces = [];

    if (!esPlaceholder(CONTACTO.whatsapp)) {
      enlaces.push(
        '<a class="red-link" href="' + urlWhatsapp(MENSAJE_CONSULTA) + '" target="_blank" rel="noopener" ' +
        'aria-label="WhatsApp de ' + esc(NEGOCIO) + '">' + icono('whatsapp') + '</a>'
      );
    }

    var insta = enlaceInstagram();
    if (insta) enlaces.push(insta);

    var correo = enlaceCorreo();
    if (correo) enlaces.push(correo);

    $('#footerRedes').innerHTML = enlaces.join('');
  }

  // Botón de Instagram con el mismo tratamiento de bloque que el resto de
  // los botones del sitio (a diferencia de enlaceInstagram(), que es el
  // ícono circular chico del footer/hero/FAQ). Placeholder sin reemplazar
  // => no se renderiza, igual que el resto de los enlaces de CONTACTO.
  function botonInstagram(clase) {
    if (esPlaceholder(CONTACTO.instagram)) return '';
    return '<a class="btn ' + (clase || '') + '" href="https://instagram.com/' + encodeURIComponent(CONTACTO.instagram) + '" ' +
           'target="_blank" rel="noopener">' + btnPartes('instagram', 'Seguinos en Instagram') + '</a>';
  }

  // Instagram al lado de los WhatsApp de "contacto general" (hero y FAQ:
  // ícono chico). La sección de Contacto usa el botón completo en vez del
  // ícono circular. Si Instagram está en placeholder, ambos quedan vacíos.
  function pintarRedesContacto() {
    var insta = enlaceInstagram();
    $('#instaHero').innerHTML = insta;
    $('#instaFaq').innerHTML = insta;
    $('#ctaInstagramWrap').innerHTML = botonInstagram('btn--sec');
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
