export type Foto = {
  id: string
  src: string
  caption: string
}

export type Razon = {
  id: string
  emoji: string
  texto: string
  categoria?: string
}

export type SpotifyCancion = {
  id: string
  titulo: string
  artista: string
  url: string
}

export type SpotifyPlaylist = {
  id: string
  etiqueta: string
  url: string
}

export type Idioma = {
  id: string
  idioma: string
  texto: string
  nota?: string
}

export type Hito = {
  id: string
  emoji: string
  fecha: string
  titulo: string
  texto: string
}

export type Contenido = {
  nombre: string
  firma: string
  fechaInicio: string
  apodos: string[]
  entrada: {
    saludo: string
    titulo: string
    subtitulo: string
    boton: string
  }
  bienvenida: {
    titulo: string
    texto: string
  }
  contador: {
    titulo: string
    nota: string
  }
  carta: {
    titulo: string
    parrafos: string[]
    despedida: string
  }
  fotos: Foto[]
  razones: {
    titulo: string
    items: Razon[]
  }
  idiomas: {
    titulo: string
    subtitulo: string
    items: Idioma[]
  }
  historia: {
    titulo: string
    subtitulo: string
    items: Hito[]
  }
  musica: {
    titulo: string
    subtitulo: string
    playlists: SpotifyPlaylist[]
    canciones: SpotifyCancion[]
  }
  final: {
    titulo: string
    mensaje: string
  }
}

export const CLAVE_BORRADOR = 'mivida-borrador'
export const CLAVE_PREVIEW = 'mivida-preview'
export const CLAVE_PANEL = 'mivida-panel-ok'
export const CLAVE_GITHUB = 'mivida-github'
export const PIN_PANEL = '161224'

export const CATEGORIAS_RAZONES = ['Personalidad', 'Físico', 'Momentos juntos'] as const

