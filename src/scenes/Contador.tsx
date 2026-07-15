import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Contenido } from '../content'
import { AnimatedEmoji } from '../components/AnimatedEmoji'

type ContadorProps = {
  contenido: Contenido
  onNext: () => void
}

type Desglose = {
  dias: number
  horas: number
  minutos: number
  segundos: number
  frase: string
}

function calcularDesglose(fechaInicio: string, ahora: Date): Desglose {
  const inicio = new Date(fechaInicio)
  const diferencia = Math.max(0, ahora.getTime() - inicio.getTime())
  const totalSegundos = Math.floor(diferencia / 1000)

  const dias = Math.floor(totalSegundos / 86400)
  const horas = Math.floor((totalSegundos % 86400) / 3600)
  const minutos = Math.floor((totalSegundos % 3600) / 60)
  const segundos = totalSegundos % 60

  let anios = ahora.getFullYear() - inicio.getFullYear()
  let meses = ahora.getMonth() - inicio.getMonth()

  if (ahora.getDate() < inicio.getDate()) {
    meses -= 1
  }

  if (meses < 0) {
    anios -= 1
    meses += 12
  }

  const partes: string[] = []

  if (anios > 0) {
    partes.push(`${anios} ${anios === 1 ? 'año' : 'años'}`)
  }

  if (meses > 0 || anios === 0) {
    partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`)
  }

  return { dias, horas, minutos, segundos, frase: partes.join(' y ') }
}

export function Contador({ contenido, onNext }: ContadorProps) {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const desglose = useMemo(
    () => calcularDesglose(contenido.fechaInicio, ahora),
    [contenido.fechaInicio, ahora]
  )

  const fechaBonita = useMemo(() => {
    const inicio = new Date(contenido.fechaInicio)
    return inicio.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  }, [contenido.fechaInicio])

  const unidades = [
    { valor: desglose.dias, etiqueta: desglose.dias === 1 ? 'día' : 'días' },
    { valor: desglose.horas, etiqueta: 'horas' },
    { valor: desglose.minutos, etiqueta: 'minutos' },
    { valor: desglose.segundos, etiqueta: 'segundos' },
  ]

  return (
    <section className="escena">
      <div className="tarjeta-escena tarjeta-contador">
        <AnimatedEmoji emoji="⏳" size={64} />
        <h2 className="titulo-escena">{contenido.contador.titulo}</h2>
        <p className="contador-frase">
          llevamos <strong>{desglose.frase}</strong> juntos
        </p>

        <div className="contador-grid">
          {unidades.map((unidad) => (
            <div key={unidad.etiqueta} className="contador-celda">
              <strong>{unidad.valor.toLocaleString('es-MX')}</strong>
              <span>{unidad.etiqueta}</span>
            </div>
          ))}
        </div>

        <p className="contador-nota">
          <span className="contador-fecha">desde el {fechaBonita}</span>
          {contenido.contador.nota}
        </p>

        <button className="btn-amor" type="button" onClick={onNext}>
          sigue, hay más
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  )
}
