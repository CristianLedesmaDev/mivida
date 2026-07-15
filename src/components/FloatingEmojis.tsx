import { useMemo } from 'react'
import { AnimatedEmoji } from './AnimatedEmoji'
import { generarFloaters } from '../emojiLibrary'

export function FloatingEmojis() {
  // useMemo: se sortean una vez por visita, no en cada re-render — así no
  // "saltan" de lugar mientras ella está viendo la pantalla de entrada.
  const floaters = useMemo(() => generarFloaters(18, 32, 48), [])

  return (
    <div className="floating-emojis" aria-hidden="true">
      {floaters.map((item, index) => (
        <span
          key={`${item.emoji}-${index}`}
          className="floating-emoji"
          style={{
            left: item.left,
            top: item.top,
            animationDelay: item.delay,
            animationDuration: item.duration,
          }}
        >
          <AnimatedEmoji emoji={item.emoji} size={item.size} />
        </span>
      ))}
    </div>
  )
}
