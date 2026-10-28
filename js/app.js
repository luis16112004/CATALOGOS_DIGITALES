/* Editor del catálogo: productos, diseño, textos, guardado automático, PDF, impresión y respaldos. */
(function () {
  'use strict';
  const C = window.CATALOGO;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = C.esc;

  const ICO = {
    arriba: '<svg viewBox="0 0 24 24"><path d="m6 14 6-6 6 6"/></svg>',
    abajo: '<svg viewBox="0 0 24 24"><path d="m6 10 6 6 6-6"/></svg>',
    editar: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
    ojo: '<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    ojoNo: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 6.1c.5-.1.9-.1 1.4-.1 6 0 9.5 6 9.5 6a17 17 0 0 1-2.9 3.6M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.5-.6 4.9-1.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    basura: '<svg viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    camara: '<svg viewBox="0 0 24 24"><path d="M4 8.5h3.2L9 6h6l1.8 2.5H20v10H4z"/><circle cx="12" cy="13.2" r="3.4"/></svg>',
    ok: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
    mas: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  };

  let estado = null;
  let pestana = 'productos';

  // =====================================================================
  //  Guardado automático en el navegador (IndexedDB, con respaldo en localStorage)
  // =====================================================================
  const BD_NOMBRE = 'catalogo-digital';
  const BD_TIENDA = 'datos';
  const BD_CLAVE = 'estado';

  function abrirBD() {
    return new Promise((ok, mal) => {
      if (!window.indexedDB) return mal(new Error('Sin IndexedDB'));
      const pet = indexedDB.open(BD_NOMBRE, 1);
      pet.onupgradeneeded = () => pet.result.createObjectStore(BD_TIENDA);
      pet.onsuccess = () => ok(pet.result);
      pet.onerror = () => mal(pet.error);
    });
  }

  async function leerGuardado() {
    try {
      const bd = await abrirBD();
      return await new Promise((ok, mal) => {
        const pet = bd.transaction(BD_TIENDA, 'readonly').objectStore(BD_TIENDA).get(BD_CLAVE);
        pet.onsuccess = () => ok(pet.result || null);
        pet.onerror = () => mal(pet.error);
      });
    } catch (e) {
      try { const t = localStorage.getItem(BD_NOMBRE); return t ? JSON.parse(t) : null; } catch (e2) { return null; }
    }
  }

  async function escribirGuardado(valor) {
    try {
      const bd = await abrirBD();
      await new Promise((ok, mal) => {
        const tx = bd.transaction(BD_TIENDA, 'readwrite');
        tx.objectStore(BD_TIENDA).put(valor, BD_CLAVE);
        tx.oncomplete = ok;
        tx.onerror = () => mal(tx.error);
        tx.onabort = () => mal(tx.error);
      });
    } catch (e) {
      localStorage.setItem(BD_NOMBRE, JSON.stringify(valor));
    }
  }

  let temporizadorGuardar = null;
  let guardadoPendiente = false;
  function guardar() {
    marcarGuardado('guardando');
    guardadoPendiente = true;
    clearTimeout(temporizadorGuardar);
    temporizadorGuardar = setTimeout(guardarYa, 450);
  }
  async function guardarYa() {
    clearTimeout(temporizadorGuardar);
    if (!guardadoPendiente) return;
    guardadoPendiente = false;
    try {
      await escribirGuardado(estado);
      marcarGuardado('ok');
    } catch (e) {
      console.error(e);
      marcarGuardado('error');
    }
  }
  function marcarGuardado(cual) {
    const el = $('#estado-guardado');
    el.dataset.estado = cual;
    $('span', el).textContent = { ok: 'Guardado', guardando: 'Guardando…', error: 'No se pudo guardar' }[cual];
    el.title = cual === 'error'
      ? 'El navegador no dejó guardar. Usa "Más → Guardar respaldo" para no perder tus cambios.'
      : 'Tus cambios se guardan solos en este navegador';
  }

  // Completa datos faltantes (por ejemplo, de respaldos hechos con versiones anteriores).
  function normalizar(e) {
    const base = C.estadoInicial();
    if (!e || typeof e !== 'object') return base;
    const d = e.diseno || {};
    const diseno = {
      ...base.diseno, ...d,
      colores: { ...base.diseno.colores, ...(d.colores || {}) },
      fuentes: { ...base.diseno.fuentes, ...(d.fuentes || {}) },
      mostrar: { ...base.diseno.mostrar, ...(d.mostrar || {}) },
      portada: { ...base.diseno.portada, ...(d.portada || {}) },
    };
    diseno.porPagina = [1, 2, 4, 6].includes(Number(diseno.porPagina)) ? Number(diseno.porPagina) : 2;
    const productos = Array.isArray(e.productos) ? e.productos.map((p) => ({
      id: p.id || nuevoId(), nombre: '', categoria: '', descripcion: '', precio: '', precioAntes: '', codigo: '', etiqueta: '',
      visible: true, foto: '', fotoAncho: 0, fotoAlto: 0, ...p,
      colores: Array.isArray(p.colores) ? p.colores : [],
      tallas: Array.isArray(p.tallas) ? p.tallas : [],
    })) : base.productos;
    return { version: 1, avisoVisto: !!e.avisoVisto, diseno, textos: { ...base.textos, ...(e.textos || {}) }, productos };
  }

  const nuevoId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const clonar = (o) => JSON.parse(JSON.stringify(o));

  function cambio(opciones = {}) {
    guardar();
    refrescarVista();
    if (opciones.panel) pintarPanel();
  }

  // =====================================================================
  //  Vista previa
  // =====================================================================
  let temporizadorVista = null;
  function refrescarVista(inmediato) {
    clearTimeout(temporizadorVista);
    temporizadorVista = setTimeout(pintarVista, inmediato ? 0 : 120);
  }

  function escalaVista() {
    const ancho = $('#vista-scroll').clientWidth - 48;
    if (ancho <= 0) return 0.5;
    return Math.max(0.28, Math.min(0.8, ancho / C.ANCHO_HOJA));
  }

  function pintarVista() {
    const hojas = C.paginas(estado);
    const s = escalaVista();
    $('#vista-paginas').innerHTML = hojas.map((h) =>
      `<div class="pg-item"><div class="pg-etq">${esc(h.etiqueta)}</div>` +
      `<div class="pg-marco" style="width:${Math.round(C.ANCHO_HOJA * s)}px;height:${Math.round(C.ALTO_HOJA * s)}px">` +
      `<div class="pg-escala" style="transform:scale(${s})">${h.html}</div></div></div>`).join('');
    $('#vista-info').textContent = `· ${hojas.length} ${hojas.length === 1 ? 'hoja' : 'hojas'}`;
  }

  function reescalarVista() {
    const s = escalaVista();
    $$('.pg-marco').forEach((m) => {
      m.style.width = Math.round(C.ANCHO_HOJA * s) + 'px';
      m.style.height = Math.round(C.ALTO_HOJA * s) + 'px';
      m.firstElementChild.style.transform = `scale(${s})`;
    });
  }

  // =====================================================================
  //  Panel: pestañas
  // =====================================================================
  function cambiarPestana(cual) {
    pestana = cual;
    $$('.pestana').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.pestana === cual)));
    ['productos', 'diseno', 'textos'].forEach((t) => { $('#tab-' + t).hidden = t !== cual; });
    pintarPanel();
    $('#panel-scroll').scrollTop = 0;
  }

  function cambiarMovil(cual) {
    $('#app').dataset.movil = cual;
    $$('.nav-movil button').forEach((b) => b.classList.toggle('activo', b.dataset.movil === cual));
    if (cual === 'catalogo') requestAnimationFrame(reescalarVista);
    else cambiarPestana(cual);
  }

  function pintarPanel() {
    if (pestana === 'productos') pintarProductos();
    else if (pestana === 'diseno') pintarDiseno();
    else pintarTextos();
  }

  // ---------- Productos ----------
  function pintarProductos() {
    const ps = estado.productos;
    const visibles = ps.filter((p) => p.visible !== false).length;
    const aviso = estado.avisoVisto ? '' : `
      <div class="aviso">${ICO.info}<div>
        <b class="aviso-titulo">¡Bienvenida a tu catálogo!</b>
        <p>Los precios y los datos de contacto son de ejemplo. Toca cada producto para poner el precio real, y en la pestaña <b>Textos</b> escribe tu WhatsApp y redes.</p>
        <button class="btn btn-suave" data-acc="cerrar-aviso">Entendido</button>
      </div></div>`;

    const lista = ps.map((p, i) => {
      const foto = p.foto
        ? `<div class="mini-foto" data-acc="editar" data-id="${esc(p.id)}" style="background-image:url('${p.foto}')"></div>`
        : `<div class="mini-foto" data-acc="editar" data-id="${esc(p.id)}">${C.montanasSVG('#E7B8CB', '#CFCAD2', 34)}</div>`;
      const precio = p.precio ? `${estado.textos.moneda}${esc(p.precio)}` : 'Sin precio';
      const oculto = p.visible === false;
      return `<li class="prod-item${oculto ? ' oculto' : ''}">
        <div class="orden">
          <button data-acc="subir" data-id="${esc(p.id)}" ${i === 0 ? 'disabled' : ''} aria-label="Subir">${ICO.arriba}</button>
          <button data-acc="bajar" data-id="${esc(p.id)}" ${i === ps.length - 1 ? 'disabled' : ''} aria-label="Bajar">${ICO.abajo}</button>
        </div>
        ${foto}
        <div class="datos" data-acc="editar" data-id="${esc(p.id)}">
          <div class="nom">${esc(p.nombre || 'Sin nombre')}</div>
          <div class="sub">${p.categoria ? esc(p.categoria) + ' · ' : ''}${precio}</div>
          <div class="puntos">${(p.colores || []).slice(0, 8).map((c) => `<i style="background:${esc(c.hex)}"></i>`).join('')}${oculto ? '<span class="marca-oculto">Oculto</span>' : ''}</div>
        </div>
        <div class="acciones">
          <button class="btn-icono" data-acc="editar" data-id="${esc(p.id)}" title="Editar" aria-label="Editar ${esc(p.nombre)}">${ICO.editar}</button>
          <button class="btn-icono" data-acc="visible" data-id="${esc(p.id)}" title="${oculto ? 'Mostrar en el catálogo' : 'Ocultar del catálogo'}" aria-label="${oculto ? 'Mostrar' : 'Ocultar'} ${esc(p.nombre)}">${oculto ? ICO.ojoNo : ICO.ojo}</button>
          <button class="btn-icono peligro" data-acc="eliminar" data-id="${esc(p.id)}" title="Eliminar" aria-label="Eliminar ${esc(p.nombre)}">${ICO.basura}</button>
        </div>
      </li>`;
    }).join('');

    $('#tab-productos').innerHTML = `${aviso}
      <div class="sec-cab"><div><h2>Tus productos</h2><p>${ps.length} ${ps.length === 1 ? 'producto' : 'productos'} · ${visibles} en el catálogo</p></div></div>
      <button class="btn btn-rosa btn-grande" data-acc="nuevo">${ICO.mas.replace('<svg', '<svg style="width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round"')} Agregar producto</button>
      ${ps.length ? `<ul class="lista-prod">${lista}</ul>` : `<div class="vacio">${C.montanasSVG('#E7B8CB', '#CFCAD2', 90)}<b>Aún no hay productos</b>Toca "Agregar producto" para empezar.</div>`}
      <p class="pista">Usa las flechas para cambiar el orden. El ojo oculta un producto sin borrarlo.</p>`;
  }

  function moverProducto(id, delta) {
    const i = estado.productos.findIndex((p) => p.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= estado.productos.length) return;
    const lista = estado.productos;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    cambio({ panel: true });
  }

  async function eliminarProducto(id) {
    const p = estado.productos.find((x) => x.id === id);
    if (!p) return false;
    const si = await confirmar({ titulo: '¿Eliminar este producto?', mensaje: `"${p.nombre || 'Sin nombre'}" se quitará del catálogo. Esto no se puede deshacer.`, boton: 'Sí, eliminar', peligro: true });
    if (!si) return false;
    estado.productos = estado.productos.filter((x) => x.id !== id);
    cambio({ panel: true });
    aviso('Producto eliminado');
    return true;
  }

  // ---------- Diseño ----------
  const MINI_HOJA = {
    1: '<rect x="13" y="8" width="20" height="20" rx="2"/><rect x="13" y="31" width="20" height="3" rx="1"/><rect x="13" y="36" width="12" height="2" rx="1"/>',
    2: '<rect x="9" y="7" width="12" height="15" rx="2"/><rect x="24" y="9" width="13" height="3" rx="1"/><rect x="24" y="14" width="9" height="2" rx="1"/><rect x="25" y="24" width="12" height="15" rx="2"/><rect x="9" y="26" width="13" height="3" rx="1"/><rect x="9" y="31" width="9" height="2" rx="1"/>',
    4: '<rect x="9" y="6" width="7" height="8" rx="1.5"/><rect x="9" y="15.5" width="7" height="8" rx="1.5"/><rect x="9" y="25" width="7" height="8" rx="1.5"/><rect x="9" y="34.5" width="7" height="6" rx="1.5"/><rect x="19" y="9" width="17" height="2" rx="1"/><rect x="19" y="18.5" width="17" height="2" rx="1"/><rect x="19" y="28" width="17" height="2" rx="1"/><rect x="19" y="36.5" width="17" height="2" rx="1"/>',
    6: '<rect x="8" y="7" width="9" height="12" rx="1.5"/><rect x="18.5" y="7" width="9" height="12" rx="1.5"/><rect x="29" y="7" width="9" height="12" rx="1.5"/><rect x="8" y="24" width="9" height="12" rx="1.5"/><rect x="18.5" y="24" width="9" height="12" rx="1.5"/><rect x="29" y="24" width="9" height="12" rx="1.5"/>',
  };
  const miniHoja = (n) => `<svg viewBox="0 0 46 46"><rect x="4" y="2" width="38" height="42" rx="3" fill="#fff" stroke="currentColor" stroke-width="1.4"/><g fill="currentColor" opacity=".55">${MINI_HOJA[n]}</g></svg>`;
  const FORMAS = {
    recta: '<rect x="13" y="8" width="20" height="30" fill="currentColor" opacity=".55"/>',
    redondeada: '<rect x="13" y="8" width="20" height="30" rx="5" fill="currentColor" opacity=".55"/>',
    arco: '<path d="M13 38V18a10 10 0 0 1 20 0v20z" fill="currentColor" opacity=".55"/>',
  };

  function opcion(acc, valor, actual, contenido, extra = '') {
    return `<button class="opcion" data-acc="${acc}" data-valor="${valor}" aria-pressed="${String(String(valor) === String(actual))}" ${extra}>${contenido}</button>`;
  }

  function interruptor(campo, texto, valor) {
    return `<label class="interruptor"><span>${texto}</span><input type="checkbox" data-campo="${campo}" ${valor ? 'checked' : ''}><span class="switch"></span></label>`;
  }

  function pintarDiseno() {
    const d = estado.diseno;
    const pal = C.paleta(d.colores);
    const temas = C.TEMAS.map((t) => `<button class="tema" data-acc="tema" data-valor="${t.id}" aria-pressed="${String(d.tema === t.id)}">
        <span class="tema-colores">${['fondo', 'rosa', 'oscuro', 'texto'].map((k) => `<i style="background:${t.colores[k]}"></i>`).join('')}</span>${esc(t.nombre)}</button>`).join('');

    const colores = [
      ['rosa', 'Color principal', 'Adornos, precios y detalles'],
      ['oscuro', 'Color de títulos', 'Nombres y última hoja'],
      ['fondo', 'Fondo de las hojas', 'Color del papel'],
      ['texto', 'Color del texto', 'Descripciones'],
    ].map(([k, nombre, ayuda]) => `<div class="fila-color">
        <label class="muestra-grande" style="background:${d.colores[k]}" title="Elegir color"><input type="color" data-color="${k}" value="${d.colores[k]}" aria-label="${nombre}"></label>
        <div class="fc-txt"><b>${nombre}</b><small>${ayuda}</small></div>
        <input class="entrada" data-hex="${k}" value="${d.colores[k].toUpperCase()}" maxlength="7" aria-label="Código de ${nombre}">
      </div>`).join('');

    const fuentes = (tipo, lista, muestra) => `<div class="fuentes">${lista.map((f) =>
      `<button class="fuente" data-acc="fuente" data-tipo="${tipo}" data-valor="${esc(f.id)}" aria-pressed="${String(d.fuentes[tipo] === f.id)}">
        <span class="muestra-txt" style="font-family:'${esc(f.id)}'">${muestra}</span><small>${esc(f.nombre)}</small></button>`).join('')}</div>`;

    const opcionesPortada = [`<option value="">Sin foto</option>`]
      .concat(estado.productos.filter((p) => p.foto).map((p) => `<option value="${esc(p.id)}" ${d.portada.foto === p.id ? 'selected' : ''}>${esc(p.nombre || 'Sin nombre')}</option>`))
      .concat(d.portada.fotoSubida ? [`<option value="subida" ${d.portada.foto === 'subida' ? 'selected' : ''}>Foto que subí</option>`] : []);
    const hayFotoPortada = !!C.fotoDePortada(estado);

    $('#tab-diseno').innerHTML = `
      <div class="tarjeta"><h3>Estilo rápido</h3><p class="ayuda">Elige una combinación de colores. Después puedes ajustar cada color.</p><div class="temas">${temas}</div></div>

      <div class="tarjeta"><h3>Colores</h3><p class="ayuda">Toca el cuadrito de color para cambiarlo.</p>${colores}</div>

      <div class="tarjeta"><h3>Tipo de letra</h3>
        <h4>Títulos</h4>${fuentes('titulos', C.FUENTES.titulos, 'Catálogo')}
        <h4>Textos</h4>${fuentes('textos', C.FUENTES.textos, 'Descripción')}
        <h4>Letra decorativa</h4>${fuentes('decorativa', C.FUENTES.decorativas, esc(estado.textos.frase || 'Tu mejor versión'))}
      </div>

      <div class="tarjeta"><h3>Productos por hoja</h3><p class="ayuda">Menos productos por hoja se ve más elegante; más productos ahorra hojas.</p>
        <div class="opciones cuatro">${[1, 2, 4, 6].map((n) => opcion('por-pagina', n, d.porPagina, `${miniHoja(n)}<span>${n} por hoja</span>`)).join('')}</div>
      </div>

      <div class="tarjeta"><h3>Fotos</h3>
        <h4>Forma</h4>
        <div class="opciones tres">${[['recta', 'Recta'], ['redondeada', 'Redondeada'], ['arco', 'Arco']].map(([v, t]) =>
          opcion('forma', v, d.formaFoto, `<svg viewBox="0 0 46 46">${FORMAS[v]}</svg><span>${t}</span>`)).join('')}</div>
        <h4>Ajuste</h4>
        <div class="opciones">${opcion('ajuste', 'rellenar', d.ajusteFoto, '<span>Llenar el espacio</span>')}${opcion('ajuste', 'completa', d.ajusteFoto, '<span>Foto completa</span>')}</div>
      </div>

      <div class="tarjeta"><h3>Qué mostrar</h3>
        ${interruptor('diseno.mostrar.portada', 'Portada', d.mostrar.portada)}
        ${interruptor('diseno.mostrar.contraportada', 'Hoja de contacto al final', d.mostrar.contraportada)}
        ${interruptor('diseno.mostrar.precios', 'Precios', d.mostrar.precios)}
        ${interruptor('diseno.mostrar.descripcion', 'Descripciones', d.mostrar.descripcion)}
        ${interruptor('diseno.mostrar.colores', 'Colores disponibles', d.mostrar.colores)}
        ${interruptor('diseno.mostrar.tallas', 'Tallas', d.mostrar.tallas)}
        ${interruptor('diseno.mostrar.codigos', 'Código o modelo', d.mostrar.codigos)}
      </div>

      <div class="tarjeta"><h3>Foto de portada</h3>
        <label class="campo"><span>¿Qué foto va en la portada?</span><select data-acc-cambio="foto-portada">${opcionesPortada.join('')}</select></label>
        <button class="btn btn-linea" data-acc="subir-portada">${ICO.camara.replace('<svg', '<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8"')} Subir otra foto</button>
        ${hayFotoPortada ? `
        <div class="rango"><label for="r-zoom">Acercar <span id="v-zoom">${d.portada.zoom}%</span></label><input id="r-zoom" type="range" min="100" max="200" step="2" data-rango="zoom" value="${d.portada.zoom}"></div>
        <div class="rango"><label for="r-pos">Mover arriba / abajo <span id="v-pos">${d.portada.posicion}%</span></label><input id="r-pos" type="range" min="0" max="100" step="1" data-rango="posicion" value="${d.portada.posicion}"></div>` : ''}
      </div>

      <div class="tarjeta"><h3>Logo</h3>
        <div class="logo-vista">${d.logo ? `<img src="${d.logo}" alt="Logo">` : `<div class="logo">${C.montanasSVG(pal.rosa, pal.gris, 120)}<div style="font-family:'Exo 2';font-style:italic;font-weight:700;font-size:30px;color:${pal.oscuro};margin-top:6px;letter-spacing:.04em">${esc(estado.textos.marca)}</div></div>`}</div>
        <div class="botones-fila">
          <button class="btn btn-linea" data-acc="subir-logo">Subir otro logo</button>
          ${d.logo ? '<button class="btn btn-texto" data-acc="quitar-logo">Usar el logo Olimpo 50</button>' : ''}
        </div>
        <p class="ayuda" style="margin:10px 0 0">De preferencia una imagen PNG con fondo transparente.</p>
      </div>

      <button class="btn btn-texto" data-acc="reset-diseno">Restablecer el diseño original</button>`;
  }

  function aplicarColor(clave, valor) {
    const limpio = String(valor).trim();
    if (!/^#?[0-9a-f]{6}$/i.test(limpio)) return false;
    const hex = (limpio[0] === '#' ? limpio : '#' + limpio).toUpperCase();
    estado.diseno.colores[clave] = hex;
    estado.diseno.tema = '';
    const muestra = $(`[data-color="${clave}"]`);
    if (muestra) { muestra.value = hex.toLowerCase(); muestra.parentElement.style.background = hex; }
    const campo = $(`[data-hex="${clave}"]`);
    if (campo && document.activeElement !== campo) campo.value = hex;
    $$('.tema').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    cambio();
    return true;
  }

  // ---------- Textos ----------
  const GRUPOS_TEXTO = [
    { titulo: 'Portada', campos: [
      ['marca', 'Nombre de la marca', 'Aparece junto al logo'],
      ['titulo', 'Título', 'Ej. Catálogo'],
      ['temporada', 'Temporada o colección'],
      ['frase', 'Frase decorativa', 'Se escribe con la letra decorativa'],
      ['lema', 'Lema'],
      ['firma', 'Firma', 'Arriba de la portada y al final'],
    ] },
    { titulo: 'Hojas de productos', campos: [['encabezado', 'Texto de arriba de cada hoja']] },
    { titulo: 'Precios', campos: [
      ['moneda', 'Símbolo de moneda', 'Ej. $'],
      ['sufijoPrecio', 'Texto después del precio', 'Ej. MXN (puede ir vacío)'],
      ['sinPrecio', 'Si un producto no tiene precio', 'Ej. Consultar precio'],
    ] },
    { titulo: 'Contacto (última hoja)', campos: [
      ['contraTitulo', 'Título'],
      ['contraMensaje', 'Mensaje', '', 'area'],
      ['whatsapp', 'WhatsApp'],
      ['instagram', 'Instagram'],
      ['facebook', 'Facebook'],
      ['tiktok', 'TikTok'],
      ['correo', 'Correo'],
      ['ubicacion', 'Ubicación o envíos'],
      ['nota', 'Nota final', 'Ej. Precios sujetos a cambio'],
    ] },
  ];

  function pintarTextos() {
    const t = estado.textos;
    $('#tab-textos').innerHTML = GRUPOS_TEXTO.map((g) => `<div class="tarjeta"><h3>${g.titulo}</h3><div style="margin-top:12px">` +
      g.campos.map(([k, nombre, ayuda, tipo]) => `<label class="campo"><span>${nombre}</span>` +
        (tipo === 'area'
          ? `<textarea data-campo="textos.${k}" rows="3" maxlength="200">${esc(t[k])}</textarea>`
          : `<input data-campo="textos.${k}" value="${esc(t[k])}" maxlength="80" placeholder="${esc(ayuda || '')}">`) +
        (ayuda && tipo !== 'area' ? `<span class="ayuda-campo">${esc(ayuda)}</span>` : '') + '</label>').join('') +
      '</div></div>').join('') +
      '<p class="pista">Si dejas un campo vacío, no aparece en el catálogo.</p>';
  }

  function asignar(obj, ruta, valor) {
    const partes = ruta.split('.');
    const ultimo = partes.pop();
    const destino = partes.reduce((o, k) => o[k], obj);
    destino[ultimo] = valor;
  }

  // =====================================================================
  //  Ventana para agregar / editar un producto
  // =====================================================================
  let borrador = null;
  let original = null;
  let esNuevo = false;

  function abrirProducto(id) {
    const p = id ? estado.productos.find((x) => x.id === id) : null;
    esNuevo = !p;
    borrador = p ? clonar(p) : {
      id: nuevoId(), nombre: '', categoria: '', descripcion: '', precio: '', precioAntes: '', codigo: '', etiqueta: '',
      colores: [], tallas: [], visible: true, foto: '', fotoAncho: 0, fotoAlto: 0,
    };
    original = JSON.stringify(borrador);
    pintarModalProducto();
    $('#modal-producto').hidden = false;
    setTimeout(() => { const n = $('[data-b="nombre"]'); if (n && esNuevo) n.focus(); }, 60);
  }

  function pintarModalProducto() {
    const b = borrador;
    const categorias = [...new Set(C.CATEGORIAS.concat(estado.productos.map((p) => p.categoria).filter(Boolean)))];
    $('#lista-categorias').innerHTML = categorias.map((c) => `<option value="${esc(c)}">`).join('');
    $('#modal-producto').innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="mp-titulo">
        <div class="modal-cab"><h2 id="mp-titulo">${esNuevo ? 'Nuevo producto' : 'Editar producto'}</h2>
          <button class="btn-icono" data-acc="mp-cerrar" aria-label="Cerrar">${ICO.x}</button></div>
        <div class="modal-cuerpo"><div class="mp-grid">
          <div class="mp-foto-col" id="mp-foto"></div>
          <div>
            <label class="campo"><span>Nombre del producto *</span><input data-b="nombre" value="${esc(b.nombre)}" maxlength="60" placeholder="Ej. Gorra Olimpo 50"></label>
            <div class="fila-2">
              <label class="campo"><span>Categoría</span><input data-b="categoria" value="${esc(b.categoria)}" list="lista-categorias" maxlength="30" placeholder="Ej. Gorras"></label>
              <label class="campo"><span>Etiqueta</span><select data-b="etiqueta">${C.ETIQUETAS.map((e) => `<option value="${esc(e)}" ${b.etiqueta === e ? 'selected' : ''}>${e ? esc(e) : 'Ninguna'}</option>`).join('')}</select></label>
            </div>
            <label class="campo"><span>Descripción <em id="mp-cuenta"></em></span><textarea data-b="descripcion" maxlength="260" rows="4" placeholder="Material, detalles, para qué sirve…">${esc(b.descripcion)}</textarea>
              <span class="ayuda-campo">En los diseños de 4 y 6 por hoja se muestra más corta.</span></label>
            <div class="fila-2">
              <label class="campo"><span>Precio</span><div class="con-prefijo"><b>${esc(estado.textos.moneda || '$')}</b><input data-b="precio" value="${esc(b.precio)}" inputmode="decimal" maxlength="12" placeholder="0"></div></label>
              <label class="campo"><span>Precio antes <small>(oferta)</small></span><div class="con-prefijo"><b>${esc(estado.textos.moneda || '$')}</b><input data-b="precioAntes" value="${esc(b.precioAntes)}" inputmode="decimal" maxlength="12" placeholder="Opcional"></div></label>
            </div>
            <label class="campo"><span>Código o modelo <small>(opcional)</small></span><input data-b="codigo" value="${esc(b.codigo)}" maxlength="24" placeholder="Ej. WE-064"></label>
            <div class="campo"><span>Colores disponibles</span><div id="mp-colores"></div></div>
            <div class="campo"><span>Tallas</span><div id="mp-tallas"></div></div>
            <label class="interruptor"><span>Mostrar en el catálogo</span><input type="checkbox" data-b="visible" ${b.visible !== false ? 'checked' : ''}><span class="switch"></span></label>
            <p class="mp-error" id="mp-error" hidden></p>
          </div>
        </div></div>
        <div class="modal-pie">
          <div class="grupo">${esNuevo ? '' : `<button class="btn btn-texto" data-acc="mp-eliminar" style="color:var(--ui-peligro)">Eliminar</button><button class="btn btn-texto" data-acc="mp-duplicar">Duplicar</button>`}</div>
          <div class="grupo"><button class="btn btn-linea" data-acc="mp-cerrar">Cancelar</button><button class="btn btn-rosa" data-acc="mp-guardar">${ICO.ok.replace('<svg', '<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"')} Guardar</button></div>
        </div>
      </div>`;
    pintarFotoProducto();
    pintarColoresProducto();
    pintarTallasProducto();
    contarDescripcion();
  }

  function contarDescripcion() {
    const c = $('#mp-cuenta');
    if (c) c.textContent = `${(borrador.descripcion || '').length}/260`;
  }

  function pintarFotoProducto() {
    const b = borrador;
    $('#mp-foto').innerHTML = b.foto
      ? `<div class="foto-caja-ed tiene" id="mp-caja-foto" style="background-image:url('${b.foto}')"></div>
         <div class="botones-fila"><button class="btn btn-linea" data-acc="mp-subir">Cambiar</button><button class="btn btn-linea" data-acc="mp-quitar-foto">Quitar</button></div>`
      : `<button class="foto-caja-ed" id="mp-caja-foto" data-acc="mp-subir">${ICO.camara}<b>Subir foto</b><small>Toca aquí o arrastra una imagen</small></button>`;
  }

  function pintarColoresProducto() {
    const b = borrador;
    $('#mp-colores').innerHTML = `
      <div class="chips">${b.colores.length ? b.colores.map((c, i) =>
        `<span class="chip"><i style="background:${esc(c.hex)}"></i>${esc(c.nombre)}<button data-acc="mp-quitar-color" data-i="${i}" aria-label="Quitar ${esc(c.nombre)}">×</button></span>`).join('')
        : '<span class="vacio-txt">Toca un color de abajo para agregarlo</span>'}</div>
      <div class="paleta-rapida">${C.COLORES_RAPIDOS.map((c) =>
        `<button class="muestra" style="background:${c.hex}" title="${c.nombre}" aria-label="Agregar ${c.nombre}" data-acc="mp-color-rapido" data-hex="${c.hex}" data-nombre="${c.nombre}"></button>`).join('')}</div>
      <div class="color-propio"><input type="color" id="mp-color-hex" value="#e38fb1" aria-label="Color personalizado"><input class="entrada" id="mp-color-nombre" maxlength="24" placeholder="Otro color (ej. Coral)"><button class="btn btn-suave" data-acc="mp-agregar-color">Agregar</button></div>`;
  }

  function pintarTallasProducto() {
    const b = borrador;
    const todas = [...new Set(C.TALLAS.concat(b.tallas))];
    $('#mp-tallas').innerHTML = `
      <p class="sub-ayuda">Toca las tallas que tienes. Si no aplica (bolsas, termos…), déjalas sin marcar.</p>
      <div class="toggles">${todas.map((t) => `<button class="toggle" data-acc="mp-talla" data-t="${esc(t)}" aria-pressed="${String(b.tallas.includes(t))}">${esc(t)}</button>`).join('')}</div>
      <div class="talla-propia"><input class="entrada" id="mp-talla-nueva" maxlength="12" placeholder="Otra talla (ej. 28)"><button class="btn btn-suave" data-acc="mp-agregar-talla">Agregar</button></div>`;
  }

  function agregarColor(nombre, hex) {
    nombre = String(nombre || '').trim();
    if (!nombre) return;
    if (borrador.colores.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) return;
    borrador.colores.push({ nombre, hex });
    pintarColoresProducto();
  }

  function guardarProducto() {
    const b = borrador;
    b.nombre = b.nombre.trim();
    if (!b.nombre) {
      const err = $('#mp-error');
      err.textContent = 'Escribe el nombre del producto.';
      err.hidden = false;
      $('[data-b="nombre"]').focus();
      return;
    }
    const i = estado.productos.findIndex((p) => p.id === b.id);
    if (i >= 0) estado.productos[i] = b;
    else estado.productos.push(b);
    cerrarModalProducto();
    cambio({ panel: true });
    aviso(esNuevo ? 'Producto agregado' : 'Cambios guardados');
  }

  async function cerrarModalProducto(preguntar) {
    if (preguntar && borrador && JSON.stringify(borrador) !== original) {
      const si = await confirmar({ titulo: '¿Salir sin guardar?', mensaje: 'Los cambios que hiciste en este producto se perderán.', boton: 'Salir sin guardar' });
      if (!si) return;
    }
    $('#modal-producto').hidden = true;
    $('#modal-producto').innerHTML = '';
    borrador = null;
  }

  // =====================================================================
  //  Fotos: se reducen de tamaño para que el catálogo no pese tanto
  // =====================================================================
  const cargarImagen = (src) => new Promise((ok, mal) => { const img = new Image(); img.onload = () => ok(img); img.onerror = mal; img.src = src; });

  async function procesarImagen(archivo, maxLado = 1400) {
    if (!archivo || !/^image\//.test(archivo.type)) throw new Error('No es una imagen');
    const original = await new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = mal; r.readAsDataURL(archivo); });
    const img = await cargarImagen(original);
    const k = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * k));
    const h = Math.max(1, Math.round(img.naturalHeight * k));
    const lienzo = document.createElement('canvas');
    lienzo.width = w; lienzo.height = h;
    const ctx = lienzo.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    let transparente = false;
    if (/png|webp|gif/.test(archivo.type)) {
      const px = ctx.getImageData(0, 0, w, h).data;
      for (let i = 3; i < px.length; i += 4 * 9) { if (px[i] < 250) { transparente = true; break; } }
    }
    return { url: transparente ? lienzo.toDataURL('image/png') : lienzo.toDataURL('image/jpeg', 0.86), w, h };
  }

  let destinoArchivo = null;
  function pedirArchivo(destino) {
    destinoArchivo = destino;
    const input = $('#archivo');
    input.value = '';
    input.click();
  }

  async function recibirArchivo(archivo, destino) {
    try {
      if (destino === 'producto' && borrador) {
        const r = await procesarImagen(archivo, 1400);
        Object.assign(borrador, { foto: r.url, fotoAncho: r.w, fotoAlto: r.h });
        pintarFotoProducto();
      } else if (destino === 'logo') {
        const r = await procesarImagen(archivo, 900);
        estado.diseno.logo = r.url;
        cambio({ panel: true });
        aviso('Logo actualizado');
      } else if (destino === 'portada') {
        const r = await procesarImagen(archivo, 1600);
        estado.diseno.portada.fotoSubida = r;
        estado.diseno.portada.foto = 'subida';
        estado.diseno.portada.zoom = 100;
        estado.diseno.portada.posicion = 50;
        cambio({ panel: true });
        aviso('Foto de portada actualizada');
      }
    } catch (e) {
      console.error(e);
      confirmar({ titulo: 'No se pudo usar esa imagen', mensaje: 'Prueba con otra foto en formato JPG o PNG.', boton: 'Entendido', soloAceptar: true });
    }
  }

  // =====================================================================
  //  Avisos y confirmaciones
  // =====================================================================
  let temporizadorAviso = null;
  function aviso(texto) {
    const t = $('#toast');
    t.innerHTML = `${ICO.ok}<span>${esc(texto)}</span>`;
    t.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => { t.hidden = true; }, 2600);
  }

  function confirmar({ titulo, mensaje, boton = 'Aceptar', peligro = false, soloAceptar = false }) {
    return new Promise((resolver) => {
      const caja = $('#modal-confirmar');
      caja.innerHTML = `<div class="modal chico" role="alertdialog" aria-modal="true" aria-labelledby="cf-t">
        <div class="confirmar-txt"><h2 id="cf-t">${esc(titulo)}</h2><p>${esc(mensaje)}</p></div>
        <div class="modal-pie">${soloAceptar ? '' : '<button class="btn btn-linea" data-r="no">Cancelar</button>'}
          <button class="btn ${peligro ? 'btn-peligro' : 'btn-rosa'}" data-r="si">${esc(boton)}</button></div></div>`;
      caja.hidden = false;
      const cerrar = (r) => { caja.hidden = true; caja.innerHTML = ''; caja.onclick = null; document.removeEventListener('keydown', tecla, true); resolver(r); };
      const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); cerrar(false); } };
      document.addEventListener('keydown', tecla, true);
      caja.onclick = (e) => {
        const b = e.target.closest('[data-r]');
        if (b) cerrar(b.dataset.r === 'si');
        else if (e.target === caja) cerrar(false);
      };
      setTimeout(() => $('[data-r="si"]', caja).focus(), 30);
    });
  }

  // =====================================================================
  //  PDF, impresión y respaldos
  // =====================================================================
  function nombreArchivo(ext) {
    const base = `${estado.textos.titulo || 'Catalogo'} ${estado.textos.marca || ''}`.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${base || 'Catalogo'}.${ext}`;
  }

  function mostrarCapa(texto, avance) {
    $('#capa-pdf').hidden = false;
    $('#capa-texto').textContent = texto;
    $('#capa-progreso').style.width = Math.round(avance * 100) + '%';
  }

  async function prepararHojas() {
    const host = $('#exportar');
    host.innerHTML = C.paginas(estado).map((h) => h.html).join('');
    void host.offsetHeight;
    if (document.fonts) {
      await Promise.all(C.fuentesUsadas(estado).map((f) => document.fonts.load(f).catch(() => null)));
      await document.fonts.ready;
    }
    const urls = new Set();
    $$('[style*="background-image"]', host).forEach((el) => {
      const m = /url\(['"]?(.*?)['"]?\)/.exec(el.style.backgroundImage);
      if (m) urls.add(m[1]);
    });
    $$('img', host).forEach((img) => urls.add(img.src));
    await Promise.all([...urls].map((u) => cargarImagen(u).catch(() => null)));
    return $$('.pg', host);
  }

  async function descargarPDF() {
    if (!window.html2canvas || !window.jspdf) {
      confirmar({ titulo: 'Se necesita internet', mensaje: 'Para crear el PDF el programa necesita internet. Conéctate y vuelve a intentarlo, o usa "Más → Imprimir catálogo" y elige "Guardar como PDF".', boton: 'Entendido', soloAceptar: true });
      return;
    }
    await guardarYa();
    mostrarCapa('Preparando tu catálogo…', 0.03);
    try {
      const hojas = await prepararHojas();
      const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      for (let i = 0; i < hojas.length; i++) {
        mostrarCapa(`Creando hoja ${i + 1} de ${hojas.length}…`, (i + 0.4) / hojas.length);
        const lienzo = await window.html2canvas(hojas[i], { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true, imageTimeout: 30000, scrollX: 0, scrollY: 0 });
        if (i > 0) pdf.addPage('a4', 'portrait');
        pdf.addImage(lienzo.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        lienzo.width = lienzo.height = 0;
      }
      mostrarCapa('¡Listo! Descargando…', 1);
      pdf.save(nombreArchivo('pdf'));
      aviso('Tu catálogo se descargó en PDF');
    } catch (e) {
      console.error(e);
      confirmar({ titulo: 'No se pudo crear el PDF', mensaje: 'Intenta de nuevo. Si sigue fallando, usa "Más → Imprimir catálogo" y elige "Guardar como PDF".', boton: 'Entendido', soloAceptar: true });
    } finally {
      $('#exportar').innerHTML = '';
      setTimeout(() => { $('#capa-pdf').hidden = true; }, 400);
    }
  }

  async function imprimir() {
    mostrarCapa('Preparando para imprimir…', 0.5);
    await prepararHojas();
    $('#capa-pdf').hidden = true;
    const limpiar = () => { $('#exportar').innerHTML = ''; window.removeEventListener('afterprint', limpiar); };
    window.addEventListener('afterprint', limpiar);
    window.print();
  }

  function descargarArchivo(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function guardarRespaldo() {
    const fecha = new Date();
    const dia = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    const datos = JSON.stringify({ app: 'catalogo-digital', version: 1, fecha: fecha.toISOString(), estado });
    descargarArchivo(new Blob([datos], { type: 'application/json' }), `respaldo-catalogo-${dia}.json`);
    aviso('Respaldo descargado');
  }

  async function cargarRespaldo(archivo) {
    try {
      const datos = JSON.parse(await archivo.text());
      const e = datos && datos.estado ? datos.estado : datos;
      if (!e || !Array.isArray(e.productos)) throw new Error('Formato');
      const si = await confirmar({ titulo: '¿Cargar este respaldo?', mensaje: `Tiene ${e.productos.length} productos. Reemplazará lo que tienes ahora en el catálogo.`, boton: 'Sí, cargar' });
      if (!si) return;
      estado = normalizar(e);
      cambio({ panel: true });
      aviso('Respaldo cargado');
    } catch (err) {
      console.error(err);
      confirmar({ titulo: 'Ese archivo no sirve', mensaje: 'Elige un archivo de respaldo creado con "Guardar respaldo".', boton: 'Entendido', soloAceptar: true });
    }
  }

  // =====================================================================
  //  Eventos
  // =====================================================================
  async function accion(acc, el) {
    const id = el.dataset.id;
    switch (acc) {
      // Barra superior
      case 'pdf': return descargarPDF();
      case 'imprimir': return imprimir();
      case 'respaldo-guardar': return guardarRespaldo();
      case 'respaldo-cargar': { const i = $('#archivo-respaldo'); i.value = ''; return i.click(); }
      case 'restaurar': {
        const si = await confirmar({ titulo: '¿Volver al catálogo de ejemplo?', mensaje: 'Se borrarán tus productos y cambios, y quedará como venía al principio. Si quieres, primero guarda un respaldo.', boton: 'Sí, volver al ejemplo', peligro: true });
        if (!si) return;
        estado = C.estadoInicial();
        cambio({ panel: true });
        return aviso('Catálogo de ejemplo restaurado');
      }
      // Productos
      case 'cerrar-aviso': estado.avisoVisto = true; guardar(); return pintarProductos();
      case 'nuevo': return abrirProducto(null);
      case 'editar': return abrirProducto(id);
      case 'subir': return moverProducto(id, -1);
      case 'bajar': return moverProducto(id, 1);
      case 'visible': {
        const p = estado.productos.find((x) => x.id === id);
        if (!p) return;
        p.visible = p.visible === false;
        cambio({ panel: true });
        return aviso(p.visible ? 'Ahora se muestra en el catálogo' : 'Oculto del catálogo (no se borró)');
      }
      case 'eliminar': return eliminarProducto(id);
      // Diseño
      case 'tema': {
        const t = C.TEMAS.find((x) => x.id === el.dataset.valor);
        if (!t) return;
        estado.diseno.tema = t.id;
        estado.diseno.colores = { ...t.colores };
        return cambio({ panel: true });
      }
      case 'fuente': estado.diseno.fuentes[el.dataset.tipo] = el.dataset.valor; return cambio({ panel: true });
      case 'por-pagina': estado.diseno.porPagina = Number(el.dataset.valor); return cambio({ panel: true });
      case 'forma': estado.diseno.formaFoto = el.dataset.valor; return cambio({ panel: true });
      case 'ajuste': estado.diseno.ajusteFoto = el.dataset.valor; return cambio({ panel: true });
      case 'subir-logo': return pedirArchivo('logo');
      case 'quitar-logo': estado.diseno.logo = ''; return cambio({ panel: true });
      case 'subir-portada': return pedirArchivo('portada');
      case 'reset-diseno': {
        const si = await confirmar({ titulo: '¿Restablecer el diseño?', mensaje: 'Los colores, letras y acomodo volverán a como estaban al principio. Tus productos y textos no cambian.', boton: 'Restablecer' });
        if (!si) return;
        const logo = estado.diseno.logo;
        estado.diseno = { ...C.disenoInicial(), logo };
        cambio({ panel: true });
        return aviso('Diseño restablecido');
      }
      // Ventana de producto
      case 'mp-cerrar': return cerrarModalProducto(true);
      case 'mp-guardar': return guardarProducto();
      case 'mp-subir': return pedirArchivo('producto');
      case 'mp-quitar-foto': Object.assign(borrador, { foto: '', fotoAncho: 0, fotoAlto: 0 }); return pintarFotoProducto();
      case 'mp-color-rapido': return agregarColor(el.dataset.nombre, el.dataset.hex);
      case 'mp-agregar-color': {
        const nombre = $('#mp-color-nombre').value;
        if (!nombre.trim()) { $('#mp-color-nombre').focus(); return; }
        return agregarColor(nombre, $('#mp-color-hex').value.toUpperCase());
      }
      case 'mp-quitar-color': borrador.colores.splice(Number(el.dataset.i), 1); return pintarColoresProducto();
      case 'mp-talla': {
        const t = el.dataset.t;
        const tiene = borrador.tallas.includes(t);
        const elegidas = tiene ? borrador.tallas.filter((x) => x !== t) : borrador.tallas.concat(t);
        const orden = [...new Set(C.TALLAS.concat(borrador.tallas, [t]))];
        borrador.tallas = orden.filter((x) => elegidas.includes(x));
        return pintarTallasProducto();
      }
      case 'mp-agregar-talla': {
        const t = $('#mp-talla-nueva').value.trim();
        if (!t) { $('#mp-talla-nueva').focus(); return; }
        if (!borrador.tallas.includes(t)) borrador.tallas.push(t);
        return pintarTallasProducto();
      }
      case 'mp-duplicar': {
        const copia = { ...clonar(borrador), id: nuevoId(), nombre: `${borrador.nombre} (copia)`.slice(0, 60) };
        const i = estado.productos.findIndex((p) => p.id === borrador.id);
        estado.productos.splice(i + 1, 0, copia);
        cerrarModalProducto();
        cambio({ panel: true });
        aviso('Producto duplicado');
        return abrirProducto(copia.id);
      }
      case 'mp-eliminar': {
        const borrado = await eliminarProducto(borrador.id);
        if (borrado) cerrarModalProducto();
        return;
      }
    }
  }

  function conectarEventos() {
    document.addEventListener('click', (e) => {
      const menu = $('#menu-mas');
      if (!menu.hidden && !e.target.closest('.menu-mas')) cerrarMenu();
      const el = e.target.closest('[data-acc]');
      if (el && !el.disabled) {
        if (el.closest('#menu-mas')) cerrarMenu();
        accion(el.dataset.acc, el);
      }
    });

    $('#btn-mas').addEventListener('click', () => {
      const menu = $('#menu-mas');
      menu.hidden = !menu.hidden;
      $('#btn-mas').setAttribute('aria-expanded', String(!menu.hidden));
    });

    $$('.pestana').forEach((b) => b.addEventListener('click', () => cambiarPestana(b.dataset.pestana)));
    $$('.nav-movil button').forEach((b) => b.addEventListener('click', () => cambiarMovil(b.dataset.movil)));

    // Tocar un producto en la vista previa abre su edición
    $('#vista-paginas').addEventListener('click', (e) => {
      const prod = e.target.closest('.prod[data-id]');
      if (prod) abrirProducto(prod.dataset.id);
    });

    document.addEventListener('input', (e) => {
      const el = e.target;
      if (el.dataset.campo) {
        asignar(estado, el.dataset.campo, el.type === 'checkbox' ? el.checked : el.value);
        cambio();
      } else if (el.dataset.b && borrador) {
        borrador[el.dataset.b] = el.type === 'checkbox' ? el.checked : el.value;
        if (el.dataset.b === 'descripcion') contarDescripcion();
        if (el.dataset.b === 'nombre') $('#mp-error').hidden = true;
      } else if (el.dataset.color) {
        aplicarColor(el.dataset.color, el.value);
      } else if (el.dataset.hex) {
        aplicarColor(el.dataset.hex, el.value);
      } else if (el.dataset.rango) {
        estado.diseno.portada[el.dataset.rango] = Number(el.value);
        $(el.dataset.rango === 'zoom' ? '#v-zoom' : '#v-pos').textContent = el.value + '%';
        cambio();
      }
    });

    document.addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset.accCambio === 'foto-portada') {
        estado.diseno.portada.foto = el.value;
        cambio({ panel: true });
      } else if (el.dataset.hex) {
        el.value = estado.diseno.colores[el.dataset.hex].toUpperCase();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#modal-producto').hidden && $('#modal-confirmar').hidden) cerrarModalProducto(true);
      if (e.key === 'Escape' && !$('#menu-mas').hidden) cerrarMenu();
      if (e.key === 'Enter' && e.target.id === 'mp-color-nombre') { e.preventDefault(); accion('mp-agregar-color', e.target); }
      if (e.key === 'Enter' && e.target.id === 'mp-talla-nueva') { e.preventDefault(); accion('mp-agregar-talla', e.target); }
    });

    $('#modal-producto').addEventListener('click', (e) => { if (e.target.id === 'modal-producto') cerrarModalProducto(true); });

    $('#archivo').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) recibirArchivo(f, destinoArchivo);
    });
    $('#archivo-respaldo').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) cargarRespaldo(f);
    });

    // Arrastrar una foto a la ventana del producto
    const modal = $('#modal-producto');
    modal.addEventListener('dragover', (e) => {
      if (!e.target.closest('#mp-foto')) return;
      e.preventDefault();
      const caja = $('#mp-caja-foto');
      if (caja) caja.classList.add('arrastrando');
    });
    modal.addEventListener('dragleave', (e) => {
      const caja = $('#mp-caja-foto');
      if (caja && !e.relatedTarget?.closest?.('#mp-foto')) caja.classList.remove('arrastrando');
    });
    modal.addEventListener('drop', (e) => {
      if (!e.target.closest('#mp-foto')) return;
      e.preventDefault();
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) recibirArchivo(f, 'producto');
    });

    let temporizadorTam = null;
    window.addEventListener('resize', () => { clearTimeout(temporizadorTam); temporizadorTam = setTimeout(reescalarVista, 120); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') guardarYa(); });
    window.addEventListener('beforeunload', (e) => {
      if (guardadoPendiente) { guardarYa(); e.preventDefault(); e.returnValue = ''; }
    });
  }

  function cerrarMenu() {
    $('#menu-mas').hidden = true;
    $('#btn-mas').setAttribute('aria-expanded', 'false');
  }

  // =====================================================================
  //  Inicio
  // =====================================================================
  async function iniciar() {
    const logo = C.montanasSVG('#E38FB1', '#A9A5AE', 46);
    $('#barra-logo').innerHTML = logo;
    $('#capa-logo').innerHTML = C.montanasSVG('#E38FB1', '#A9A5AE', 120);
    const guardado = await leerGuardado();
    estado = normalizar(guardado);
    conectarEventos();
    pintarPanel();
    pintarVista();
    if (!guardado) guardar();
    if (document.fonts) document.fonts.ready.then(() => refrescarVista(true));
    // En el celular, pide al navegador que no borre los datos guardados cuando le falte espacio.
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  }

  iniciar();
})();
