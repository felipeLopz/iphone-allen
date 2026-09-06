/* =====================================================================
   IPHONE ALLEN — panel de administración
   =====================================================================
   Sólo lo carga adminweb.html. El sitio público NO lo incluye: las seis
   páginas siguen cargando únicamente app.js.

   QUÉ HACE ESTA VERSIÓN
     · Login con correo y contraseña contra Supabase Auth.
     · Lista los productos como los ve un comprador (misma tarjeta, mismo
       styles.css) y deja editarlos.
     · Guarda con PATCH a la API REST usando el token de la sesión.

   QUÉ NO HACE TODAVÍA (viene después)
     · Crear productos, borrarlos, subir fotos, editar combos.

   SIN SDK Y SIN BUILD: todo con fetch a las APIs REST de Supabase, igual
   que app.js. El proyecto sigue siendo HTML/CSS/JS a secas.
   ================================================================== */

(function () {
  'use strict';

  /* ------------------------- CONFIGURACIÓN ------------------------- */

  // Los mismos dos valores que ya usa app.js. La clave "publishable" es
  // PÚBLICA POR DISEÑO: sirve para identificar el proyecto y, por sí
  // sola, sólo permite LEER (lo dicen las políticas RLS de la base).
  // Para ESCRIBIR, este panel manda el token del usuario que inició
  // sesión, y Postgres lo exige. Ver el comentario largo de adminweb.html.
  var SUPABASE_URL = 'https://jdnvzwkwfvcxxtledwxu.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_9nnRLVYwrdMoLPrB4ukY4A_3WrEZFXt';

  // Dónde se guarda la sesión para no tener que loguearse en cada
  // recarga. Guarda el access_token (corto, ~1 h) y el refresh_token
  // (largo), que es con el que se pide uno nuevo cuando el primero vence.
  var SESION_KEY = 'admin-sesion-v1';

  // Se renueva el token un minuto ANTES de que venza, para que nunca
  // llegue vencido a mitad de un guardado.
  var MARGEN_RENOVACION_MS = 60 * 1000;

  /* ---------------------------- UTILIDADES -------------------------
     esc() es la MISMA de app.js, con los cinco caracteres. Todo dato
     que venga de la base pasa por acá antes de entrar a un innerHTML.
     ------------------------------------------------------------------ */

  var $ = function (sel) { return document.querySelector(sel); };

  function esc(txt) {
    return String(txt)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var pesos = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  });
  function precio(v) { return pesos.format(v); }

  function normalizarTexto(t) {
    return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* ==================================================================
     CONSTANTES ESPEJADAS DE app.js
     ------------------------------------------------------------------
     OJO: estas listas TIENEN QUE COINCIDIR con las de app.js. Están
     duplicadas a propósito y no compartidas en un archivo común: hacerlo
     obligaría a sumar un <script> a las seis páginas del sitio público,
     y la consigna era no tocarlo. Son pocas y estables; si alguna vez
     cambian allá, hay que cambiarlas acá.
     ================================================================== */

  var ORDEN_CATEGORIAS = ['iPhone', 'Mac', 'iPad', 'Accesorios'];
  var STOCK_BAJO = 5;
  var ETIQUETAS = { nuevo: 'Nuevo ingreso', oferta: 'Oferta' };
  var ESTADO_ETIQUETAS = {
    bateria: 'Batería', pantalla: 'Pantalla', carcasa: 'Carcasa',
    uso: 'Tiempo de uso', reparaciones: 'Reparaciones', accesorios: 'Accesorios'
  };
  var ESTADO_ORDEN = ['bateria', 'pantalla', 'carcasa', 'uso', 'reparaciones', 'accesorios'];

  // El mismo mapa snake_case <-> camelCase de app.js (CAMPOS_RENOMBRADOS),
  // acá usado en LOS DOS SENTIDOS: para leer y para guardar.
  var A_CAMEL = { precio_anterior: 'precioAnterior', equivale_nuevo: 'equivaleNuevo' };
  var A_SNAKE = { precioAnterior: 'precio_anterior', equivaleNuevo: 'equivale_nuevo' };

  // Columnas de la base que el panel no edita ni muestra.
  var COLUMNAS_INTERNAS = ['creado_en', 'actualizado_en', 'orden'];

  /* ---------------------- ESTADO EN MEMORIA ------------------------ */

  var sesion = null;        // { access_token, refresh_token, expires_at, email }
  var productos = [];       // normalizados a camelCase, como en app.js
  var editando = null;      // copia de trabajo del producto abierto
  var editandoOriginal = null;
  var filtroCategoria = 'todas';
  var busqueda = '';
  var temporizadorRenovacion = null;

  var resenas = [];             // todas las reseñas (el panel ve todo)
  var filtroResena = 'pendiente';
  // Orden y etiquetas de los estados. Pendientes primero, que es lo que
  // el cliente tiene que atender.
  var ESTADOS_RESENA = [
    { valor: 'pendiente', texto: 'Pendientes' },
    { valor: 'aprobada',  texto: 'Aprobadas' },
    { valor: 'rechazada', texto: 'Rechazadas' }
  ];

  /* ==================================================================
     1. SESIÓN
     ------------------------------------------------------------------
     Supabase Auth (GoTrue) por REST:
       POST /auth/v1/token?grant_type=password       -> iniciar sesión
       POST /auth/v1/token?grant_type=refresh_token  -> renovar
       POST /auth/v1/logout                          -> cerrar
     ================================================================== */

  function leerSesion() {
    try {
      var crudo = localStorage.getItem(SESION_KEY);
      return crudo ? JSON.parse(crudo) : null;
    } catch (e) { return null; }
  }

  function guardarSesion(s) {
    sesion = s;
    try {
      if (s) localStorage.setItem(SESION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESION_KEY);
    } catch (e) {
      console.warn('[admin] no se pudo guardar la sesión:', e);
    }
    programarRenovacion();
  }

  // La respuesta de Supabase trae expires_in (segundos). Se guarda el
  // instante absoluto de vencimiento, que es lo único que sirve después
  // de una recarga.
  function desdeRespuestaAuth(data) {
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (Number(data.expires_in) || 3600) * 1000,
      email: (data.user && data.user.email) || ''
    };
  }

  function iniciarSesion(email, password) {
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email, password: password })
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) {
          // Supabase manda el motivo en error_description o msg.
          var motivo = data.error_description || data.msg || data.message || ('HTTP ' + r.status);
          throw new Error(motivo);
        }
        return desdeRespuestaAuth(data);
      });
    });
  }

  function renovarSesion() {
    if (!sesion || !sesion.refresh_token) return Promise.reject(new Error('sin sesión'));
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: sesion.refresh_token })
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) throw new Error(data.error_description || data.msg || ('HTTP ' + r.status));
        guardarSesion(desdeRespuestaAuth(data));
        console.info('[admin] token renovado.');
        return sesion;
      });
    });
  }

  // Deja programada la renovación un minuto antes del vencimiento. Si la
  // pestaña queda abierta horas, el token se renueva solo y el usuario
  // nunca ve un "sesión expirada" a mitad de una edición.
  function programarRenovacion() {
    if (temporizadorRenovacion) clearTimeout(temporizadorRenovacion);
    if (!sesion) return;
    var falta = sesion.expires_at - Date.now() - MARGEN_RENOVACION_MS;
    temporizadorRenovacion = setTimeout(function () {
      renovarSesion().catch(function (err) {
        console.warn('[admin] no se pudo renovar la sesión:', err.message);
        cerrarSesion(true);
      });
    }, Math.max(falta, 5000));
  }

  // Devuelve un token seguro de usar: si está por vencer, lo renueva
  // ANTES de que salga el pedido. Cada llamada a la base pasa por acá.
  function tokenVigente() {
    if (!sesion) return Promise.reject(new Error('sin sesión'));
    if (sesion.expires_at - Date.now() > MARGEN_RENOVACION_MS) {
      return Promise.resolve(sesion.access_token);
    }
    return renovarSesion().then(function (s) { return s.access_token; });
  }

  function cerrarSesion(porVencimiento) {
    var token = sesion && sesion.access_token;
    guardarSesion(null);
    productos = [];
    // Se vacía también lo YA DIBUJADO, no sólo la variable: si no, las
    // tarjetas quedan en el DOM (ocultas, pero ahí) después de salir.
    if (!$('#editor').hidden) cerrarEditor();
    $('#panelSecciones').innerHTML = '';
    $('#filtrosCat').innerHTML = '';
    $('#panelConteo').textContent = '';
    filtroCategoria = 'todas';
    busqueda = '';
    $('#buscador').value = '';
    // Reseñas: misma limpieza, para no dejar datos de un usuario en el DOM
    resenas = [];
    filtroResena = 'pendiente';
    $('#resenasPanel').innerHTML = '';
    $('#filtrosResena').innerHTML = '';
    $('#resenasConteo').textContent = '';
    var badge = $('#badgePendientes');
    if (badge) { badge.textContent = '0'; badge.hidden = true; }
    mostrarVista('productos');
    mostrarLogin(porVencimiento
      ? 'Tu sesión venció. Entrá de nuevo.'
      : '');
    if (token) {
      // Best effort: si falla, la sesión local ya se borró igual.
      fetch(SUPABASE_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token }
      }).catch(function () {});
    }
  }

  /* ==================================================================
     2. DATOS
     ================================================================== */

  // Fila de Postgres -> objeto con la forma que usa el sitio.
  // Es la misma conversión que normalizarProducto() de app.js.
  function aCamel(fila) {
    var p = {};
    Object.keys(fila).forEach(function (k) {
      if (COLUMNAS_INTERNAS.indexOf(k) !== -1) return;
      var v = fila[k];
      if (v === null) return;                 // null => campo ausente
      p[A_CAMEL[k] || k] = v;
    });
    if (!Array.isArray(p.specs)) p.specs = p.specs ? [].concat(p.specs) : [];
    return p;
  }

  // El camino inverso: objeto del panel -> columnas de la base.
  // Manda SIEMPRE los mismos campos, con null donde el producto no tiene
  // valor, para que vaciar un campo en el panel lo vacíe de verdad en la
  // base (si se omitiera, PATCH lo dejaría como estaba).
  function aSnake(p) {
    var fila = {};
    ['nombre', 'categoria', 'subcategoria', 'precio', 'precioAnterior', 'stock',
     'specs', 'detalle', 'destacado', 'principal', 'etiqueta', 'condicion',
     'estado', 'anio', 'equivaleNuevo'].forEach(function (k) {
      var v = p[k];
      if (v === undefined || v === '') v = null;
      fila[A_SNAKE[k] || k] = v;
    });
    fila.destacado = !!p.destacado;
    fila.principal = !!p.principal;
    fila.condicion = p.condicion === 'usado' ? 'usado' : 'nuevo';
    return fila;
  }

  function pedirProductos() {
    return tokenVigente().then(function (token) {
      return fetch(SUPABASE_URL + '/rest/v1/productos?select=*&order=orden.asc', {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + token,
          Accept: 'application/json'
        }
      });
    }).then(function (r) {
      if (r.status === 401) throw new Error('sesión-vencida');
      if (!r.ok) throw new Error('No se pudo leer el catálogo (HTTP ' + r.status + ').');
      return r.json();
    }).then(function (filas) {
      return filas.map(aCamel);
    });
  }

  // PATCH de un solo producto. "Prefer: return=representation" hace que
  // Supabase devuelva la fila ya guardada: así el panel se refresca con
  // lo que quedó REALMENTE en la base, no con lo que creíamos mandar.
  function guardarProducto(p) {
    return tokenVigente().then(function (token) {
      return fetch(SUPABASE_URL + '/rest/v1/productos?id=eq.' + encodeURIComponent(p.id), {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(aSnake(p))
      });
    }).then(function (r) {
      return r.text().then(function (texto) {
        if (r.status === 401) throw new Error('Tu sesión venció. Cerrá sesión y volvé a entrar.');
        if (r.status === 403) {
          throw new Error('La base rechazó el cambio: tu usuario no tiene permiso de escritura (RLS).');
        }
        if (!r.ok) {
          var detalle = '';
          try { var j = JSON.parse(texto); detalle = j.message || j.hint || ''; } catch (e) {}
          throw new Error('No se pudo guardar (HTTP ' + r.status + ')' + (detalle ? ': ' + detalle : '') + '.');
        }
        var filas = texto ? JSON.parse(texto) : [];
        if (!filas.length) {
          throw new Error('La base no devolvió el producto guardado. Puede que el id ya no exista.');
        }
        return aCamel(filas[0]);
      });
    });
  }

  /* ==================================================================
     3. LA TARJETA — la misma que ve el comprador
     ------------------------------------------------------------------
     Reproduce tarjeta() de app.js con las mismas clases, para que
     styles.css la dibuje idéntica. Lo único que cambia es el botón: en
     la tienda dice "Agregar al carrito", acá "Editar".
     ================================================================== */

  function esUsado(p) { return p.condicion === 'usado'; }
  function hayStock(p) { return p.stock === undefined || p.stock === null || p.stock > 0; }
  function rutaImagen(p) { return p.imagen || ('img/' + p.id + '.jpg'); }

  function htmlStock(p) {
    if (!hayStock(p)) return '<p class="stock" aria-hidden="true"></p>';
    var n = p.stock;
    var sinDato = n === undefined || n === null;
    if (!sinDato && n <= STOCK_BAJO) {
      var texto = n === 1 ? '¡Última unidad!' : '¡Últimas ' + n + ' unidades!';
      return '<p class="stock stock--bajo">' + esc(texto) + '</p>';
    }
    return '<p class="stock">Disponible</p>';
  }

  function resumenEstado(p) {
    var e = p.estado || {};
    var partes = [];
    if (typeof e.bateria === 'number') partes.push('Batería ' + e.bateria + '%');
    if (e.pantalla) partes.push(String(e.pantalla));
    else if (e.carcasa) partes.push(String(e.carcasa));
    return partes;
  }

  function descripcionCorta(p) {
    var partes = (p.specs || []).slice();
    if (esUsado(p)) {
      var r = resumenEstado(p);
      if (r.length) partes = partes.slice(0, 2).concat(r);
    }
    return '<p class="card__specs">' + esc(partes.join(' · ')) + '</p>';
  }

  function marcasSobreFoto(p) {
    var txt = ETIQUETAS[p.etiqueta];
    var izq = (txt ? '<span class="etiqueta etiqueta--' + esc(p.etiqueta) + '">' + esc(txt) + '</span>' : '') +
              (esUsado(p) ? '<span class="etiqueta etiqueta--usado">Usado</span>' : '');
    return (izq ? '<div class="marcas">' + izq + '</div>' : '') +
           (hayStock(p) ? '' : '<span class="badge-stock">Sin stock</span>');
  }

  function bloquePrecios(p) {
    var ant = p.precioAnterior
      ? '<span class="precio--anterior">' + precio(p.precioAnterior) + '</span>' : '';
    return '<div class="card__precios">' + ant +
           '<span class="precio">' + precio(p.precio || 0) + '</span></div>';
  }

  // Igual que app.js: la línea se pinta SIEMPRE (vacía si no hay nada que
  // comparar) porque su alto está reservado y es lo que mantiene todas
  // las tarjetas midiendo lo mismo.
  function lineaAhorro(p) {
    var nuevo = null;
    if (esUsado(p) && p.equivaleNuevo) {
      for (var i = 0; i < productos.length; i++) {
        if (productos[i].id === p.equivaleNuevo) { nuevo = productos[i]; break; }
      }
    }
    if (!nuevo || esUsado(nuevo) || !(nuevo.precio > p.precio)) {
      return '<p class="card__ahorro" aria-hidden="true"></p>';
    }
    return '<p class="card__ahorro">' +
             '<span class="card__ahorro-nuevo">Nuevo ' + precio(nuevo.precio) + '</span>' +
             '<span class="card__ahorro-sep" aria-hidden="true"> · </span>' +
             '<strong class="card__ahorro-monto">Ahorrás ' + precio(nuevo.precio - p.precio) + '</strong>' +
           '</p>';
  }

  // `previa` = true para la tarjeta del editor: ahí no va el botón de
  // editar (ya estás editando) ni el data-editar.
  function tarjeta(p, previa) {
    var accion = previa
      ? '<span class="btn btn--sec btn--compacto admin-card__fantasma" aria-hidden="true">' +
          '<span class="btn__ico" data-ico="lista"></span><span class="btn__txt">Vista previa</span>' +
        '</span>'
      : '<button class="btn btn--compacto" type="button" data-editar="' + esc(p.id) + '">' +
          '<span class="btn__ico" data-ico="lista"></span>' +
          '<span class="btn__txt">Editar<span class="sr-only"> — ' + esc(p.nombre) + '</span></span>' +
        '</button>';

    return '<article class="card' + (hayStock(p) ? '' : ' card--agotado') + ' is-visible">' +
             '<div class="media">' +
               '<img class="media__img" src="' + esc(rutaImagen(p)) + '" alt="' + esc(p.nombre) + '" loading="lazy">' +
               marcasSobreFoto(p) +
             '</div>' +
             '<div>' +
               '<p class="card__cat">' + esc(p.categoria || '') + '</p>' +
               '<h3 class="card__nombre"><span class="card__nombre-txt">' + esc(p.nombre || '') + '</span></h3>' +
               descripcionCorta(p) +
             '</div>' +
             bloquePrecios(p) +
             lineaAhorro(p) +
             htmlStock(p) +
             '<div class="card__acciones">' + accion + '</div>' +
           '</article>';
  }

  /* ==================================================================
     4. LA GRILLA DEL PANEL
     ================================================================== */

  function categoriasPresentes() {
    var vistas = [];
    productos.forEach(function (p) {
      if (p.categoria && vistas.indexOf(p.categoria) === -1) vistas.push(p.categoria);
    });
    // el orden fijo del sitio primero, y las nuevas al final
    return ORDEN_CATEGORIAS.filter(function (c) { return vistas.indexOf(c) !== -1; })
      .concat(vistas.filter(function (c) { return ORDEN_CATEGORIAS.indexOf(c) === -1; }));
  }

  function visibles() {
    var q = normalizarTexto(busqueda.trim());
    return productos.filter(function (p) {
      if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false;
      if (!q) return true;
      return normalizarTexto(p.nombre).indexOf(q) !== -1 ||
             normalizarTexto(p.id).indexOf(q) !== -1;
    });
  }

  function pintarFiltros() {
    var cats = ['todas'].concat(categoriasPresentes());
    $('#filtrosCat').innerHTML = cats.map(function (c) {
      var activa = c === filtroCategoria;
      return '<button class="filtro" type="button" data-cat="' + esc(c) + '"' +
             (activa ? ' aria-current="true"' : '') + '>' +
             esc(c === 'todas' ? 'Todas' : c) + '</button>';
    }).join('');
  }

  function pintarGrilla() {
    var lista = visibles();
    var cont = $('#panelSecciones');
    var vacio = $('#panelVacio');

    $('#panelConteo').textContent = productos.length + ' producto' +
      (productos.length === 1 ? '' : 's') + ' en el catálogo' +
      (lista.length !== productos.length ? ' · ' + lista.length + ' en pantalla' : '');

    if (!lista.length) {
      cont.innerHTML = '';
      vacio.hidden = false;
      vacio.textContent = busqueda
        ? 'Ningún producto coincide con “' + busqueda + '”.'
        : 'No hay productos en esta categoría.';
      return;
    }
    vacio.hidden = true;

    // Agrupado por categoría, con el mismo encabezado que el catálogo
    var html = '';
    categoriasPresentes().forEach(function (cat) {
      var deLaCat = lista.filter(function (p) { return p.categoria === cat; });
      if (!deLaCat.length) return;
      html += '<section class="cat">' +
                '<header class="cat__head">' +
                  '<h2 class="cat__titulo">' + esc(cat) + '</h2>' +
                  '<p class="cat__conteo">' + deLaCat.length + ' producto' +
                    (deLaCat.length === 1 ? '' : 's') + '</p>' +
                '</header>' +
                '<div class="grilla grilla--uniforme">' +
                  deLaCat.map(function (p) { return tarjeta(p, false); }).join('') +
                '</div>' +
              '</section>';
    });
    // productos con una categoría vacía o rara no se pierden
    var huerfanos = lista.filter(function (p) { return categoriasPresentes().indexOf(p.categoria) === -1; });
    if (huerfanos.length) {
      html += '<section class="cat"><header class="cat__head">' +
              '<h2 class="cat__titulo">Sin categoría</h2></header>' +
              '<div class="grilla grilla--uniforme">' +
              huerfanos.map(function (p) { return tarjeta(p, false); }).join('') + '</div></section>';
    }
    cont.innerHTML = html;
    hidratarIconos(cont);
  }

  /* ==================================================================
     5. EL EDITOR
     ================================================================== */

  function buscarProducto(id) {
    for (var i = 0; i < productos.length; i++) if (productos[i].id === id) return productos[i];
    return null;
  }

  // Copia profunda para editar sin tocar el original: si el usuario
  // cancela, alcanza con tirar esta copia.
  function copiar(p) { return JSON.parse(JSON.stringify(p)); }

  function abrirEditor(id) {
    var p = buscarProducto(id);
    if (!p) return;
    editandoOriginal = p;
    editando = copiar(p);
    $('#editorTitulo').textContent = 'Editar: ' + p.nombre;
    pintarCampos();
    refrescarPrevia();
    limpiarAviso();
    $('#editor').hidden = false;
    document.body.classList.add('sin-scroll');
    var primero = $('#campo-nombre');
    if (primero) primero.focus();
  }

  function cerrarEditor() {
    $('#editor').hidden = true;
    document.body.classList.remove('sin-scroll');
    editando = null;
    editandoOriginal = null;
    var vuelve = document.querySelector('[data-editar]');
    if (vuelve) vuelve.focus();
  }

  function campoTexto(id, etiqueta, valor, opciones) {
    opciones = opciones || {};
    return '<div class="campo">' +
             '<label class="campo__label" for="campo-' + id + '">' + esc(etiqueta) +
               (opciones.requerido ? ' <span class="req" aria-hidden="true">*</span>' : '') +
             '</label>' +
             '<input class="input" id="campo-' + id + '" data-campo="' + id + '" ' +
               'type="' + (opciones.tipo || 'text') + '" ' +
               (opciones.inputmode ? 'inputmode="' + opciones.inputmode + '" ' : '') +
               (opciones.placeholder ? 'placeholder="' + esc(opciones.placeholder) + '" ' : '') +
               'value="' + esc(valor === undefined || valor === null ? '' : valor) + '">' +
             (opciones.ayuda ? '<p class="campo__ayuda">' + esc(opciones.ayuda) + '</p>' : '') +
             '<p class="campo__error" id="error-' + id + '" hidden></p>' +
           '</div>';
  }

  function campoCheck(id, etiqueta, valor, ayuda) {
    return '<label class="admin-check">' +
             '<input type="checkbox" data-campo="' + id + '" id="campo-' + id + '"' +
               (valor ? ' checked' : '') + '>' +
             '<span>' + esc(etiqueta) + (ayuda ? ' <small>' + esc(ayuda) + '</small>' : '') + '</span>' +
           '</label>';
  }

  function campoSelect(id, etiqueta, valor, opciones) {
    return '<div class="campo">' +
             '<label class="campo__label" for="campo-' + id + '">' + esc(etiqueta) + '</label>' +
             '<select class="orden__select admin-select" id="campo-' + id + '" data-campo="' + id + '">' +
               opciones.map(function (o) {
                 return '<option value="' + esc(o.valor) + '"' +
                        (String(valor || '') === String(o.valor) ? ' selected' : '') + '>' +
                        esc(o.texto) + '</option>';
               }).join('') +
             '</select>' +
             '<p class="campo__error" id="error-' + id + '" hidden></p>' +
           '</div>';
  }

  function pintarCampos() {
    var p = editando;
    var h = '';

    // ---- lo básico
    h += '<fieldset class="editor__grupo"><legend>Datos del producto</legend>';
    h += '<p class="editor__id">id: <code>' + esc(p.id) + '</code> ' +
         '<small>(no se puede cambiar: es el nombre de la foto y lo usan los combos)</small></p>';
    h += campoTexto('nombre', 'Nombre', p.nombre, { requerido: true });
    h += '<div class="editor__fila">';
    h += campoTexto('categoria', 'Categoría', p.categoria, { requerido: true, ayuda: 'iPhone, Mac, iPad o Accesorios' });
    h += campoTexto('subcategoria', 'Subcategoría', p.subcategoria, { ayuda: 'Sólo Accesorios. Vacío si no aplica.' });
    h += '</div>';
    h += '</fieldset>';

    // ---- precios y stock
    h += '<fieldset class="editor__grupo"><legend>Precio y stock</legend>';
    h += '<div class="editor__fila">';
    h += campoTexto('precio', 'Precio', p.precio, { requerido: true, inputmode: 'numeric', placeholder: 'Ej: 1749000' });
    h += campoTexto('precioAnterior', 'Precio anterior', p.precioAnterior, { inputmode: 'numeric', ayuda: 'Se muestra tachado. Vacío si no hay descuento.' });
    h += '</div>';
    h += campoTexto('stock', 'Stock', p.stock, { inputmode: 'numeric', ayuda: 'Vacío = hay stock. 0 = agotado (se muestra atenuado).' });
    h += '</fieldset>';

    // ---- presentación
    h += '<fieldset class="editor__grupo"><legend>Cómo se muestra</legend>';
    h += campoSelect('etiqueta', 'Etiqueta', p.etiqueta, [
      { valor: '', texto: 'Sin etiqueta' },
      { valor: 'nuevo', texto: 'Nuevo ingreso' },
      { valor: 'oferta', texto: 'Oferta' }
    ]);
    h += campoCheck('destacado', 'Destacado', p.destacado, '(aparece en el carrusel de la portada)');
    h += campoCheck('principal', 'Principal', p.principal, '(tarjeta grande de su sección)');
    h += '</fieldset>';

    // ---- specs
    h += '<fieldset class="editor__grupo"><legend>Specs</legend>';
    h += '<div class="campo">' +
           '<label class="campo__label" for="campo-specs">Una por línea</label>' +
           '<textarea class="input admin-textarea" id="campo-specs" data-campo="specs" rows="4">' +
             esc((p.specs || []).join('\n')) +
           '</textarea>' +
           '<p class="campo__ayuda">Se muestran unidas con · debajo del nombre.</p>' +
         '</div>';
    h += '</fieldset>';

    // ---- detalle (ficha técnica) — EL ORDEN IMPORTA
    h += '<fieldset class="editor__grupo"><legend>Ficha técnica</legend>' +
         '<p class="editor__ayuda-grupo">Se muestra en el detalle del producto, ' +
         'en este mismo orden.</p>';
    var claves = Object.keys(p.detalle || {});
    if (!claves.length) {
      h += '<p class="editor__ayuda-grupo">Este producto no tiene ficha técnica cargada.</p>';
    }
    claves.forEach(function (k, i) {
      h += '<div class="editor__par">' +
             '<input class="input editor__par-clave" data-detalle-clave="' + i + '" ' +
               'value="' + esc(k) + '" aria-label="Nombre del dato ' + (i + 1) + '">' +
             '<input class="input editor__par-valor" data-detalle-valor="' + i + '" ' +
               'value="' + esc(p.detalle[k]) + '" aria-label="Valor de ' + esc(k) + '">' +
           '</div>';
    });
    h += '</fieldset>';

    // ---- usados
    h += '<fieldset class="editor__grupo"><legend>Condición</legend>';
    h += campoSelect('condicion', 'Condición', p.condicion || 'nuevo', [
      { valor: 'nuevo', texto: 'Nuevo' },
      { valor: 'usado', texto: 'Usado' }
    ]);
    h += '<div id="camposUsado"' + (esUsado(p) ? '' : ' hidden') + '>';
    h += '<div class="editor__fila">';
    h += campoTexto('anio', 'Año del modelo', p.anio, { inputmode: 'numeric', ayuda: 'Ordena la sección de usados.' });
    h += campoTexto('equivaleNuevo', 'Id del mismo modelo nuevo', p.equivaleNuevo, { ayuda: 'Para mostrar cuánto se ahorra.' });
    h += '</div>';
    h += '<p class="editor__ayuda-grupo">Informe del estado (lo que se ve al abrir el producto):</p>';
    var e = p.estado || {};
    var clavesEstado = ESTADO_ORDEN.concat(
      Object.keys(e).filter(function (k) { return ESTADO_ORDEN.indexOf(k) === -1; })
    );
    clavesEstado.forEach(function (k) {
      var etq = ESTADO_ETIQUETAS[k] || (k.charAt(0).toUpperCase() + k.slice(1));
      var esBateria = k === 'bateria';
      h += campoTexto('estado.' + k, etq, e[k], {
        inputmode: esBateria ? 'numeric' : undefined,
        placeholder: esBateria ? 'Ej: 87 (sólo el número)' : ''
      });
    });
    h += '</div></fieldset>';

    $('#editorCampos').innerHTML = h;
  }

  // Lee TODOS los campos del formulario y arma el objeto de trabajo.
  // El detalle se reconstruye recorriendo las filas EN ORDEN, así las
  // claves conservan la posición original (por eso la columna es json y
  // no jsonb: ver supabase/schema.sql).
  function leerCampos() {
    var p = editando;
    var form = $('#editorCampos');

    form.querySelectorAll('[data-campo]').forEach(function (el) {
      var campo = el.dataset.campo;
      var valor = el.type === 'checkbox' ? el.checked : el.value;

      if (campo.indexOf('estado.') === 0) return;   // se arma aparte
      if (campo === 'specs') {
        p.specs = String(valor).split('\n')
          .map(function (s) { return s.trim(); })
          .filter(function (s) { return s; });
        return;
      }
      if (campo === 'precio' || campo === 'precioAnterior' || campo === 'stock' || campo === 'anio') {
        var txt = String(valor).trim();
        if (txt === '') { delete p[campo]; return; }
        var n = Number(txt.replace(',', '.'));
        p[campo] = isFinite(n) ? n : txt;   // si no es número, se deja para que lo marque validar()
        return;
      }
      if (campo === 'destacado' || campo === 'principal') { p[campo] = !!valor; return; }
      if (String(valor).trim() === '') { delete p[campo]; return; }
      p[campo] = String(valor);
    });

    // detalle, respetando el orden de las filas
    var detalle = {};
    var claves = form.querySelectorAll('[data-detalle-clave]');
    claves.forEach(function (inputClave) {
      var i = inputClave.dataset.detalleClave;
      var inputValor = form.querySelector('[data-detalle-valor="' + i + '"]');
      var k = inputClave.value.trim();
      if (!k) return;                       // una clave vacía se descarta
      detalle[k] = inputValor ? inputValor.value : '';
    });
    p.detalle = detalle;

    // estado: sólo si es usado
    if (p.condicion === 'usado') {
      var estado = {};
      form.querySelectorAll('[data-campo^="estado."]').forEach(function (el) {
        var k = el.dataset.campo.slice('estado.'.length);
        var v = el.value.trim();
        if (v === '') return;
        estado[k] = (k === 'bateria' && isFinite(Number(v))) ? Number(v) : v;
      });
      p.estado = Object.keys(estado).length ? estado : undefined;
      if (p.estado === undefined) delete p.estado;
    } else {
      // un producto nuevo no lleva informe de estado ni año
      delete p.estado; delete p.anio; delete p.equivaleNuevo;
    }
    return p;
  }

  function refrescarPrevia() {
    $('#previaTarjeta').innerHTML = tarjeta(editando, true);
    hidratarIconos($('#previaTarjeta'));
  }

  /* ==================================================================
     6. VALIDACIÓN
     ================================================================== */

  function marcarError(campo, mensaje) {
    var err = document.getElementById('error-' + campo);
    var input = document.getElementById('campo-' + campo);
    if (err) { err.textContent = mensaje; err.hidden = false; }
    if (input) input.setAttribute('aria-invalid', 'true');
  }

  function limpiarErrores() {
    $('#editorCampos').querySelectorAll('.campo__error').forEach(function (e) {
      e.hidden = true; e.textContent = '';
    });
    $('#editorCampos').querySelectorAll('[aria-invalid]').forEach(function (e) {
      e.removeAttribute('aria-invalid');
    });
  }

  // Devuelve { ok, aviso } — "aviso" es una advertencia que NO bloquea.
  function validar(p) {
    limpiarErrores();
    var ok = true;
    var aviso = '';

    if (!p.nombre || !String(p.nombre).trim()) {
      marcarError('nombre', 'El nombre no puede quedar vacío.'); ok = false;
    }
    if (!p.categoria || !String(p.categoria).trim()) {
      marcarError('categoria', 'La categoría no puede quedar vacía.'); ok = false;
    }

    if (p.precio === undefined || p.precio === null || p.precio === '') {
      marcarError('precio', 'Poné un precio.'); ok = false;
    } else if (typeof p.precio !== 'number' || !isFinite(p.precio)) {
      marcarError('precio', 'El precio tiene que ser un número, sin puntos ni el signo $.'); ok = false;
    } else if (p.precio < 0) {
      marcarError('precio', 'El precio no puede ser negativo.'); ok = false;
    }

    if (p.precioAnterior !== undefined) {
      if (typeof p.precioAnterior !== 'number' || !isFinite(p.precioAnterior)) {
        marcarError('precioAnterior', 'Tiene que ser un número, o dejarlo vacío.'); ok = false;
      } else if (typeof p.precio === 'number' && p.precioAnterior <= p.precio) {
        // No bloquea: se avisa y se explica por qué no tiene sentido.
        aviso = 'El precio anterior (' + precio(p.precioAnterior) + ') no es mayor que el actual (' +
                precio(p.precio) + '). Se muestra tachado como si fuera un descuento, así que va a ' +
                'quedar raro. Podés guardar igual.';
      }
    }

    if (p.stock !== undefined) {
      if (typeof p.stock !== 'number' || !isFinite(p.stock)) {
        marcarError('stock', 'Tiene que ser un número entero, o dejarlo vacío.'); ok = false;
      } else if (p.stock < 0) {
        marcarError('stock', 'El stock no puede ser negativo.'); ok = false;
      } else if (p.stock % 1 !== 0) {
        marcarError('stock', 'Tiene que ser un número entero.'); ok = false;
      }
    }

    if (p.anio !== undefined && (typeof p.anio !== 'number' || p.anio % 1 !== 0)) {
      marcarError('anio', 'El año tiene que ser un número entero (ej: 2022).'); ok = false;
    }

    if (p.condicion !== 'nuevo' && p.condicion !== 'usado') {
      marcarError('condicion', 'La condición sólo puede ser "nuevo" o "usado".'); ok = false;
    }

    return { ok: ok, aviso: aviso };
  }

  function mostrarAviso(texto, tipo) {
    var el = $('#editorAviso');
    el.textContent = texto;
    el.className = 'editor__aviso editor__aviso--' + (tipo || 'info');
    el.hidden = false;
  }
  function limpiarAviso() { $('#editorAviso').hidden = true; $('#editorAviso').textContent = ''; }

  /* ==================================================================
     7. GUARDAR
     ================================================================== */

  var guardando = false;

  function guardar() {
    if (guardando) return;
    leerCampos();
    var v = validar(editando);

    if (!v.ok) {
      mostrarAviso('Revisá los campos marcados en rojo.', 'error');
      var primerError = $('#editorCampos').querySelector('[aria-invalid]');
      if (primerError) primerError.focus();
      return;
    }
    if (v.aviso) mostrarAviso(v.aviso, 'atencion');
    else limpiarAviso();

    guardando = true;
    var btn = $('#guardarBtn');
    btn.disabled = true;
    btn.querySelector('.btn__txt').textContent = 'Guardando…';

    guardarProducto(editando)
      .then(function (guardado) {
        // Se reemplaza por lo que devolvió la BASE, no por lo que
        // mandamos: si el servidor normalizó algo, el panel lo refleja.
        var i = productos.indexOf(editandoOriginal);
        if (i !== -1) productos[i] = guardado;
        editandoOriginal = guardado;
        editando = copiar(guardado);

        pintarGrilla();
        pintarFiltros();
        cerrarEditor();
        toast('Guardado');
      })
      .catch(function (err) {
        // NO se cierra el editor y NO se toca `editando`: los cambios
        // siguen en pantalla para reintentar sin volver a escribirlos.
        mostrarAviso(err.message + ' Tus cambios siguen acá: probá de nuevo.', 'error');
        console.error('[admin] error al guardar:', err);
      })
      .then(function () {
        guardando = false;
        btn.disabled = false;
        btn.querySelector('.btn__txt').textContent = 'Guardar cambios';
      });
  }

  /* ==================================================================
     8. ÍCONOS, TOAST Y TEMA (los mismos del sitio)
     ================================================================== */

  var ICONOS = {
    check: '<path d="M5 12l5 5l10 -10"></path>',
    lista: '<path d="M9 6h11"></path><path d="M9 12h11"></path><path d="M9 18h11"></path>' +
           '<path d="M5 6h.01"></path><path d="M5 12h.01"></path><path d="M5 18h.01"></path>',
    flecha: '<path d="M5 12h14"></path><path d="M13 6l6 6l-6 6"></path>',
    volver: '<path d="M19 12H5"></path><path d="M11 18l-6 -6l6 -6"></path>',
    sol: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>',
    luna: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>',
    cruz: '<path d="M18 6L6 18"></path><path d="M6 6l12 12"></path>',
    estrella: '<path d="M12 3.5l2.6 5.3l5.9 .9l-4.3 4.1l1 5.8l-5.2 -2.7l-5.2 2.7l1 -5.8l-4.3 -4.1l5.9 -.9z"></path>'
  };

  function icono(nombre, clase) {
    return '<svg class="ico ' + (clase || '') + '" viewBox="0 0 24 24" fill="none" ' +
           'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
           'stroke-linejoin="round" aria-hidden="true">' + (ICONOS[nombre] || '') + '</svg>';
  }

  function hidratarIconos(raiz) {
    (raiz || document).querySelectorAll('[data-ico]').forEach(function (span) {
      var n = span.dataset.ico;
      if (ICONOS[n] && !span.querySelector('svg')) span.innerHTML = icono(n);
    });
  }

  var tiempoToast = null;
  function toast(texto) {
    var t = $('#toast');
    t.innerHTML = icono('check') + '<span>' + esc(texto) + '</span>';
    t.hidden = false;
    t.classList.add('is-visible');
    if (tiempoToast) clearTimeout(tiempoToast);
    tiempoToast = setTimeout(function () {
      t.classList.remove('is-visible');
      setTimeout(function () { t.hidden = true; }, 250);
    }, 2200);
  }

  function temaActual() {
    return document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro';
  }
  function pintarBotonTema() {
    var oscuro = temaActual() === 'oscuro';
    $('#temaBtnIco').innerHTML = icono(oscuro ? 'sol' : 'luna');
    $('#temaBtn').setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }
  function aplicarTema(t) {
    document.documentElement.dataset.tema = t;
    try { localStorage.setItem('nombre-tema', t); } catch (e) {}
    pintarBotonTema();
  }

  /* ==================================================================
     9. PANTALLAS
     ================================================================== */

  function mostrarLogin(mensaje) {
    $('#panel').hidden = true;
    $('#login').hidden = false;
    var err = $('#loginError');
    if (mensaje) { err.textContent = mensaje; err.hidden = false; }
    else { err.hidden = true; err.textContent = ''; }
    var email = $('#loginEmail');
    if (email) email.focus();
  }

  function mostrarPanel() {
    $('#login').hidden = true;
    $('#panel').hidden = false;
    $('#panelUsuario').textContent = sesion && sesion.email ? sesion.email : '';
    $('#panelLogo').innerHTML =
      '<span class="logo logo--regla">' +
        '<span class="logo__cat">IPHONE</span> <span class="logo__lugar">ALLEN</span>' +
      '</span>';
    pintarBotonTema();
    hidratarIconos(document);
  }

  function cargarYPintar() {
    $('#panelConteo').textContent = 'Cargando el catálogo…';
    return pedirProductos()
      .then(function (lista) {
        productos = lista;
        console.info('[admin] ' + productos.length + ' productos leídos de Supabase.');
        pintarFiltros();
        pintarGrilla();
        // El contador de pendientes tiene que verse aunque no se abra la
        // pestaña de reseñas: se cargan en segundo plano al entrar.
        cargarResenasAdmin();
      })
      .catch(function (err) {
        if (err.message === 'sesión-vencida') { cerrarSesion(true); return; }
        $('#panelConteo').textContent = '';
        $('#panelVacio').hidden = false;
        $('#panelVacio').textContent = err.message +
          ' Revisá que las tablas estén creadas en Supabase (ver supabase/schema.sql).';
        console.error('[admin]', err);
      });
  }

  /* ==================================================================
     9b. RESEÑAS — moderación
     ------------------------------------------------------------------
     El panel ve TODAS (las políticas RLS dejan leer todo a un usuario
     autenticado). Aprobar/rechazar es un PATCH del estado con el token
     de la sesión. Todo el texto de la reseña lo escribió un desconocido:
     pasa por esc() antes de entrar a un innerHTML, igual que en el sitio.
     ================================================================== */

  function pedirResenas() {
    return tokenVigente().then(function (token) {
      return fetch(SUPABASE_URL + '/rest/v1/resenas?select=*&order=creado_en.desc', {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + token,
          Accept: 'application/json'
        }
      });
    }).then(function (r) {
      if (r.status === 401) throw new Error('sesión-vencida');
      if (!r.ok) throw new Error('No se pudieron leer las reseñas (HTTP ' + r.status + ').');
      return r.json();
    });
  }

  function cambiarEstadoResena(id, estado) {
    return tokenVigente().then(function (token) {
      return fetch(SUPABASE_URL + '/rest/v1/resenas?id=eq.' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({ estado: estado })
      });
    }).then(function (r) {
      return r.text().then(function (texto) {
        if (r.status === 401) throw new Error('sesión-vencida');
        if (r.status === 403) throw new Error('La base rechazó el cambio (RLS): revisá que tu usuario tenga permiso.');
        if (!r.ok) throw new Error('No se pudo actualizar (HTTP ' + r.status + ').');
        var filas = texto ? JSON.parse(texto) : [];
        return filas[0];
      });
    });
  }

  function estrellasHTML(n) {
    var s = '<span class="estrellas" aria-label="' + n + ' de 5 estrellas">';
    for (var i = 1; i <= 5; i++) {
      s += '<span class="estrella' + (i <= n ? ' estrella--llena' : '') + '">' + icono('estrella') + '</span>';
    }
    return s + '</span>';
  }

  function fechaResena(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function contarPendientes() {
    return resenas.filter(function (r) { return r.estado === 'pendiente'; }).length;
  }

  function actualizarBadge() {
    var n = contarPendientes();
    var badge = $('#badgePendientes');
    if (!badge) return;
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  function pintarFiltrosResena() {
    $('#filtrosResena').innerHTML = ESTADOS_RESENA.map(function (e) {
      var cuenta = resenas.filter(function (r) { return r.estado === e.valor; }).length;
      var activo = e.valor === filtroResena;
      return '<button class="filtro' + (activo ? ' filtro--activo' : '') + '" type="button" ' +
             'data-estado="' + e.valor + '"' + (activo ? ' aria-current="true"' : '') + '>' +
             esc(e.texto) + ' (' + cuenta + ')</button>';
    }).join('');
  }

  function tarjetaResenaAdmin(r) {
    var producto = r.producto_nombre
      ? '<p class="admin-resena__producto">' + esc(r.producto_nombre) + '</p>'
      : '<p class="admin-resena__producto admin-resena__producto--generica">Reseña general</p>';

    // Los botones dependen del estado: no tiene sentido "Aprobar" algo ya
    // aprobado. Se ofrece siempre la acción opuesta.
    var acciones = '';
    if (r.estado !== 'aprobada') {
      acciones += '<button class="btn btn--compacto" type="button" data-aprobar="' + esc(r.id) + '">' +
        '<span class="btn__ico" data-ico="check"></span><span class="btn__txt">Aprobar</span></button>';
    }
    if (r.estado !== 'rechazada') {
      acciones += '<button class="btn btn--sec btn--compacto" type="button" data-rechazar="' + esc(r.id) + '">' +
        '<span class="btn__ico" data-ico="cruz"></span><span class="btn__txt">Rechazar</span></button>';
    }

    return '<article class="admin-resena admin-resena--' + esc(r.estado) + '">' +
        '<div class="admin-resena__top">' +
          estrellasHTML(r.estrellas) +
          '<span class="admin-resena__fecha">' + esc(fechaResena(r.creado_en)) + '</span>' +
        '</div>' +
        '<p class="admin-resena__texto">' + esc(r.comentario) + '</p>' +
        '<div class="admin-resena__meta">' +
          '<span class="admin-resena__nombre">' + esc(r.nombre) + '</span>' +
          producto +
        '</div>' +
        '<div class="admin-resena__acciones">' + acciones + '</div>' +
      '</article>';
  }

  function pintarResenasAdmin() {
    pintarFiltrosResena();
    actualizarBadge();

    var pend = contarPendientes();
    $('#resenasConteo').textContent = pend === 0
      ? 'No hay reseñas pendientes.'
      : pend + (pend === 1 ? ' reseña pendiente de moderar.' : ' reseñas pendientes de moderar.');

    var lista = resenas.filter(function (r) { return r.estado === filtroResena; });
    var cont = $('#resenasPanel');
    var vacio = $('#resenasVacio');

    if (!lista.length) {
      cont.innerHTML = '';
      vacio.hidden = false;
      vacio.textContent = filtroResena === 'pendiente'
        ? 'No hay reseñas pendientes. ¡Al día!'
        : 'No hay reseñas ' + (filtroResena === 'aprobada' ? 'aprobadas' : 'rechazadas') + '.';
      return;
    }
    vacio.hidden = true;
    cont.innerHTML = '<div class="admin-resenas-grilla">' + lista.map(tarjetaResenaAdmin).join('') + '</div>';
    hidratarIconos(cont);
  }

  function cargarResenasAdmin() {
    $('#resenasConteo').textContent = 'Cargando reseñas…';
    return pedirResenas()
      .then(function (filas) {
        resenas = Array.isArray(filas) ? filas : [];
        console.info('[admin] ' + resenas.length + ' reseñas leídas de Supabase.');
        pintarResenasAdmin();
      })
      .catch(function (err) {
        if (err.message === 'sesión-vencida') { cerrarSesion(true); return; }
        $('#resenasConteo').textContent = '';
        $('#resenasVacio').hidden = false;
        $('#resenasVacio').textContent = err.message +
          ' Revisá que la tabla exista en Supabase (ver supabase/resenas.sql).';
        console.error('[admin]', err);
      });
  }

  function moderar(id, estado) {
    var previa = resenas.slice();
    cambiarEstadoResena(id, estado)
      .then(function (fila) {
        // refresca la fila local con lo que quedó en la base
        resenas = resenas.map(function (r) {
          return (fila && r.id === fila.id) ? fila : r;
        });
        pintarResenasAdmin();
        toast(estado === 'aprobada' ? 'Reseña aprobada' : 'Reseña rechazada');
      })
      .catch(function (err) {
        if (err.message === 'sesión-vencida') { cerrarSesion(true); return; }
        resenas = previa;
        toast(err.message);
        console.error('[admin]', err);
      });
  }

  // Cambia entre la vista de catálogo y la de reseñas.
  function mostrarVista(cual) {
    var esResenas = cual === 'resenas';
    $('#vistaProductos').hidden = esResenas;
    $('#vistaResenas').hidden = !esResenas;
    $('#tabProductos').setAttribute('aria-selected', esResenas ? 'false' : 'true');
    $('#tabResenas').setAttribute('aria-selected', esResenas ? 'true' : 'false');
    if (esResenas && !resenas.length) cargarResenasAdmin();
  }

  /* ==================================================================
     10. EVENTOS
     ================================================================== */

  // --- login
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('#loginBtn');
    var err = $('#loginError');
    var email = $('#loginEmail').value.trim();
    var pass = $('#loginPass').value;

    err.hidden = true;
    if (!email || !pass) {
      err.textContent = 'Completá el correo y la contraseña.';
      err.hidden = false;
      return;
    }

    btn.disabled = true;
    btn.querySelector('.btn__txt').textContent = 'Entrando…';

    iniciarSesion(email, pass)
      .then(function (s) {
        guardarSesion(s);
        $('#loginPass').value = '';
        mostrarPanel();
        return cargarYPintar();
      })
      .catch(function (e2) {
        // Traducción de los mensajes de Supabase, que vienen en inglés.
        var m = String(e2.message || '');
        var texto = /invalid login|invalid_grant|invalid credentials/i.test(m)
          ? 'Correo o contraseña incorrectos.'
          : /email not confirmed/i.test(m)
            ? 'Ese correo todavía no está confirmado. Revisá tu casilla o confirmalo desde el panel de Supabase.'
            : /failed to fetch|networkerror/i.test(m)
              ? 'No se pudo conectar con el servidor. Revisá tu conexión.'
              : 'No se pudo entrar: ' + m;
        err.textContent = texto;
        err.hidden = false;
        $('#loginPass').focus();
      })
      .then(function () {
        btn.disabled = false;
        btn.querySelector('.btn__txt').textContent = 'Entrar';
      });
  });

  $('#salirBtn').addEventListener('click', function () { cerrarSesion(false); });

  $('#temaBtn').addEventListener('click', function () {
    aplicarTema(temaActual() === 'oscuro' ? 'claro' : 'oscuro');
  });

  // --- pestañas Catálogo / Reseñas
  $('#tabProductos').addEventListener('click', function () { mostrarVista('productos'); });
  $('#tabResenas').addEventListener('click', function () { mostrarVista('resenas'); });

  // --- filtro por estado de reseña
  $('#filtrosResena').addEventListener('click', function (e) {
    var b = e.target.closest('[data-estado]');
    if (!b) return;
    filtroResena = b.dataset.estado;
    pintarResenasAdmin();
  });

  // --- aprobar / rechazar
  $('#resenasPanel').addEventListener('click', function (e) {
    var ap = e.target.closest('[data-aprobar]');
    var re = e.target.closest('[data-rechazar]');
    if (ap) moderar(ap.dataset.aprobar, 'aprobada');
    else if (re) moderar(re.dataset.rechazar, 'rechazada');
  });

  // --- filtros y buscador
  $('#filtrosCat').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    filtroCategoria = b.dataset.cat;
    pintarFiltros();
    pintarGrilla();
  });

  var tiempoBusqueda = null;
  $('#buscador').addEventListener('input', function () {
    var v = this.value;
    if (tiempoBusqueda) clearTimeout(tiempoBusqueda);
    tiempoBusqueda = setTimeout(function () { busqueda = v; pintarGrilla(); }, 120);
  });

  // --- abrir el editor
  $('#panelSecciones').addEventListener('click', function (e) {
    var b = e.target.closest('[data-editar]');
    if (b) abrirEditor(b.dataset.editar);
  });

  // --- vista previa en vivo: cualquier tecla o cambio redibuja
  $('#editorCampos').addEventListener('input', function () {
    if (!editando) return;
    leerCampos();
    refrescarPrevia();
  });
  $('#editorCampos').addEventListener('change', function (e) {
    if (!editando) return;
    leerCampos();
    // cambiar la condición muestra u oculta el bloque de usados
    if (e.target.dataset && e.target.dataset.campo === 'condicion') {
      var bloque = $('#camposUsado');
      if (bloque) bloque.hidden = editando.condicion !== 'usado';
    }
    refrescarPrevia();
  });

  $('#editorForm').addEventListener('submit', function (e) { e.preventDefault(); guardar(); });
  $('#cancelarBtn').addEventListener('click', cerrarEditor);
  $('#editorCerrar').addEventListener('click', cerrarEditor);
  $('#editorVelo').addEventListener('click', cerrarEditor);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('#editor').hidden) cerrarEditor();
  });

  /* ==================================================================
     11. ARRANQUE
     ================================================================== */

  hidratarIconos(document);

  var guardada = leerSesion();
  if (guardada && guardada.refresh_token) {
    sesion = guardada;
    // Si el token guardado ya venció, tokenVigente() lo renueva solo
    // antes del primer pedido: por eso alcanza con intentar cargar.
    mostrarPanel();
    programarRenovacion();
    cargarYPintar();
  } else {
    mostrarLogin('');
  }

})();
