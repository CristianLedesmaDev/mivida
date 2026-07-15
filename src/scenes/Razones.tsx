import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Contenido } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'

type RazonesProps = {
  contenido: Contenido
  onNext: () => void
}

const TODAS = 'Todas'

export function Razones({ contenido, onNext }: RazonesProps) {
  const [volteadas, setVolteadas] = useState<Set<string>>(new Set())
  const [categoria, setCategoria] = useState(TODAS)

  const categorias = useMemo(() => {
    const encontradas = new Set<string>()
    contenido.razones.items.forEach((razon) => {
      if (razon.categoria) {
        encontradas.add(razon.categoria)
      }
    })
    return [TODAS, ...encontradas]
  }, [contenido.razones.items])

  const visibles = useMemo(
    () =>
      categoria === TODAS
        ? contenido.razones.items
        : contenido.razones.items.filter((razon) => razon.categoria === categoria),
    [categoria, contenido.razones.items]
  )

  const voltear = (id: string) => {
    setVolteadas((previas) => {
      const siguientes = new Set(previas)
      siguientes.add(id)
      return siguientes
    })
  }

  const todasVolteadas = visibles.length > 0 && visibles.every((razon) => volteadas.has(razon.id))

  return (
    <section className="escena">
      <div className="tarjeta-escena tarjeta-razones">
        <AnimatedEmoji emoji="💘" size={60} />
        <h2 className="titulo-escena">{contenido.razones.titulo}</h2>
        <p className="subtitulo-escena">destápalas una por una</p>

        {categorias.length > 2 && (
          <div className="razones-filtros">
            {categorias.map((item) => (
              <button
                key={item}
                type="button"
                className={`idioma-chip ${categoria === item ? 'idioma-chip-activo' : ''}`}
                onClick={() => setCategoria(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <div key={categoria} className="razones-grid">
          {visibles.map((razon, index) => {
            const volteada = volteadas.has(razon.id)

            return (
              <button
                key={razon.id}
                type="button"
                className={`razon-carta ${volteada ? 'razon-volteada' : ''}`}
                onClick={() => voltear(razon.id)}
              >
                <span className="razon-inner">
                  <span className="razon-frente">
                    <strong>{index + 1}</strong>
                    <span>toca aquí</span>
                  </span>
                  <span className="razon-reverso">
                    <span className="razon-emoji">{razon.emoji}</span>
                    <span>{razon.texto}</span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {todasVolteadas && (
          <p className="razones-completas">¡las destapaste todas! y aún me faltan mil 💖</p>
        )}

        <button className="btn-amor" type="button" onClick={onNext}>
          ya casi terminamos
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  )
}
