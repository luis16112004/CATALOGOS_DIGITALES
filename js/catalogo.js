/* Arma las hojas del catálogo (portada, productos y contraportada) a partir del estado guardado.
   Las hojas miden 794 × 1123 px, que es una hoja A4 en pantalla. */
(function (C) {
  const ANCHO = 794;
  const ALTO = 1123;
  C.ANCHO_HOJA = ANCHO;
  C.ALTO_HOJA = ALTO;

  // ---------- Utilidades ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  C.esc = esc;

  function recortar(texto, max) {
    const t = String(texto || '').trim();
    if (t.length <= max) return t;
    const corte = t.slice(0, max - 1);
    const espacio = corte.lastIndexOf(' ');
    return (espacio > max * 0.6 ? corte.slice(0, espacio) : corte).replace(/[,.;:\s]+$/, '') + '…';
  }

  function hexARgb(hex) {
    let h = String(hex || '').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    if (h.length !== 6 || isNaN(n)) return [128, 128, 128];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgbAHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mezclar = (a, b, t) => { const x = hexARgb(a), y = hexARgb(b); return rgbAHex(x.map((v, i) => v + (y[i] - v) * t)); };
  function luminancia(hex) {
    const c = hexARgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  const contraste = (a, b) => { const l1 = luminancia(a), l2 = luminancia(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  function oscurecerHasta(color, fondo, meta) {
    let t = 0, c = color;
    while (contraste(c, fondo) < meta && t < 0.8) { t += 0.04; c = mezclar(color, '#000000', t); }
    return c;
  }
  C.mezclar = mezclar;

  // Colores derivados: a partir de los 4 colores que elige la usuaria se calculan los tonos suaves y de contraste.
  C.paleta = function (col) {
    const contraTxt = contraste('#FFFFFF', col.oscuro) >= 3 ? '#FFFFFF' : '#1E1D21';
    return {
      rosa: col.rosa, oscuro: col.oscuro, fondo: col.fondo, texto: col.texto,
      rosaTxt: oscurecerHasta(col.rosa, col.fondo, 3.1),
      rosaSuave: mezclar(col.rosa, col.fondo, 0.55),
      rosaFondo: mezclar(col.rosa, col.fondo, 0.82),
      titulo: col.oscuro,
      tenue: mezclar(col.texto, col.fondo, 0.3),
      linea: mezclar(col.oscuro, col.fondo, 0.84),
      marco: mezclar(col.oscuro, col.fondo, 0.9),
      gris: mezclar(col.oscuro, col.fondo, 0.45),
      sobreRosa: contraste('#FFFFFF', col.rosa) >= 1.9 ? '#FFFFFF' : col.oscuro,
      contraTxt,
      contraTenue: mezclar(contraTxt, col.oscuro, 0.38),
      contraLinea: mezclar(contraTxt, col.oscuro, 0.82),
      contraRosa: contraste(col.rosa, col.oscuro) >= 2.2 ? col.rosa : contraTxt,
    };
  };

  function pila(fuente) {
    if (C.FUENTES_CURSIVAS.includes(fuente)) return `'${fuente}', cursive`;
    if (C.FUENTES_SERIF.includes(fuente)) return `'${fuente}', Georgia, serif`;
    return `'${fuente}', Arial, sans-serif`;
  }

  function variables(est, pal) {
    const f = est.diseno.fuentes;
    return [
      ['--c-rosa', pal.rosa], ['--c-rosa-txt', pal.rosaTxt], ['--c-rosa-suave', pal.rosaSuave], ['--c-rosa-fondo', pal.rosaFondo],
      ['--c-oscuro', pal.oscuro], ['--c-fondo', pal.fondo], ['--c-texto', pal.texto], ['--c-tenue', pal.tenue],
      ['--c-linea', pal.linea], ['--c-marco', pal.marco], ['--c-sobre-rosa', pal.sobreRosa],
      ['--c-contra-txt', pal.contraTxt], ['--c-contra-tenue', pal.contraTenue], ['--c-contra-linea', pal.contraLinea], ['--c-contra-rosa', pal.contraRosa],
      ['--f-tit', pila(f.titulos)], ['--f-txt', pila(f.textos)], ['--f-dec', pila(f.decorativa)],
    ].map(([k, v]) => `${k}:${v}`).join(';');
  }

  // Fuentes que se usan en las hojas (para esperar a que carguen antes de crear el PDF).
  C.fuentesUsadas = function (est) {
    const f = est.diseno.fuentes;
    return [
      `400 20px '${f.titulos}'`, `500 20px '${f.titulos}'`, `600 20px '${f.titulos}'`,
      `400 20px '${f.textos}'`, `500 20px '${f.textos}'`, `600 20px '${f.textos}'`,
      `400 20px '${f.decorativa}'`, `italic 700 20px 'Exo 2'`,
    ];
  };

  // ---------- Logo ----------
  // Montañas del logo Olimpo 50 dibujadas como figuras (rosa + segundo color).
  C.montanasSVG = function (rosa, segundo, ancho) {
    const alto = Math.round((ancho * 430) / 885);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="70 30 885 430">` +
      `<polygon fill="${rosa}" points="78,452 320,162 362,228 497,40 775,410 500,115 348,330 318,225"/>` +
      `<polygon fill="${segundo}" points="308,418 505,232 584,322 507,280"/>` +
      `<polygon fill="${segundo}" points="648,203 700,168 944,452"/></svg>`;
  };

  function logoHTML(est, pal, op) {
    const { ancho, marca, sobreOscuro = false, imgAlto } = op;
    if (est.diseno.logo) {
      return `<div class="logo"><img class="logo-img" src="${est.diseno.logo}" alt="" style="max-width:${Math.round(ancho * 2.2)}px;max-height:${imgAlto || ancho}px"></div>`;
    }
    const rosa = sobreOscuro ? pal.contraRosa : pal.rosa;
    const segundo = sobreOscuro ? pal.contraTxt : pal.gris;
    const colorMarca = sobreOscuro ? pal.contraTxt : pal.oscuro;
    const textoMarca = String(est.textos.marca || '').trim();
    return `<div class="logo">${C.montanasSVG(rosa, segundo, ancho)}` +
      (marca && textoMarca ? `<div class="logo-marca" style="font-size:${marca}px;color:${colorMarca}">${esc(textoMarca)}</div>` : '') + '</div>';
  }

  // Tamaño de fondo para "rellenar" un marco con zoom, conociendo el tamaño de la foto.
  function fondoConZoom(marcoW, marcoH, imgW, imgH, zoom, posY) {
    if (!imgW || !imgH) return `background-size:cover;background-position:50% ${posY}%`;
    const s = Math.max(marcoW / imgW, marcoH / imgH) * (zoom / 100);
    return `background-size:${(imgW * s).toFixed(1)}px ${(imgH * s).toFixed(1)}px;background-position:50% ${posY}%`;
  }

  // ---------- Iconos de contacto ----------
  function icono(tipo, color) {
    const trazos = {
      whatsapp: '<path d="M20 11.6a8.4 8.4 0 0 1-12.4 7.4L3.6 20l1.1-3.8A8.4 8.4 0 1 1 20 11.6z"/><path d="M9.2 8.2c.3-.3.8-.3 1 .1l.7 1.4c.1.3 0 .6-.2.8l-.5.5c.6 1.2 1.6 2.2 2.8 2.8l.5-.5c.2-.2.5-.3.8-.2l1.4.7c.4.2.4.7.1 1-.7.8-1.8 1-2.8.6a8.5 8.5 0 0 1-4.4-4.4c-.4-1-.2-2.1.6-2.8z"/>',
      instagram: '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5"/><circle cx="12" cy="12" r="3.9"/><circle cx="17.1" cy="6.9" r=".6" fill="' + color + '"/>',
      facebook: '<path d="M13.6 20.5v-7.3h2.5l.4-2.9h-2.9V8.5c0-.8.3-1.4 1.4-1.4h1.6V4.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v1.9H8v2.9h2.5v7.3"/>',
      tiktok: '<path d="M14 4v10.6a3.6 3.6 0 1 1-3.6-3.6"/><path d="M14 4c.4 2.4 2.2 4.1 4.8 4.3"/>',
      correo: '<rect x="3.2" y="5.5" width="17.6" height="13" rx="2"/><path d="M3.8 7.2 12 13l8.2-5.8"/>',
      ubicacion: '<path d="M12 20.8s-6.4-5.9-6.4-10.8a6.4 6.4 0 0 1 12.8 0c0 4.9-6.4 10.8-6.4 10.8z"/><circle cx="12" cy="10" r="2.3"/>',
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${trazos[tipo]}</svg>`;
  }

  // ---------- Partes de un producto ----------
  function formatoPrecio(valor, t) {
    const limpio = String(valor == null ? '' : valor).replace(/[^0-9.]/g, '');
    if (!limpio) return '';
    const n = Number(limpio);
    if (isNaN(n)) return '';
    const num = n.toLocaleString('es-MX', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
    return `${t.moneda || ''}${num}${t.sufijoPrecio ? ' ' + t.sufijoPrecio : ''}`;
  }

  function precioHTML(p, t) {
    const actual = formatoPrecio(p.precio, t);
    const antes = formatoPrecio(p.precioAntes, t);
    if (!actual) return t.sinPrecio ? `<div class="precio sin">${esc(t.sinPrecio)}</div>` : '';
    return `<div class="precio">${antes ? `<span class="antes">${esc(antes)}</span>` : ''}${esc(actual)}</div>`;
  }

  const LIMITE_DESC = { 1: 300, 2: 230, 4: 150, 6: 78 };

  function productoHTML(p, indice, est, pal, l) {
    const m = est.diseno.mostrar;
    const t = est.textos;
    const conNombres = l !== 6;
    const conRotulos = l <= 2;

    const etiqueta = p.etiqueta ? `<span class="etq${p.etiqueta === 'Agotado' ? ' agotado' : ''}">${esc(p.etiqueta)}</span>` : '';
    const ajuste = est.diseno.ajusteFoto === 'completa' ? 'contain' : 'cover';
    const foto = p.foto
      ? `<div class="prod-foto" style="background-image:url('${p.foto}');background-size:${ajuste}">${etiqueta}</div>`
      : `<div class="prod-foto vacia"><div class="foto-vacia">${C.montanasSVG(pal.rosaSuave, pal.linea, l >= 4 ? 64 : 110)}</div>${etiqueta}</div>`;

    const num = String(indice + 1).padStart(2, '0');
    const cabeza = l === 6
      ? (p.categoria ? `<div class="cat">${esc(p.categoria)}</div>` : '')
      : `<div class="num-cat"><span class="num">${num}</span>${p.categoria ? `<span class="cat">${esc(p.categoria)}</span>` : ''}</div>`;

    const desc = m.descripcion && p.descripcion ? `<p class="desc">${esc(recortar(p.descripcion, LIMITE_DESC[l]))}</p>` : '';

    const colores = m.colores && p.colores && p.colores.length
      ? `<div class="bloque colores-b">${conRotulos ? '<div class="mini">Colores</div>' : ''}<div class="colores">${p.colores.map((c) =>
        `<span class="color"><i class="dot" style="background:${esc(c.hex)}"></i>${conNombres ? `<span>${esc(c.nombre)}</span>` : ''}</span>`).join('')}</div></div>`
      : '';

    let tallas = '';
    if (m.tallas && p.tallas && p.tallas.length) {
      tallas = conRotulos
        ? `<div class="bloque"><div class="mini">Tallas</div><div class="tallas">${p.tallas.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>`
        : `<div class="tallas-txt">${p.tallas.map(esc).join(' · ')}</div>`;
    }

    const precio = m.precios ? precioHTML(p, t) : '';
    const codigo = m.codigos && p.codigo ? `<div class="codigo">Código ${esc(p.codigo)}</div>` : '';

    const fotoCaja = l === 1 ? `<div class="foto-caja"><div class="deco"></div>${foto}</div>` : foto;
    const raya = l <= 2 ? '<div class="raya"></div>' : '';
    const infoB = l === 6
      ? `<div class="info-b"><div>${colores}${tallas}</div>${precio}</div>`
      : `<div class="info-b">${colores}${tallas}${precio}${codigo}</div>`;

    return `<article class="prod" data-id="${esc(p.id)}">${fotoCaja}<div class="prod-info"><div class="info-a">${cabeza}<h3 class="nombre">${esc(p.nombre)}</h3>${raya}${desc}</div>${infoB}</div></article>`;
  }

  // ---------- Hojas ----------
  function encabezado(est, pal) {
    return `<header class="pg-head"><div class="head-logo">${logoHTML(est, pal, { ancho: 38, marca: 13, imgAlto: 30 })}</div><div class="head-txt">${esc(est.textos.encabezado)}</div></header>`;
  }

  function pie(est, numero) {
    const t = est.textos;
    const partes = [];
    if (String(t.whatsapp || '').trim()) partes.push(`WhatsApp ${t.whatsapp}`);
    if (String(t.instagram || '').trim()) partes.push(t.instagram);
    return `<footer class="pg-foot"><span>${esc(partes.join('   ·   '))}</span><span class="pg-num"><i></i>${String(numero).padStart(2, '0')}</span></footer>`;
  }

  function fotoDePortada(est) {
    const p = est.diseno.portada;
    if (!p.foto) return null;
    if (p.foto === 'subida') return p.fotoSubida && p.fotoSubida.url ? { url: p.fotoSubida.url, w: p.fotoSubida.w, h: p.fotoSubida.h } : null;
    const prod = est.productos.find((x) => x.id === p.foto && x.foto) || est.productos.find((x) => x.foto);
    return prod ? { url: prod.foto, w: prod.fotoAncho, h: prod.fotoAlto } : null;
  }
  C.fotoDePortada = fotoDePortada;

  function portadaHTML(est, pal, vars) {
    const t = est.textos;
    const d = est.diseno;
    const foto = fotoDePortada(est);
    const arriba = `<div class="por-top"><span>${esc(t.firma)}</span><span>${esc(t.encabezado)}</span></div>`;
    const titulo = t.titulo ? `<div class="por-titulo"><i></i><span>${esc(t.titulo)}</span><i></i></div>` : '';
    const temporada = t.temporada ? `<div class="por-temporada">${esc(t.temporada)}</div>` : '';
    const frase = t.frase ? `<div class="por-frase">${esc(t.frase)}</div>` : '';
    const lema = t.lema ? `<div class="por-lema">${esc(t.lema)}</div>` : '';

    if (!foto) {
      return `<section class="pg portada sin-foto" style="${vars}">${arriba}<div class="por-circulo"></div>` +
        `<div class="por-texto">${logoHTML(est, pal, { ancho: 230, marca: 74, imgAlto: 230 })}${titulo}${temporada}${frase}</div>${lema}</section>`;
    }
    // La foto de portada lleva forma de arco, salvo que se elijan fotos rectas.
    const arco = d.formaFoto === 'recta' ? 'recta' : 'arco';
    const fondo = fondoConZoom(430, 520, foto.w, foto.h, d.portada.zoom, d.portada.posicion);
    return `<section class="pg portada" style="${vars}">${arriba}<div class="por-circulo"></div><div class="por-linea ${arco}"></div>` +
      `<div class="por-foto ${arco}" style="background-image:url('${foto.url}');${fondo}"></div>` +
      `<div class="por-texto">${logoHTML(est, pal, { ancho: 128, marca: 46, imgAlto: 120 })}${titulo}${temporada}${frase}</div>${lema}</section>`;
  }

  function productosHTML(est, pal, vars, pagina, numero) {
    const l = est.diseno.porPagina;
    const forma = 'forma-' + est.diseno.formaFoto;
    const items = pagina.items.map((p, i) => productoHTML(p, pagina.inicio + i, est, pal, l));
    const cuerpo = l === 4 ? items.join('<i class="sep"></i>') : items.join('');
    return `<section class="pg hoja" style="${vars}">${encabezado(est, pal)}<div class="pg-cuerpo l${l} ${forma}">${cuerpo}</div>${pie(est, numero)}</section>`;
  }

  function vaciaHTML(est, pal, vars, numero) {
    return `<section class="pg hoja" style="${vars}">${encabezado(est, pal)}<div class="pg-cuerpo"><div class="hoja-vacia">` +
      `${C.montanasSVG(pal.rosaSuave, pal.linea, 160)}<p>Aquí aparecerán tus productos</p></div></div>${pie(est, numero)}</section>`;
  }

  function contraHTML(est, pal, vars) {
    const t = est.textos;
    const datos = [
      ['whatsapp', 'WhatsApp', t.whatsapp], ['instagram', 'Instagram', t.instagram], ['facebook', 'Facebook', t.facebook],
      ['tiktok', 'TikTok', t.tiktok], ['correo', 'Correo', t.correo], ['ubicacion', 'Ubicación', t.ubicacion],
    ].filter((x) => String(x[2] || '').trim());
    const lista = datos.map(([tipo, rotulo, valor]) =>
      `<div class="contra-item"><span class="ico">${icono(tipo, pal.contraRosa)}</span><span class="lbl">${rotulo}</span><span class="val">${esc(valor)}</span></div>`).join('');
    return `<section class="pg contra" style="${vars}"><div class="contra-centro">${logoHTML(est, pal, { ancho: 120, marca: 40, sobreOscuro: true, imgAlto: 120 })}` +
      (t.contraTitulo ? `<div class="contra-titulo">${esc(t.contraTitulo)}</div>` : '') +
      (t.contraMensaje ? `<p class="contra-msg">${esc(t.contraMensaje)}</p>` : '') +
      (lista ? `<div class="contra-lista">${lista}</div>` : '') + '</div>' +
      `<div class="contra-pie">${t.lema ? `<div class="contra-lema">${esc(t.lema)}</div>` : ''}` +
      (t.firma ? `<div class="contra-by"><i></i><span>by</span><i></i></div><div class="contra-firma">${esc(t.firma)}</div>` : '') +
      (t.nota ? `<div class="contra-nota">${esc(t.nota)}</div>` : '') + '</div></section>';
  }

  // Devuelve todas las hojas: [{ etiqueta, html }]
  C.paginas = function (est) {
    const pal = C.paleta(est.diseno.colores);
    const vars = variables(est, pal);
    const l = est.diseno.porPagina;
    const visibles = est.productos.filter((p) => p.visible !== false);
    const hojas = [];
    if (est.diseno.mostrar.portada) hojas.push({ tipo: 'portada' });
    for (let i = 0; i < visibles.length; i += l) hojas.push({ tipo: 'productos', items: visibles.slice(i, i + l), inicio: i });
    if (!visibles.length) hojas.push({ tipo: 'vacia' });
    if (est.diseno.mostrar.contraportada) hojas.push({ tipo: 'contra' });

    return hojas.map((h, i) => {
      const numero = i + 1;
      if (h.tipo === 'portada') return { etiqueta: 'Portada', html: portadaHTML(est, pal, vars) };
      if (h.tipo === 'contra') return { etiqueta: 'Contraportada', html: contraHTML(est, pal, vars) };
      if (h.tipo === 'vacia') return { etiqueta: `Hoja ${numero}`, html: vaciaHTML(est, pal, vars, numero) };
      return { etiqueta: `Hoja ${numero}`, html: productosHTML(est, pal, vars, h, numero) };
    });
  };
})(window.CATALOGO);
