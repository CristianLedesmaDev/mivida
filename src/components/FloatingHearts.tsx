import { useMemo } from 'react'
import { Heart, Sparkles } from 'lucide-react'
import { AnimatedEmoji } from './AnimatedEmoji'
import { generarFloaters } from '../emojiLibrary'

const HEARTS = [
  { left: '8%', top: '14%', size: 18, delay: '0s', duration: '11s' },
  { left: '20%', top: '58%', size: 12, delay: '1.2s', duration: '12s' },
  { left: '46%', top: '72%', size: 14, delay: '0.8s', duration: '10s' },
  { left: '82%', top: '32%', size: 13, delay: '0.4s', duration: '11s' },
]

export function FloatingHearts() {
  // Un puñado de su librería de emojis, sembrados junto a los corazones para
  // que su sello personal esté presente en todo el recorrido, no solo al entrar.
  const emojis = useMemo(() => generarFloaters(4, 16, 22), [])

  return (
    <div className="floating-hearts" aria-hidden="true">
      <div className="floating-glow floating-glow-left" />
      <div className="floating-glow floating-glow-right" />

      {HEARTS.map((heart, index) => (
        <span
          key={`corazon-${index}`}
          className="float-heart"
          style={{ left: heart.left, top: heart.top, animationDelay: heart.delay, animationDuration: heart.duration }}
        >
          <Heart size={heart.size} fill="currentColor" />
        </span>
      ))}

      {emojis.map((item, index) => (
        <span
          key={`emoji-${index}`}
          className="float-heart float-heart-emoji"
          style={{ left: item.left, top: item.top, animationDelay: item.delay, animationDuration: item.duration }}
        >
          <AnimatedEmoji emoji={item.emoji} size={item.size} />
        </span>
      ))}

      <span className="sparkle-badge sparkle-badge-a">
        <Sparkles size={18} />
      </span>
      <span className="sparkle-badge sparkle-badge-b">
        <Sparkles size={14} />
      </span>
    </div>
  )
}
