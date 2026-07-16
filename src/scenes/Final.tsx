import { Suspense, useRef, useState } from 'react'
import { Heart, RotateCcw } from 'lucide-react'
import type { Contenido } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'
import { ShaderBackgroundLazy } from '../components/ShaderBackgroundLazy'

type FinalProps = {
  contenido: Contenido
  onRestart: () => void
}

type Beso = {
  id: string
  left: number
  emoji: string
  duracion: number
}

const EMOJIS_BESO = ['💋', '❤️', '💖', '😘', '💕', '✨']

function MarqueeApodos({ apodos }: { apodos: string[] }) {
  const apodosValidos = apodos.map((apodo) => apodo.trim()).filter(Boolean)

  if (apodosValidos.length === 0) {
    return null
  }

  const fila = apodosValidos.join('  ✦  ')

  return (
    <div className="marquee-apodos" aria-hidden="true">
      <div className="marquee-pista">
        <span>{fila}&nbsp;&nbsp;✦&nbsp;&nbsp;</span>
        <span>{fila}&nbsp;&nbsp;✦&nbsp;&nbsp;</span>
      </div>
    </div>
  )
}

export function Final({ contenido, onRestart }: FinalProps) {
  const [besos, setBesos] = useState<Beso[]>([])
  const clicksSecretos = useRef(0)

  const lanzarBesos = () => {
    const nuevos: Beso[] = Array.from({ length: 9 }, () => ({
      id: crypto.randomUUID(),
      left: 8 + Math.random() * 84,
      emoji: EMOJIS_BESO[Math.floor(Math.random() * EMOJIS_BESO.length)],
      duracion: 1.6 + Math.random() * 1.2,
    }))

    setBesos((previos) => [...previos, ...nuevos])

    const ids = new Set(nuevos.map((beso) => beso.id))
    setTimeout(() => {
      setBesos((previos) => previos.filter((beso) => !ids.has(beso.id)))
    }, 3000)
  }

  const clickSecreto = () => {
    clicksSecretos.current += 1

    if (clicksSecretos.current >= 5) {
      clicksSecretos.current = 0
      window.location.hash = 'panel'
    }
  }

  return (
    <section className="escena">
      <Suspense fallback={null}>
        <ShaderBackgroundLazy />
      </Suspense>

      <div className="tarjeta-escena tarjeta-final">
        <MarqueeApodos apodos={contenido.apodos} />

        <AnimatedEmoji emoji="♾️" size={64} />
        <h2 className="titulo-escena titulo-final">{contenido.final.titulo}</h2>
        <p className="final-mensaje">{contenido.final.mensaje}</p>

        <div className="final-acciones">
          <button className="btn-amor" type="button" onClick={lanzarBesos}>
            <Heart size={18} fill="currentColor" />
            presiona para recibir besos
          </button>
          <button className="btn-suave" type="button" onClick={onRestart}>
            <RotateCcw size={16} />
            volver a empezar
          </button>
        </div>

        <div className="lluvia-besos" aria-hidden="true">
          {besos.map((beso) => (
            <span
              key={beso.id}
              className="beso"
              style={{ left: `${beso.left}%`, animationDuration: `${beso.duracion}s` }}
            >
              {beso.emoji}
            </span>
          ))}
        </div>
      </div>

      <footer className="pie-final">
        hecho con{' '}
        <button type="button" className="corazon-secreto" onClick={clickSecreto} aria-label="corazón">
          ❤
        </button>{' '}
        para {contenido.nombre}
      </footer>
    </section>
  )
}
