import { lazy } from 'react'

// three.js pesa bastante: se carga aparte (chunk propio) para no inflar el
// paquete inicial que ve ella nada más entrar.
export const ShaderBackgroundLazy = lazy(() =>
  import('./ShaderBackground').then((modulo) => ({ default: modulo.ShaderBackground }))
)
