import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Pause, Play } from 'lucide-react'
import type { AudioClip, Contenido } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'
import { InView } from '../components/InView'

type AudiosProps = {
  contenido: Contenido
  onNext: () => void
}

function AudioCard({ audio, indice }: { audio: AudioClip; indice: number }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [sonando, setSonando] = useState(false)
  const [progreso, setProgreso] = useState(0)

  useEffect(() => {
    const elemento = audioRef.current

    if (!elemento) {
      return
    }

    const actualizarProgreso = () => {
      if (elemento.duration) {
        setProgreso(elemento.currentTime / elemento.duration)
      }
    }

    const alTerminar = () => {
      setSonando(false)
      setProgreso(0)
    }

    elemento.addEventListener('timeupdate', actualizarProgreso)
    elemento.addEventListener('ended', alTerminar)

    return () => {
      elemento.removeEventListener('timeupdate', actualizarProgreso)
      elemento.removeEventListener('ended', alTerminar)
    }
  }, [])

  const alternar = () => {
    const elemento = audioRef.current

    if (!elemento) {
      return
    }

    if (sonando) {
      elemento.pause()
      setSonando(false)
    } else {
      elemento.play()
      setSonando(true)
    }
  }

  return (
    <InView
      transition={{ duration: 0.5, delay: indice * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="tarjeta-audio liquid-glass"
    >
      <button
        type="button"
        className={`audio-play-btn ${sonando ? 'audio-sonando' : ''}`}
        onClick={alternar}
        aria-label={sonando ? 'Pausar' : 'Reproducir'}
      >
        {sonando ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>

      <div className="audio-meta">
        <strong>{audio.titulo || 'Nota de voz'}</strong>
        {audio.nota && <span>{audio.nota}</span>}
        <div className="audio-barra">
          <span className="audio-barra-relleno" style={{ width: `${progreso * 100}%` }} />
        </div>
      </div>

      <audio ref={audioRef} src={audio.src} preload="none" />
    </InView>
  )
}

export function Audios({ contenido, onNext }: AudiosProps) {
  const { items } = contenido.audios

  return (
    <section className="escena">
      <div className="tarjeta-escena tarjeta-audios">
        <AnimatedEmoji emoji="🎙️" size={60} />
        <h2 className="titulo-escena">{contenido.audios.titulo}</h2>
        <p className="subtitulo-escena">{contenido.audios.subtitulo}</p>

        {items.length === 0 ? (
          <p className="audios-vacio">
            Muy pronto aquí vas a poder escuchar mi voz diciéndote cosas bonitas 🎧
          </p>
        ) : (
          <div className="audios-lista">
            {items.map((audio, indice) => (
              <AudioCard key={audio.id} audio={audio} indice={indice} />
            ))}
          </div>
        )}

        <button className="btn-amor" type="button" onClick={onNext}>
          por último…
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  )
}
