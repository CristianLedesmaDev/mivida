import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import type { Contenido, Foto } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'

type PolaroidsProps = {
  contenido: Contenido
  onNext: () => void
}

const contenedorVariantes = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
}

const cardVariantes = {
  oculto: { opacity: 0, y: 46, scale: 0.82, rotate: -6 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 170, damping: 18 },
  },
}

export function Polaroids({ contenido, onNext }: PolaroidsProps) {
  const [fotoAbierta, setFotoAbierta] = useState<Foto | null>(null)
  const [activa, setActiva] = useState<string | null>(null)

  return (
    <section className="escena">
      <div className="tarjeta-escena tarjeta-fotos">
        <AnimatedEmoji emoji="📸" size={60} />
        <h2 className="titulo-escena">Nuestros recuerdos</h2>
        <p className="subtitulo-escena">pasa el mouse (o el dedo) — toca una para verla de cerca</p>

        {contenido.fotos.length === 0 ? (
          <p className="fotos-vacio">Muy pronto este espacio se va a llenar de nosotros 💞</p>
        ) : (
          <motion.div
            className="dock-fotos"
            initial="oculto"
            animate="visible"
            variants={contenedorVariantes}
            onMouseLeave={() => setActiva(null)}
          >
            {contenido.fotos.map((foto) => (
              <motion.button
                key={foto.id}
                type="button"
                className={`dock-foto ${activa && activa !== foto.id ? 'dock-foto-opaca' : ''}`}
                variants={cardVariantes}
                style={activa === foto.id ? { flexGrow: 5 } : undefined}
                onMouseEnter={() => setActiva(foto.id)}
                onFocus={() => setActiva(foto.id)}
                onBlur={() => setActiva(null)}
                onClick={() => setFotoAbierta(foto)}
              >
                <img src={foto.src} alt={foto.caption} loading="lazy" />
                <span className="dock-foto-brillo" aria-hidden="true" />
                <span className="dock-foto-caption">{foto.caption}</span>
              </motion.button>
            ))}
          </motion.div>
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
