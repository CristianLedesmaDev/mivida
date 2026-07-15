// Filtro SVG para el efecto "liquid glass" (adaptado al tema pastel:
// distorsión suave, nada exagerado). Se referencia con filter: url(#glass-distortion).
export function GlassFilter() {
  return (
    <svg style={{ display: 'none' }} aria-hidden="true">
      <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
        <feTurbulence type="fractalNoise" baseFrequency="0.004 0.009" numOctaves="1" seed="17" result="turbulence" />
        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
          <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
          <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
        </feComponentTransfer>
        <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
        <feDisplacementMap in="SourceGraphic" in2="softMap" scale="34" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