export const CONTENIDO_DEFAULT: Contenido = {
  nombre: 'Yaret',
  firma: '— Tuyo, hoy y siempre 💌',
  fechaInicio: '2024-12-16T00:00:00',
  apodos: [
    'mivida',
    'miamor',
    'mi niña bonita',
    'Yaresita',
    'mi mango con chile',
    'mi manguita',
    'mi papas a la francesa',
    'mi bonita',
  ],
  entrada: {
    saludo: 'hola,',
    titulo: 'Esta página es para Yaresita',
    subtitulo:
      'Alguien que te ama muchísimo la hizo especialmente para ti. No necesitas contraseña: tu sonrisa es el acceso.',
    boton: 'Continuar',
  },
  bienvenida: {
    titulo: 'Bienvenida a tu rinconcito',
    texto:
      'Esto no es una página cualquiera, mivida: es una cartita interactiva. Ve dando click para avanzar, sin prisa, que cada parte la hice pensando en ti.',
  },
  contador: {
    titulo: 'Nuestro tiempo juntos',
    nota: 'Desde el 16 de diciembre de 2024, cada segundo cuenta. Literal: míralo correr.',
  },
  carta: {
    titulo: 'Para Yaresita, mi persona favorita',
    parrafos: [
      'Hola, mivida. Si estás leyendo esto es porque por fin terminé la sorpresa que te venía preparando: una página solo tuya, hecha con el mismo cariño con el que tú me haces sonreír todos los días.',
      'Desde el 16 de diciembre de 2024 mi vida suena distinto. Suena a tus risas, a Harry Styles cuando estás tú, a Milo J cuando te pienso, y a ese silencio bonito de cuando estamos juntos y no hace falta decir nada.',
      'Quería regalarte algo que no se pudiera romper ni perder: un lugarcito en internet donde siempre puedas venir a leer cuánto te amo, mi mango con chile. Cada foto, cada palabra y cada detalle de aquí lo puse pensando en ti.',
    ],
    despedida: 'Te amoquieroadoro, hoy, mañana y en todos los recargues de esta página.',
  },
  fotos: [
    {
      id: 'foto-1',
      src: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=80',
      caption: 'Nuestro atardecer',
    },
    {
      id: 'foto-2',
      src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80',
      caption: 'Tu mano y la mía',
    },
    {
      id: 'foto-3',
      src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80',
      caption: 'Cafecito contigo',
    },
  ],
  razones: {
    titulo: 'Razones por las que te amo',
    items: [
      {
        id: 'razon-1',
        emoji: '🍷',
        texto: 'Porque eres como el rojo vino: mi color favorito desde que es el tuyo.',
        categoria: 'Físico',
      },
      {
        id: 'razon-2',
        emoji: '🎶',
        texto: 'Porque contigo hasta las canciones tristes suenan bonito.',
        categoria: 'Momentos juntos',
      },
      {
        id: 'razon-3',
        emoji: '✨',
        texto: 'Porque eres mi "Golden": llegaste y todo se puso más brillante.',
        categoria: 'Personalidad',
      },
      {
        id: 'razon-4',
        emoji: '🥭',
        texto: 'Porque eres mi mango con chile: dulce, picosita y mi antojo de todos los días.',
        categoria: 'Personalidad',
      },
      {
        id: 'razon-5',
        emoji: '😂',
        texto: 'Porque nadie me hace reír como tú, ni cerca.',
        categoria: 'Personalidad',
      },
      {
        id: 'razon-6',
        emoji: '🏡',
        texto: 'Porque estar contigo se siente como llegar a casa.',
        categoria: 'Momentos juntos',
      },
    ],
  },
  idiomas: {
    titulo: 'Te amoquieroadoro',
    subtitulo: 'y como en un solo idioma no me alcanza, te lo digo en todos',
    items: [
      { id: 'idioma-1', idioma: 'Español', texto: 'Te amo' },
      { id: 'idioma-2', idioma: 'Coreano', texto: '사랑해', nota: 'saranghae' },
      { id: 'idioma-3', idioma: 'Japonés', texto: '愛してる', nota: 'aishiteru' },
      { id: 'idioma-4', idioma: 'Inglés', texto: 'I love you' },
      { id: 'idioma-5', idioma: 'Francés', texto: "Je t'aime", nota: 'ye tem' },
      { id: 'idioma-6', idioma: 'Italiano', texto: 'Ti amo' },
      { id: 'idioma-7', idioma: 'Portugués', texto: 'Eu te amo' },
      { id: 'idioma-8', idioma: 'Alemán', texto: 'Ich liebe dich', nota: 'ij libe dij' },
      { id: 'idioma-9', idioma: 'Ruso', texto: 'Я тебя люблю', nota: 'ya tibiá liubliú' },
      { id: 'idioma-10', idioma: 'Chino', texto: '我爱你', nota: 'wǒ ài nǐ' },
      { id: 'idioma-11', idioma: 'Árabe', texto: 'أحبك', nota: 'uhibbuki' },
      { id: 'idioma-12', idioma: 'Náhuatl', texto: 'Nimitztlazohtla' },
    ],
  },
  historia: {
    titulo: 'Nuestra historia',
    subtitulo: 'toca cada punto para revivir el momento',
    items: [
      {
        id: 'hito-1',
        emoji: '👀',
        fecha: 'Antes de todo',
        titulo: 'Te empecé a ver distinto',
        texto: 'Un día dejaste de ser solo alguien más y no supe ni cómo pasó.',
      },
      {
        id: 'hito-2',
        emoji: '💌',
        fecha: '16 dic 2024',
        titulo: 'El día que empezamos',
        texto: 'La fecha que ahora es mi favorita del calendario, sin competencia.',
      },
      {
        id: 'hito-3',
        emoji: '🎧',
        fecha: 'Poco después',
        titulo: 'Nuestra primera canción',
        texto: 'Desde ahí no puedo escucharla sin pensarte.',
      },
      {
        id: 'hito-4',
        emoji: '🥭',
        fecha: 'En el camino',
        titulo: 'Te gané el apodo de mango con chile',
        texto: 'Dulce, picosita, y mi antojo constante desde entonces.',
      },
      {
        id: 'hito-5',
        emoji: '♾️',
        fecha: 'Hoy y siempre',
        titulo: 'Lo que sigue',
        texto: 'Esta línea de tiempo la seguimos escribiendo juntos.',
      },
    ],
  },
  musica: {
    titulo: 'Nuestra música',
    subtitulo: 'las canciones y playlists que suenan a nosotros',
    playlists: [],
    canciones: [
      { id: 'cancion-1', titulo: 'Golden', artista: 'Harry Styles', url: '' },
      { id: 'cancion-2', titulo: 'Sweet Creature', artista: 'Harry Styles', url: '' },
      { id: 'cancion-3', titulo: 'M.A.I', artista: 'Milo J', url: '' },
      { id: 'cancion-4', titulo: 'Rara Vez', artista: 'Taiu & Milo J', url: '' },
    ],
  },
  final: {
    titulo: 'Y esto apenas empieza',
    mensaje:
      'Gracias por existir, por quererme y por dejarme quererte, mi papas a la francesa. Esta página va a seguir creciendo, igual que nosotros. Te amoquieroadoro, Yaresita.',
  },
}

