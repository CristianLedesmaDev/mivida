import { useState } from 'react'

// Emojis animados oficiales de Google (Noto Animated Emoji).
// Se ven como stickers tiernos y cargan desde CDN; si alguno falla,
// se muestra el emoji normal del sistema.
const toCodepoints = (emoji: string) =>
  [...emoji].map((char) => char.codePointAt(0)!.toString(16)).join('_')

type AnimatedEmojiProps = {
  emoji: string
  size?: number
  className?: string
}

export function AnimatedEmoji({ emoji, size = 44, className = '' }: AnimatedEmojiProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1 }} role="img" aria-label={emoji}>
        {emoji}
      </span>
    )
  }

  return (
    <img
      src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${toCodepoints(emoji)}/512.gif`}
      alt={emoji}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}
