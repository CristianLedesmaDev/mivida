import type { ReactNode } from 'react'
import { motion, useInView, type Transition, type UseInViewOptions, type Variant } from 'framer-motion'
import { useRef } from 'react'

type InViewProps = {
  children: ReactNode
  className?: string
  variants?: { hidden: Variant; visible: Variant }
  transition?: Transition
  viewOptions?: UseInViewOptions
}

const variantesDefault = {
  hidden: { opacity: 0, y: 18, scale: 0.96, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
}

// Revela su contenido con un fundido+desenfoque cuando entra en pantalla.
// Adaptado del patrón "in-view" (framer-motion) a la paleta pastel del sitio.
export function InView({
  children,
  className,
  variants = variantesDefault,
  transition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  viewOptions = { once: true, margin: '0px 0px -80px 0px' },
}: InViewProps) {
  const ref = useRef(null)
  const enVista = useInView(ref, viewOptions)

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={enVista ? 'visible' : 'hidden'}
      variants={variants}
      transition={transition}
    >
      {children}
    </motion.div>
  )
}
