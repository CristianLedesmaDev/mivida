import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import './App.css'
import {
  CLAVE_PREVIEW,
  CONTENIDO_DEFAULT,
  leerBorrador,
  mergeContenido,
  type Contenido,
} from './content'
import { AdminPanel } from './AdminPanel'
import { FloatingHearts } from './components/FloatingHearts'
import { GlassFilter } from './components/GlassFilter'
import { AnimatedEmoji } from './components/AnimatedEmoji'
import { Entrada } from './scenes/Entrada'
import { Bienvenida } from './scenes/Bienvenida'
import { Contador } from './scenes/Contador'
import { Carta } from './scenes/Carta'
import { Polaroids } from './scenes/Polaroids'
import { Razones } from './scenes/Razones'
import { Idiomas } from './scenes/Idiomas'
import { Historia } from './scenes/Historia'
import { Musica } from './scenes/Musica'
import { Final } from './scenes/Final'

type Ruta = 'experiencia' | 'panel'

const ESCENAS = [
  { id: 'entrada', emoji: '🔐' },
  { id: 'bienvenida', emoji: '👋' },
  { id: 'contador', emoji: '⏳' },
  { id: 'carta', emoji: '💌' },
  { id: 'fotos', emoji: '📸' },
  { id: 'razones', emoji: '💘' },
  { id: 'idiomas', emoji: '🌍' },
  { id: 'historia', emoji: '🪐' },
  { id: 'musica', emoji: '🎧' },
  { id: 'final', emoji: '♾️' },
]

function rutaActual(): Ruta {
  return window.location.hash.replace('#', '') === 'panel' ? 'panel' : 'experiencia'
}

function Experiencia({ contenido, enPreview }: { contenido: Contenido; enPreview: boolean }) {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [indice])

  const avanzar = () => setIndice((actual) => Math.min(actual + 1, ESCENAS.length - 1))
  const reiniciar = () => setIndice(0)

  const salirPreview = () => {
    sessionStorage.removeItem(CLAVE_PREVIEW)
    window.location.hash = 'panel'
  }

  const escenas = [
    <Entrada key="entrada" contenido={contenido} onNext={avanzar} />,
    <Bienvenida key="bienvenida" contenido={contenido} onNext={avanzar} />,
    <Contador key="contador" contenido={contenido} onNext={avanzar} />,
    <Carta key="carta" contenido={contenido} onNext={avanzar} />,
    <Polaroids key="fotos" contenido={contenido} onNext={avanzar} />,
    <Razones key="razones" contenido={contenido} onNext={avanzar} />,
    <Idiomas key="idiomas" contenido={contenido} onNext={avanzar} />,
    <Historia key="historia" contenido={contenido} onNext={avanzar} />,
    <Musica key="musica" contenido={contenido} onNext={avanzar} />,
    <Final key="final" contenido={contenido} onRestart={reiniciar} />,
  ]

  return (
    <div className="experiencia">
      {indice > 0 && <FloatingHearts />}

      {enPreview && (
        <button className="chip-preview" type="button" onClick={salirPreview}>
          <X size={14} />
          vista previa — volver al panel
        </button>
      )}

      {indice > 0 && (
        <button
          className="boton-atras"
          type="button"
          aria-label="Regresar"
          onClick={() => setIndice((actual) => Math.max(actual - 1, 0))}
        >
          <ArrowLeft size={18} />
        </button>
      )}

      <div key={indice} className="escena-marco">
        {escenas[indice]}
      </div>

      {indice > 0 && (
        <nav className="dock liquid-glass" aria-label="Progreso">
          {ESCENAS.map((escena, escenaIndice) => (
            <button
              key={escena.id}
              type="button"
              className={`dock-icono ${escenaIndice === indice ? 'dock-activo' : ''} ${escenaIndice < indice ? 'dock-visto' : ''}`}
              aria-label={`Ir a ${escena.id}`}
              onClick={() => setIndice(escenaIndice)}
            >
              <AnimatedEmoji emoji={escena.emoji} size={26} />
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

function App() {
  const [ruta, setRuta] = useState<Ruta>(rutaActual)
  const [publicado, setPublicado] = useState<Contenido>(CONTENIDO_DEFAULT)

  useEffect(() => {
    const onHashChange = () => setRuta(rutaActual())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    // El contenido publicado vive en public/contenido.json; así el panel
    // puede actualizar la página publicando directo a GitHub, sin servidor.
    let cancelado = false

    fetch(`${import.meta.env.BASE_URL}contenido.json?v=${Date.now()}`)
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((datos) => {
        if (!cancelado && datos) {
          setPublicado(mergeContenido(CONTENIDO_DEFAULT, datos))
        }
      })
      .catch(() => {})

    return () => {
      cancelado = true
    }
  }, [])

  const enPreview = ruta === 'experiencia' && sessionStorage.getItem(CLAVE_PREVIEW) === '1'

  const contenido = useMemo(() => {
    if (enPreview) {
      return leerBorrador() ?? publicado
    }

    return publicado
  }, [enPreview, publicado])

  return (
    <>
      <GlassFilter />
      {ruta === 'panel' ? (
        <AdminPanel publicado={publicado} />
      ) : (
        <Experiencia
          key={enPreview ? 'preview' : 'normal'}
          contenido={contenido}
          enPreview={enPreview}
        />
      )}
    </>
  )
}

export default App
