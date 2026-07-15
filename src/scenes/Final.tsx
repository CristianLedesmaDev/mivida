import { Suspense, useRef, useState } from 'react'
import { Heart, Music4, RotateCcw } from 'lucide-react'
import type { Contenido } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'
import { ShaderBackgroundLazy } from '../components/ShaderBackgroundLazy'
import { parseSpotify, spotifyEmbedAlto, spotifyEmbedUrl, spotifyScanUrl } from '../spotify'

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
  if (apodos.length === 0) {
    return null
  }

  const fila = apodos.map((apodo) => apodo).join('  ✦  ')

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
  const playlistRef = parseSpotify(contenido.final.spotifyPlaylistUrl)

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

        <div className="playlist">
          {playlistRef && (
            <div className="spotify-playlist-grande">
              <span className="playlist-titulo">
                <Music4 size={16} />
                nuestra playlist completa
              </span>
              <div className="spotify-card spotify-card-grande">
                <iframe
                  src={spotifyEmbedUrl(playlistRef)}
                  width="100%"
                  height={spotifyEmbedAlto(playlistRef)}
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title="Nuestra playlist de Spotify"
                />
                <img
                  className="spotify-scan"
                  src={spotifyScanUrl(playlistRef)}
                  alt="Código Spotify de nuestra playlist"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}

          <span className="playlist-titulo">
            <Music4 size={16} />
            canciones que me suenan a ti
          </span>

          <div className="playlist-lista">
            {contenido.final.playlist.map((cancion) => {
              const ref = parseSpotify(cancion.url)

              if (!ref) {
                return (
                  <span key={cancion.id} className="playlist-chip">
                    🎵 {cancion.titulo}
                    {cancion.artista ? ` — ${cancion.artista}` : ''}
                  </span>
                )
              }

              return (
                <div key={cancion.id} className="spotify-card">
                  <iframe
                    src={spotifyEmbedUrl(ref)}
                    width="100%"
                    height={spotifyEmbedAlto(ref)}
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={cancion.titulo || 'Canción de Spotify'}
                  />
                  <img
                    className="spotify-scan"
                    src={spotifyScanUrl(ref)}
                    alt={`Código Spotify de ${cancion.titulo || 'la canción'}`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

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
