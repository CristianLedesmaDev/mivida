export type SpotifyRef = {
  tipo: 'track' | 'album' | 'playlist' | 'episode'
  id: string
}

// Acepta links como:
// https://open.spotify.com/track/xxx, https://open.spotify.com/intl-es/track/xxx?si=...
export function parseSpotify(url: string | undefined): SpotifyRef | null {
  if (!url) {
    return null
  }

  const match = url.match(
    /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/i
  )

  if (!match) {
    return null
  }

  return { tipo: match[1].toLowerCase() as SpotifyRef['tipo'], id: match[2] }
}

export function spotifyEmbedUrl(ref: SpotifyRef): string {
  return `https://open.spotify.com/embed/${ref.tipo}/${ref.id}`
}

// Código Spotify escaneable (fondo rosa pastel, barras negras).
export function spotifyScanUrl(ref: SpotifyRef): string {
  return `https://scannables.scdn.co/uri/plain/jpeg/ffe3ea/black/640/spotify:${ref.tipo}:${ref.id}`
}

export function spotifyEmbedAlto(ref: SpotifyRef): number {
  return ref.tipo === 'track' || ref.tipo === 'episode' ? 152 : 352
}

export type SpotifyPortada = {
  titulo: string
  miniatura: string | null
}

// Trae la portada real y el título desde la API pública de oEmbed de Spotify
// (sin necesitar cuenta de desarrollador ni llaves).
export async function obtenerPortadaSpotify(url: string): Promise<SpotifyPortada | null> {
  try {
    const respuesta = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)

    if (!respuesta.ok) {
      return null
    }

    const datos = await respuesta.json()

    return {
      titulo: typeof datos.title === 'string' ? datos.title : '',
      miniatura: typeof datos.thumbnail_url === 'string' ? datos.thumbnail_url : null,
    }
  } catch {
    return null
  }
}
