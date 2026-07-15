import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Contenido } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'

type IdiomasProps = {
  contenido: Contenido
  onNext: () => void
}

export function Idiomas({ contenido, onNext }: IdiomasProps) {
  const items = contenido.idiomas.items
  const [indice, setIndice] = useState(0)
  const [autoRotar, setAutoRotar] = useState(true)

  useEffect(() => {
    if (!autoRotar || items.length < 2) {
      return
    }

    const id = setInterval(() => {
      setIndice((actual) => (actual + 1) % items.length)
    }, 2300)

    return () => clearInterval(id)
  }, [autoRotar, items.length])

  const actual = items[indice % Math.max(items.length, 1)]

  return (
    <section className="escena">
      <div className="tarjeta-escena tarjeta-idiomas">
        <AnimatedEmoji emoji="🌍" size={60} />
        <h2 className="titulo-escena titulo-final">{contenido.idiomas.titulo}</h2>
        <p className="subtitulo-escena">{contenido.idiomas.subtitulo}</p>

        {actual && (
          <div className="idioma-destacado">
            <div key={actual.id} className="idioma-cambio">
              <span className="idioma-nombre">{actual.idioma}</span>
              <strong className="idioma-texto">{actual.texto}</strong>
              <span className="idioma-nota">{actual.nota ? `se dice: "${actual.nota}"` : ' '}</span>
            </div>
          </div>
        )}

        <div className="idioma-chips">
          {items.map((item, itemIndice) => (
            <button
              key={item.id}
              type="button"
              className={`idioma-chip ${itemIndice === indice ? 'idioma-chip-activo' : ''}`}
              onClick={() => {
                setIndice(itemIndice)
                setAutoRotar(false)
              }}
            >
              {item.idioma}
            </button>
          ))}
        </div>

        <button className="btn-amor" type="button" onClick={onNext}>
          una cosita más
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  )
}
