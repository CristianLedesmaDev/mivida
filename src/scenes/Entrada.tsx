import { Suspense, useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import type { Contenido } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'
import { FloatingEmojis } from '../components/FloatingEmojis'
import { ShaderBackgroundLazy } from '../components/ShaderBackgroundLazy'

type EntradaProps = {
  contenido: Contenido
  onNext: () => void
}

export function Entrada({ contenido, onNext }: EntradaProps) {
  const [verificando, setVerificando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [apodoIndice, setApodoIndice] = useState(0)

  const apodosValidos = contenido.apodos.map((apodo) => apodo.trim()).filter(Boolean)
  const apodos = apodosValidos.length > 0 ? apodosValidos : [contenido.nombre]
  const apodo = apodos[apodoIndice % apodos.length]

  useEffect(() => {
    if (apodos.length < 2) {
      return
    }

    const id = setInterval(() => {
      setApodoIndice((actual) => (actual + 1) % apodos.length)
    }, 2100)

    return () => clearInterval(id)
  }, [apodos.length])

  const entrar = () => {
    if (verificando) {
      return
    }

    const pasos = [
      'Verificando identidad… 💭',
      'Belleza detectada: nivel máximo ✨',
      `Acceso concedido, ${apodos[0]} 💘`,
    ]

    setVerificando(true)
    pasos.forEach((paso, index) => {
      setTimeout(() => setMensaje(paso), index * 750)
    })
    setTimeout(onNext, pasos.length * 750 + 450)
  }

  return (
    <section className="escena escena-entrada">
      <Suspense fallback={null}>
        <ShaderBackgroundLazy />
      </Suspense>
      <FloatingEmojis />

      <div className="tarjeta-entrada">
        <div className="entrada-emoji">
          <AnimatedEmoji emoji="😋" size={84} />
        </div>

        <p className="entrada-saludo">
          {contenido.entrada.saludo}{' '}
          <span key={apodo} className="apodo-flip">
            {apodo}
          </span>
        </p>
        <h1 className="entrada-titulo">{contenido.entrada.titulo}</h1>
        <p className="entrada-subtitulo">{contenido.entrada.subtitulo}</p>

        {verificando ? (
          <div className="entrada-verificando">
            <span className="entrada-spinner" />
            <span key={mensaje} className="entrada-mensaje">
              {mensaje || 'Un segundito…'}
            </span>
          </div>
        ) : (
          <button className="btn-amor btn-grande" type="button" onClick={entrar}>
            <Heart size={19} fill="currentColor" />
            {contenido.entrada.boton}
          </button>
        )}

        <p className="entrada-pie">hecho a mano, con muchísimo amor</p>
      </div>
    </section>
  )
}
