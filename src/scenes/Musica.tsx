import { useEffect, useState } from 'react'
import { ArrowRight, Heart, Music4, Repeat2, Shuffle, SkipBack, SkipForward, X } from 'lucide-react'
import type { Contenido, SpotifyCancion, SpotifyPlaylist } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'
import { InView } from '../components/InView'
import {
  obtenerPortadaSpotify,
  parseSpotify,
  spotifyEmbedAlto,
  spotifyEmbedUrl,
  spotifyScanUrl,
  type SpotifyPortada,
  type SpotifyRef,
} from '../spotify'

type MusicaProps = {
  contenido: Contenido
  onNext: () => void
}

function LogoSpotify({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1ED760" />
      <path
        d="M6.5 15.4c3.6-1.1 6.9-.8 10 1"
        stroke="#0b1f10"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6.8 12.1c3-1 6.4-.7 9.4.9"
        stroke="#0b1f10"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M7 8.7c3.5-1 7.4-.6 10.3 1.1"
        stroke="#0b1f10"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TarjetaPlaca({
  refSpotify,
  portada,
  titulo,
  subtitulo,
  altoEmbed,
  urlEmbed,
  tituloEmbed,
}: {
  refSpotify: SpotifyRef
  portada: SpotifyPortada | null
  titulo: string
  subtitulo: string
  altoEmbed: number
  urlEmbed: string
  tituloEmbed: string
}) {
  const [expandido, setExpandido] = useState(false)
  const [favorito, setFavorito] = useState(false)

  if (expandido) {
    return (
      <div className="placa">
        <div className="placa-reproductor placa-aparece">
          <button className="placa-cerrar" type="button" onClick={() => setExpandido(false)} aria-label="Cerrar reproductor">
            <X size={15} />
          </button>
          <iframe
            src={urlEmbed}
            width="100%"
            height={altoEmbed}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={tituloEmbed}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="placa">
      <div className="placa-aparece">
        <div className="placa-portada">
          {portada?.miniatura ? (
            <img src={portada.miniatura} alt={titulo} />
          ) : (
            <Music4 size={34} />
          )}
        </div>

        <div className="placa-fila-titulo">
          <div className="placa-texto">
            <strong>{titulo}</strong>
            <span>{subtitulo}</span>
          </div>
          <button
            type="button"
            className={`placa-corazon ${favorito ? 'placa-corazon-activo' : ''}`}
            onClick={() => setFavorito((actual) => !actual)}
            aria-label="Favorito"
          >
            <Heart size={17} fill={favorito ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="placa-divisor" />

        <div className="placa-controles">
          <Shuffle size={16} className="placa-control-mudo" />
          <SkipBack size={18} className="placa-control-mudo" />
          <button className="placa-play" type="button" onClick={() => setExpandido(true)} aria-label="Reproducir">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <SkipForward size={18} className="placa-control-mudo" />
          <Repeat2 size={16} className="placa-control-mudo" />
        </div>

        <div className="placa-pie">
          <LogoSpotify size={18} />
          <img
            className="placa-scan"
            src={spotifyScanUrl(refSpotify)}
            alt="Código Spotify"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        </div>
      </div>
    </div>
  )
}

function TarjetaCancion({ cancion, indice }: { cancion: SpotifyCancion; indice: number }) {
  const ref = parseSpotify(cancion.url)
  const [portada, setPortada] = useState<SpotifyPortada | null>(null)

  useEffect(() => {
    if (!cancion.url) {
      return
    }

    let activo = true
    obtenerPortadaSpotify(cancion.url).then((datos) => {
      if (activo) {
        setPortada(datos)
      }
    })

    return () => {
      activo = false
    }
  }, [cancion.url])

  return (
    <InView
      transition={{ duration: 0.45, delay: indice * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="spotify-tarjeta"
    >
      {ref ? (
        <TarjetaPlaca
          refSpotify={ref}
          portada={portada}
          titulo={cancion.titulo || portada?.titulo || 'Canción'}
          subtitulo={cancion.artista}
          altoEmbed={spotifyEmbedAlto(ref)}
          urlEmbed={spotifyEmbedUrl(ref)}
          tituloEmbed={cancion.titulo || 'Canción de Spotify'}
        />
      ) : (
        <div className="spotify-pendiente liquid-glass">
          <Music4 size={28} />
          <strong>{cancion.titulo || 'Canción'}</strong>
          {cancion.artista && <span>{cancion.artista}</span>}
        </div>
      )}
    </InView>
  )
}

function TarjetaPlaylist({ playlist, indice }: { playlist: SpotifyPlaylist; indice: number }) {
  const ref = parseSpotify(playlist.url)
  const [portada, setPortada] = useState<SpotifyPortada | null>(null)

  useEffect(() => {
    if (!playlist.url) {
      return
    }

    let activo = true
    obtenerPortadaSpotify(playlist.url).then((datos) => {
      if (activo) {
        setPortada(datos)
      }
    })

    return () => {
      activo = false
    }
  }, [playlist.url])

  if (!ref) {
    return null
  }

  return (
    <InView
      transition={{ duration: 0.5, delay: indice * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="spotify-tarjeta spotify-tarjeta-playlist"
    >
      <TarjetaPlaca
        refSpotify={ref}
        portada={portada}
        titulo={playlist.etiqueta || portada?.titulo || 'Nuestra playlist'}
        subtitulo="playlist completa"
        altoEmbed={spotifyEmbedAlto(ref)}
        urlEmbed={spotifyEmbedUrl(ref)}
        tituloEmbed={playlist.etiqueta || 'Playlist de Spotify'}
      />
    </InView>
  )
}

export function Musica({ contenido, onNext }: MusicaProps) {
  const { playlists, canciones } = contenido.musica
  const hayContenido = playlists.length > 0 || canciones.length > 0

  return (
    <section className="escena">
      <div className="tarjeta-escena tarjeta-musica">
        <AnimatedEmoji emoji="🎧" size={60} />
        <h2 className="titulo-escena">{contenido.musica.titulo}</h2>
        <p className="subtitulo-escena">{contenido.musica.subtitulo}</p>

        {playlists.length > 0 && (
          <div className="musica-bloque">
            <span className="musica-etiqueta-seccion">nuestras playlists</span>
            <div className="musica-playlists">
              {playlists.map((playlist, indice) => (
                <TarjetaPlaylist key={playlist.id} playlist={playlist} indice={indice} />
              ))}
            </div>
          </div>
        )}

        {canciones.length > 0 && (
          <div className="musica-bloque">
            <span className="musica-etiqueta-seccion">canciones que nos suenan</span>
            <div className="musica-canciones">
              {canciones.map((cancion, indice) => (
                <TarjetaCancion key={cancion.id} cancion={cancion} indice={indice} />
              ))}
            </div>
          </div>
        )}

        {!hayContenido && (
          <p className="musica-vacio">Muy pronto aquí van a estar todas nuestras canciones 🎶</p>
        )}

        <button className="btn-amor" type="button" onClick={onNext}>
          por último…
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  )
}
