import { useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import type { Contenido, Foto } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'

type PolaroidsProps = {
  contenido: Contenido
  onNext: () => void
}

const ROTACIONES = [-4, 3, -2, 5, -5, 2, -3, 4]

export function Polaroids({ contenido, onNext }: PolaroidsProps) {
  const [fotoAbierta, setFotoAbierta] = useState<Foto | null>(null)

  return (
    <section className="escena">
      <div className="tarjeta-escena tarjeta-fotos">
        <AnimatedEmoji emoji="📸" size={60} />
        <h2 className="titulo-escena">Nuestros recuerdos</h2>
        <p className="subtitulo-escena">toca una foto para verla de cerca</p>

        {contenido.fotos.length === 0 ? (
          <p className="fotos-vacio">Muy pronto este espacio se va a llenar de nosotros 💞</p>
        ) : (
          <div className="polaroid-grid">
            {contenido.fotos.map((foto, index) => (
              <button
                key={foto.id}
                type="button"
                className="polaroid"
                style={{ ['--rot' as string]: `${ROTACIONES[index % ROTACIONES.length]}deg` }}
                onClick={() => setFotoAbierta(foto)}
              >
                <img src={foto.src} alt={foto.caption} loading="lazy" />
                <span className="polaroid-caption">{foto.caption}</span>
              </button>
            ))}
          </div>
        )}

        <button className="btn-amor" type="button" onClick={onNext}>
          te tengo algo más
          <ArrowRight size={18} />
        </button>
      </div>

      {fotoAbierta && (
        <div className="lightbox" role="presentation" onClick={() => setFotoAbierta(null)}>
          <figure className="lightbox-figura" onClick={(event) => event.stopPropagation()}>
            <img src={fotoAbierta.src} alt={fotoAbierta.caption} />
            <figcaption>{fotoAbierta.caption}</figcaption>
            <button
              type="button"
              className="lightbox-cerrar"
              onClick={() => setFotoAbierta(null)}
              aria-label="Cerrar foto"
            >
              <X size={18} />
            </button>
          </figure>
        </div>
      )}
    </section>
  )
}
