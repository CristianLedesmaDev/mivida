import { CLAVE_GITHUB, type Contenido } from './content'

export type ConfigGitHub = {
  owner: string
  repo: string
  token: string
}

const RUTA_ARCHIVO = 'public/contenido.json'
const RAMA = 'main'

export function leerConfigGitHub(): ConfigGitHub {
  try {
    const crudo = localStorage.getItem(CLAVE_GITHUB)

    if (crudo) {
      const dato = JSON.parse(crudo)
      return {
        owner: typeof dato.owner === 'string' ? dato.owner : '',
        repo: typeof dato.repo === 'string' ? dato.repo : '',
        token: typeof dato.token === 'string' ? dato.token : '',
      }
    }
  } catch {
    // config corrupta: se empieza de cero
  }

  return { owner: '', repo: '', token: '' }
}

export function guardarConfigGitHub(config: ConfigGitHub) {
  try {
    localStorage.setItem(CLAVE_GITHUB, JSON.stringify(config))
  } catch {
    // sin espacio: no pasa nada, solo no se recuerda
  }
}

export function configGitHubCompleta(config: ConfigGitHub): boolean {
  return Boolean(config.owner.trim() && config.repo.trim() && config.token.trim())
}

// btoa solo acepta latin1; convertimos el JSON (con emojis y fotos en base64)
// por bloques para no reventar el límite de argumentos de String.fromCharCode.
function aBase64(texto: string): string {
  const bytes = new TextEncoder().encode(texto)
  let binario = ''
  const bloque = 0x8000

  for (let i = 0; i < bytes.length; i += bloque) {
    binario += String.fromCharCode(...bytes.subarray(i, i + bloque))
  }

  return btoa(binario)
}

async function obtenerSha(config: ConfigGitHub, headers: Record<string, string>): Promise<string | undefined> {
  const base = `https://api.github.com/repos/${config.owner}/${config.repo}`

  const respuesta = await fetch(`${base}/contents/${RUTA_ARCHIVO}?ref=${RAMA}`, { headers })

  if (respuesta.ok) {
    const dato = await respuesta.json()

    if (dato && typeof dato.sha === 'string') {
      return dato.sha
    }
  }

  if (respuesta.status === 401) {
    throw new Error('GitHub dice que el token no es válido. Revisa que lo copiaste completo.')
  }

  if (respuesta.status === 404) {
    // Puede ser que el archivo no exista todavía (se creará) o que el repo esté mal.
    const repoRespuesta = await fetch(base, { headers })

    if (!repoRespuesta.ok) {
      throw new Error('No encontré ese repositorio. Revisa tu usuario y el nombre del repo.')
    }

    return undefined
  }

  // El archivo puede ser muy grande para la API de contents (fotos en base64
  // suelen pasar el límite de 1MB); buscamos el sha directo en el árbol de git.
  const arbol = await fetch(`${base}/git/trees/${RAMA}?recursive=1`, { headers })

  if (arbol.ok) {
    const dato = await arbol.json()
    const entrada = Array.isArray(dato.tree)
      ? dato.tree.find((item: { path?: string }) => item.path === RUTA_ARCHIVO)
      : null

    if (entrada && typeof entrada.sha === 'string') {
      return entrada.sha
    }

    return undefined
  }

  throw new Error('GitHub no respondió como esperaba. Intenta de nuevo en un momento.')
}

export async function publicarEnGitHub(config: ConfigGitHub, contenido: Contenido): Promise<string> {
  if (!configGitHubCompleta(config)) {
    throw new Error('Faltan datos: usuario, repositorio y token.')
  }

  const limpio: ConfigGitHub = {
    owner: config.owner.trim(),
    repo: config.repo.trim(),
    token: config.token.trim(),
  }

  const headers = {
    Authorization: `Bearer ${limpio.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const sha = await obtenerSha(limpio, headers)
  const contenidoJson = JSON.stringify(contenido, null, 2)

  const respuesta = await fetch(
    `https://api.github.com/repos/${limpio.owner}/${limpio.repo}/contents/${RUTA_ARCHIVO}`,
    {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Actualizar la página 💌',
        content: aBase64(contenidoJson),
        branch: RAMA,
        ...(sha ? { sha } : {}),
      }),
    }
  )

  if (respuesta.ok) {
    return 'Publicado en GitHub. En 1-2 minutos ella ya lo ve en la página. 💘'
  }

  if (respuesta.status === 401) {
    throw new Error('GitHub dice que el token no es válido. Revisa que lo copiaste completo.')
  }

  if (respuesta.status === 403) {
    throw new Error('El token no tiene permiso de escribir en ese repo (necesita "Contents: Read and write").')
  }

  if (respuesta.status === 404) {
    throw new Error('No encontré ese repositorio. Revisa tu usuario y el nombre del repo.')
  }

  if (respuesta.status === 409) {
    throw new Error('Alguien más actualizó el archivo justo ahora. Intenta publicar de nuevo.')
  }

  if (respuesta.status === 422) {
    const detalle = await respuesta.json().catch(() => null)

    if (detalle?.message?.includes('too large') || detalle?.message?.includes('size')) {
      throw new Error('El archivo quedó muy pesado (demasiadas fotos grandes). Borra o recorta alguna foto.')
    }

    throw new Error('GitHub rechazó el cambio. Revisa que la rama se llame "main".')
  }

  throw new Error(`GitHub respondió con un error (${respuesta.status}). Intenta de nuevo.`)
}
