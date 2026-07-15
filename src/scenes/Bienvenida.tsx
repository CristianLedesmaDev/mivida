import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Contenido } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'

type BienvenidaProps = {
  contenido: Contenido
  onNext: () => void
}

function useTypewriter(texto: string, velocidad = 34) {
  const [visibles, setVisibles] = useState(0)
  const terminado = visibles >= texto.length

  useEffect(() => {
    setVisibles(0)
  }, [texto])

  useEffect(() => {
    if (terminado) {
      return
    }

    const id = setInterval(() => {
      setVisibles((actual) => Math.min(actual + 1, texto.length))
    }, velocidad)

    return () => clearInterval(id)
  }, [texto, velocidad, terminado])

  return { escrito: texto.slice(0, visibles), terminado }
}

export function Bienvenida({ contenido, onNext }: BienvenidaProps) {
  const { escrito, terminado } = useTypewriter(contenido.bienvenida.texto)

  return (
    <section className="escena">
      <div className="tarjeta-escena tarjeta-bienvenida">
        <AnimatedEmoji emoji="🫶" size={72} />
        <h2 className="titulo-escena">{contenido.bienvenida.titulo}</h2>
        <p className="texto-maquina">
          {escrito}
          {!terminado && <span className="caret" />}
        </p>

        <button
          className={`btn-amor ${terminado ? '' : 'btn-esperando'}`}
          type="button"
          onClick={onNext}
        >
          empezar el recorrido
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  )
}