// Une lo guardado con los valores por defecto, para que un archivo viejo o
// incompleto nunca rompa la página.
export function mergeContenido(base: Contenido, extra: unknown): Contenido {
  if (!extra || typeof extra !== 'object') {
    return base
  }

  const dato = extra as Partial<Contenido> & Record<string, unknown>

  return {
    nombre: typeof dato.nombre === 'string' ? dato.nombre : base.nombre,
    firma: typeof dato.firma === 'string' ? dato.firma : base.firma,
    fechaInicio: typeof dato.fechaInicio === 'string' ? dato.fechaInicio : base.fechaInicio,
    apodos: Array.isArray(dato.apodos)
      ? dato.apodos.filter((apodo): apodo is string => typeof apodo === 'string')
      : base.apodos,
    entrada: { ...base.entrada, ...(dato.entrada ?? {}) },
    bienvenida: { ...base.bienvenida, ...(dato.bienvenida ?? {}) },
    contador: { ...base.contador, ...(dato.contador ?? {}) },
    carta: {
      ...base.carta,
      ...(dato.carta ?? {}),
      parrafos: Array.isArray(dato.carta?.parrafos) ? dato.carta.parrafos : base.carta.parrafos,
    },
    fotos: Array.isArray(dato.fotos) ? dato.fotos : base.fotos,
    razones: {
      titulo: typeof dato.razones?.titulo === 'string' ? dato.razones.titulo : base.razones.titulo,
      items: Array.isArray(dato.razones?.items) ? dato.razones.items : base.razones.items,
    },
    idiomas: {
      titulo: typeof dato.idiomas?.titulo === 'string' ? dato.idiomas.titulo : base.idiomas.titulo,
      subtitulo:
        typeof dato.idiomas?.subtitulo === 'string' ? dato.idiomas.subtitulo : base.idiomas.subtitulo,
      items: Array.isArray(dato.idiomas?.items) ? dato.idiomas.items : base.idiomas.items,
    },
    historia: {
      titulo: typeof dato.historia?.titulo === 'string' ? dato.historia.titulo : base.historia.titulo,
      subtitulo:
        typeof dato.historia?.subtitulo === 'string' ? dato.historia.subtitulo : base.historia.subtitulo,
      items: Array.isArray(dato.historia?.items) ? dato.historia.items : base.historia.items,
    },
    musica: {
      titulo: typeof dato.musica?.titulo === 'string' ? dato.musica.titulo : base.musica.titulo,
      subtitulo:
        typeof dato.musica?.subtitulo === 'string' ? dato.musica.subtitulo : base.musica.subtitulo,
      playlists: Array.isArray(dato.musica?.playlists) ? dato.musica.playlists : base.musica.playlists,
      canciones: Array.isArray(dato.musica?.canciones) ? dato.musica.canciones : base.musica.canciones,
    },
    final: {
      ...base.final,
      ...(dato.final ?? {}),
    },
  }
}

export function leerBorrador(): Contenido | null {
  try {
    const crudo = localStorage.getItem(CLAVE_BORRADOR)

    if (!crudo) {
      return null
    }

    return mergeContenido(CONTENIDO_DEFAULT, JSON.parse(crudo))
  } catch {
    return null
  }
}

export function guardarBorrador(contenido: Contenido): boolean {
  try {
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(contenido))
    return true
  } catch {
    return false
  }
}
