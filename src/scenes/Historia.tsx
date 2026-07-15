import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { Contenido, Hito } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'

type HistoriaProps = {
  contenido: Contenido
  onNext: () => void
}

const RADIO = 118

export function Historia({ contenido, onNext }: HistoriaProps) {
  const items = contenido.historia.items
  const [angulo, setAngulo] = useState(0)
  const [autoRotar, setAutoRotar] = useState(true)
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!autoRotar || items.length < 2) {
      return
    }

    intervalRef.current = setInterval(() => {
      setAngulo((previo) => (previo + 0.35) % 360)
    }, 40)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRotar, items.length])

  const seleccionado = items.find((item) => item.id === seleccionadoId) ?? null

  const elegir = (hito: Hito, indice: number) => {
    if (seleccionadoId === hito.id) {
      setSeleccionadoId(null)
      setAutoRotar(true)
      return
    }

    setSeleccionadoId(hito.id)
    setAutoRotar(false)

    const anguloObjetivo = (indice / items.length) * 360
    setAngulo(((270 - anguloObjetivo) % 360 + 360) % 360)
  }

  return (
    <section className="escena">
      <div className="tarjeta-escena tarjeta-historia">
        <AnimatedEmoji emoji="🪐" size={58} />
        <h2 className="titulo-escena">{contenido.historia.titulo}</h2>
        <p className="subtitulo-escena">{contenido.historia.subtitulo}</p>

        <div className="orbita-zona">
          <div className="orbita-anillo" />
          <div className="orbita-centro">
            <AnimatedEmoji emoji="💞" size={30} />
          </div>

          {items.map((hito, indice) => {
            const anguloNodo = ((indice / items.length) * 360 + angulo) % 360
            const radianes = (anguloNodo * Math.PI) / 180
            const x = RADIO * Math.cos(radianes)
            const y = RADIO * Math.sin(radianes)
            const activo = seleccionadoId === hito.id

            return (
              <motion.button
                key={hito.id}
                type="button"
                className={`orbita-nodo ${activo ? 'orbita-nodo-activo' : ''}`}
                style={{ zIndex: activo ? 20 : 10 }}
                animate={{ x, y, scale: activo ? 1.28 : 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                onClick={() => elegir(hito, indice)}
                aria-label={hito.titulo}
              >
                <span className="orbita-nodo-emoji">{hito.emoji}</span>
                <span className="orbita-nodo-fecha">{hito.fecha}</span>
              </motion.button>
            )
          })}
        </div>

        <div className="orbita-detalle-zona">
          <AnimatePresence mode="wait">
            {seleccionado ? (
              <motion.article
                key={seleccionado.id}
                className="orbita-detalle liquid-glass"
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="orbita-detalle-fecha">{seleccionado.fecha}</span>
                <h3>{seleccionado.titulo}</h3>
                <p>{seleccionado.texto}</p>
              </motion.article>
            ) : (
              <motion.p
                key="hint"
                className="orbita-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                toca cualquier punto de la órbita ✨
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <button className="btn-amor" type="button" onClick={onNext}>
          sigue escuchando
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  )
}
