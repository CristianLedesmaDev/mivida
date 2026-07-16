import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Contenido } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'

type CartaProps = {
  contenido: Contenido
  onNext: () => void
}

export function Carta({ contenido, onNext }: CartaProps) {
  const [fase, setFase] = useState<'cerrada' | 'abriendo' | 'abierta'>('cerrada')

  const abrir = () => {
    if (fase !== 'cerrada') {
      return
    }

    setFase('abriendo')
    setTimeout(() => setFase('abierta'), 850)
  }

  return (
    <section className="escena">
      {fase !== 'abierta' ? (
        <div className="sobre-zona">
          <h2 className="titulo-escena">Te llegó una cartita</h2>
          <p className="subtitulo-escena">de parte de alguien que piensa mucho en ti</p>

          <button
            type="button"
            className={`sobre ${fase === 'abriendo' ? 'sobre-abriendo' : ''}`}
            onClick={abrir}
            aria-label="Abrir la carta"
          >
            <span className="sobre-solapa" />
            <span className="sobre-cuerpo" />
            <span className="sobre-carta-asoma" />
            <span className="sobre-sello">
              <AnimatedEmoji emoji="❤️" size={46} />
            </span>
          </button>

          <p className="sobre-hint">{fase === 'cerrada' ? 'tócalo para abrirlo' : 'abriendo…'}</p>
        </div>
      ) : (
        <article className="carta-papel">
          <div className="carta-adorno">
            <AnimatedEmoji emoji="💌" size={52} />
          </div>

          <h2 className="carta-titulo">{contenido.carta.titulo}</h2>

          {contenido.carta.parrafos
            .filter((parrafo) => parrafo.trim().length > 0)
            .map((parrafo, index) => (
              <p key={index} className="carta-parrafo">
                {parrafo}
              </p>
            ))}

          <p className="carta-despedida">{contenido.carta.despedida}</p>
          <p className="carta-firma">{contenido.firma}</p>

          <button className="btn-amor" type="button" onClick={onNext}>
            ahora, unas fotos
            <ArrowRight size={18} />
          </button>
        </article>
      )}
    </section>
  )
}
