/* Datos iniciales del catálogo: estilos, tipos de letra, textos y productos de ejemplo. */
window.CATALOGO = window.CATALOGO || {};

(function (C) {
  C.FUENTES = {
    titulos: [
      { id: 'Bodoni Moda', nombre: 'Elegante' },
      { id: 'Cormorant Garamond', nombre: 'Fina' },
      { id: 'Playfair Display', nombre: 'Clásica' },
      { id: 'Marcellus', nombre: 'Romana' },
      { id: 'Montserrat', nombre: 'Moderna' },
      { id: 'Josefin Sans', nombre: 'Minimalista' },
      { id: 'Exo 2', nombre: 'Deportiva' },
      { id: 'Raleway', nombre: 'Delgada' },
    ],
    textos: [
      { id: 'Montserrat', nombre: 'Montserrat' },
      { id: 'Lato', nombre: 'Lato' },
      { id: 'Poppins', nombre: 'Poppins' },
      { id: 'Raleway', nombre: 'Raleway' },
      { id: 'Josefin Sans', nombre: 'Josefin' },
      { id: 'Nunito Sans', nombre: 'Nunito' },
    ],
    decorativas: [
      { id: 'Great Vibes', nombre: 'Great Vibes' },
      { id: 'Allura', nombre: 'Allura' },
      { id: 'Parisienne', nombre: 'Parisienne' },
      { id: 'Dancing Script', nombre: 'Dancing' },
      { id: 'Sacramento', nombre: 'Sacramento' },
      { id: 'Cormorant Garamond', nombre: 'Sin cursiva' },
    ],
  };

  C.FUENTES_SERIF = ['Cormorant Garamond', 'Playfair Display', 'Bodoni Moda', 'Marcellus'];
  C.FUENTES_CURSIVAS = ['Great Vibes', 'Allura', 'Parisienne', 'Dancing Script', 'Sacramento'];

  C.TEMAS = [
    { id: 'rosa-gris', nombre: 'Rosa y gris', colores: { rosa: '#E38FB1', oscuro: '#4A484F', fondo: '#F7F5F6', texto: '#5C5A62' } },
    { id: 'rosa-pastel', nombre: 'Rosa pastel', colores: { rosa: '#EFA3C2', oscuro: '#6A6570', fondo: '#FFF8FB', texto: '#6E6973' } },
    { id: 'negro', nombre: 'Negro elegante', colores: { rosa: '#E595B6', oscuro: '#1F1E22', fondo: '#FFFFFF', texto: '#45444A' } },
    { id: 'marino', nombre: 'Marino y rosa', colores: { rosa: '#E38FB1', oscuro: '#2E3B5E', fondo: '#F4F5F9', texto: '#4B5168' } },
    { id: 'arena', nombre: 'Arena y rosa', colores: { rosa: '#D68AA6', oscuro: '#5B5049', fondo: '#F8F4EF', texto: '#6A5F58' } },
    { id: 'minimal', nombre: 'Gris minimal', colores: { rosa: '#9B98A1', oscuro: '#2F2E33', fondo: '#FFFFFF', texto: '#505055' } },
  ];

  C.COLORES_RAPIDOS = [
    { nombre: 'Negro', hex: '#1F1E22' }, { nombre: 'Blanco', hex: '#FFFFFF' }, { nombre: 'Gris', hex: '#9E9CA3' },
    { nombre: 'Gris perla', hex: '#D9D8DC' }, { nombre: 'Rosa', hex: '#EFA3C2' }, { nombre: 'Rosa palo', hex: '#E8C4CF' },
    { nombre: 'Rojo', hex: '#C8343E' }, { nombre: 'Vino', hex: '#6E2238' }, { nombre: 'Lila', hex: '#B9A3D6' },
    { nombre: 'Azul marino', hex: '#26324F' }, { nombre: 'Azul', hex: '#3F6FB5' }, { nombre: 'Verde menta', hex: '#BFE3D3' },
    { nombre: 'Verde olivo', hex: '#6B7046' }, { nombre: 'Beige', hex: '#E3D3BC' }, { nombre: 'Camel', hex: '#B88A5A' },
    { nombre: 'Café', hex: '#6B4A33' }, { nombre: 'Naranja', hex: '#F07F2D' }, { nombre: 'Amarillo', hex: '#F2C94C' },
  ];

  C.TALLAS = ['XCH', 'CH', 'M', 'G', 'XG', 'XXG', 'Unitalla'];
  C.ETIQUETAS = ['', 'Nuevo', 'Oferta', 'Más vendido', 'Últimas piezas', 'Edición limitada', 'Agotado'];
  C.CATEGORIAS = ['Ropa deportiva', 'Gorras', 'Termos', 'Bolsas', 'Accesorios', 'Audio', 'Calzado', 'Conjuntos'];

  C.disenoInicial = () => ({
    tema: 'rosa-gris',
    colores: { ...C.TEMAS[0].colores },
    fuentes: { titulos: 'Bodoni Moda', textos: 'Montserrat', decorativa: 'Great Vibes' },
    porPagina: 2,
    formaFoto: 'redondeada',
    ajusteFoto: 'rellenar',
    mostrar: { portada: true, contraportada: true, precios: true, colores: true, tallas: true, descripcion: true, codigos: false },
    logo: '',
    portada: { foto: 'gorra', fotoSubida: null, zoom: 118, posicion: 30 },
  });

  C.textosIniciales = () => ({
    marca: 'OLIMPO 50',
    titulo: 'Catálogo',
    temporada: 'Colección Otoño · Invierno 2026',
    frase: 'Tu mejor versión',
    lema: 'Disciplina · Fuerza · Resultados',
    firma: 'Prosper Arte + Olimpo 50',
    encabezado: 'Catálogo 2026',
    moneda: '$',
    sufijoPrecio: '',
    sinPrecio: 'Consultar precio',
    contraTitulo: 'Haz tu pedido',
    contraMensaje: 'Escríbenos y aparta tu producto favorito. Con gusto te ayudamos a elegir.',
    whatsapp: '(000) 000 0000',
    instagram: '@olimpo50',
    facebook: 'Olimpo 50',
    tiktok: '',
    correo: '',
    ubicacion: '',
    nota: 'Precios sujetos a cambio sin previo aviso.',
  });

  C.productosIniciales = () => {
    const f = window.FOTOS_EJEMPLO || {};
    const foto = (clave) => (f[clave] ? { foto: f[clave], fotoAncho: 896, fotoAlto: 1200 } : { foto: '', fotoAncho: 0, fotoAlto: 0 });
    const negro = [{ nombre: 'Negro', hex: '#1F1E22' }];
    return [
      {
        id: 'gorra', nombre: 'Gorra Olimpo 50', categoria: 'Gorras',
        descripcion: 'Gorra cerrada de perfil estructurado con el logo Olimpo 50 bordado en relieve en rosa y blanco.',
        precio: '349', precioAntes: '', codigo: '', etiqueta: 'Nuevo', colores: negro, tallas: ['Unitalla'], visible: true, ...foto('gorra'),
      },
      {
        id: 'termo', nombre: 'Termo Deportivo Olimpo 50', categoria: 'Termos',
        descripcion: 'Termo deportivo con tapa de rosca y asa para llevarlo a todos lados. Acabado mate con el logo Olimpo 50.',
        precio: '329', precioAntes: '', codigo: '', etiqueta: 'Nuevo', colores: [{ nombre: 'Verde menta', hex: '#BFE3D3' }], tallas: [], visible: true, ...foto('termo'),
      },
      {
        id: 'bolsa', nombre: 'Bolsa Crossbody', categoria: 'Bolsas',
        descripcion: 'Bolsa cruzada estilo vintage con tachuelas decorativas, broche metálico dorado y correa ajustable.',
        precio: '549', precioAntes: '', codigo: '', etiqueta: '', colores: [{ nombre: 'Camel', hex: '#B88A5A' }], tallas: [], visible: true, ...foto('bolsa'),
      },
      {
        id: 'guantes', nombre: 'Guantes Deportivos Fox', categoria: 'Accesorios',
        descripcion: 'Guantes para motocross y ciclismo, transpirables, con palma antiderrapante y ajuste en la muñeca.',
        precio: '399', precioAntes: '', codigo: '', etiqueta: '', colores: [{ nombre: 'Naranja con azul', hex: '#F07F2D' }], tallas: ['CH', 'M', 'G', 'XG'], visible: true, ...foto('guantes'),
      },
      {
        id: 'audifonos-buytiti', nombre: 'Audífonos Inalámbricos Büytiti', categoria: 'Audio',
        descripcion: 'Audífonos de oído abierto con Bluetooth 5.4 y estuche de carga. Se sujetan a la oreja, ideales para entrenar.',
        precio: '449', precioAntes: '', codigo: 'ST-W137', etiqueta: '', colores: negro, tallas: [], visible: true, ...foto('audifonosBuytiti'),
      },
      {
        id: 'audifonos-nebro', nombre: 'Audífonos de Cuello Nebro', categoria: 'Audio',
        descripcion: 'Audífonos Bluetooth para colgar del cuello, con batería de 180 mAh y hasta 30 horas de uso.',
        precio: '299', precioAntes: '', codigo: 'WE-064', etiqueta: '', colores: negro, tallas: [], visible: true, ...foto('audifonosNebro'),
      },
    ];
  };

  C.estadoInicial = () => ({
    version: 1,
    avisoVisto: false,
    diseno: C.disenoInicial(),
    textos: C.textosIniciales(),
    productos: C.productosIniciales(),
  });
})(window.CATALOGO);
