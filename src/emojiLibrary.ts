// Librería de "memes bonitos": categorías de emojis animados que se combinan
// para decorar la página. Los suyos (EMOJIS_ELLA) pesan el doble para que
// sigan siendo los que predominen, mezclados con variedad de amor y risa.
export const EMOJIS_ELLA = [
  '🙏', '😍', '🥰', '😉', '🥶', '😹', '💗', '🐓', '🥚', '🐥', '🐢', '🐱', '😴', '😎', '🤢', '😅', '😋', '👅',
]

export const EMOJIS_AMOR = ['❤️', '💌', '💖', '💘', '💕', '🫶', '😘', '🌹', '✨', '♾️', '🦋']

export const EMOJIS_GRACIOSOS = ['😂', '🤪', '😝', '🙈', '🥳', '🫠']

const TODOS = [...EMOJIS_ELLA, ...EMOJIS_ELLA, ...EMOJIS_AMOR, ...EMOJIS_GRACIOSOS]

function barajar<T>(lista: T[]): T[] {
  const copia = [...lista]

  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }

  return copia
}

export type Floater = {
  emoji: string
  left: string
  top: string
  size: number
  delay: string
  duration: string
}

// Reparte "cantidad" de emojis en una cuadrícula con jitter, para que salgan
// distintos (y en lugares distintos) cada vez que se abre la página, sin que
// se amontonen unos sobre otros.
export function generarFloaters(cantidad: number, minSize = 32, maxSize = 46): Floater[] {
  const emojis = barajar(TODOS).slice(0, cantidad)
  const columnas = Math.ceil(Math.sqrt(cantidad * 1.4))
  const filas = Math.ceil(cantidad / columnas)

  return emojis.map((emoji, indice) => {
    const col = indice % columnas
    const fila = Math.floor(indice / columnas)
    const jitterX = (Math.random() - 0.5) * (80 / columnas)
    const jitterY = (Math.random() - 0.5) * (70 / filas)

    const left = Math.min(94, Math.max(2, ((col + 0.5) / columnas) * 100 + jitterX))
    const top = Math.min(92, Math.max(4, ((fila + 0.5) / filas) * 100 + jitterY))

    return {
      emoji,
      left: `${left.toFixed(1)}%`,
      top: `${top.toFixed(1)}%`,
      size: Math.round(minSize + Math.random() * (maxSize - minSize)),
      delay: `${(Math.random() * 3.4).toFixed(1)}s`,
      duration: `${(8.5 + Math.random() * 4).toFixed(1)}s`,
    }
  })
}
