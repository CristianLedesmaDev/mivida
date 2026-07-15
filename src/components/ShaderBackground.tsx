import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Fondo animado adaptado del patrón "shader animation": en vez de las líneas
// neón del original, aquí son tres manchas suaves que respiran y se funden
// entre los tonos pastel/vino del sitio — como acuarela en movimiento.
const VERTEX_SHADER = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;

  vec3 paleta(float t) {
    vec3 crema = vec3(1.0, 0.973, 0.965);
    vec3 rosaClaro = vec3(1.0, 0.839, 0.878);
    vec3 rosa = vec3(0.949, 0.475, 0.592);
    vec3 vino = vec3(0.549, 0.184, 0.290);
    vec3 c1 = mix(crema, rosaClaro, smoothstep(0.0, 0.55, t));
    vec3 c2 = mix(rosa, vino, smoothstep(0.5, 1.0, t));
    return mix(c1, c2, smoothstep(0.3, 0.8, t));
  }

  void main(void) {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float t = time * 0.055;
    vec2 c1 = vec2(sin(t * 0.9) * 0.55, cos(t * 0.7) * 0.42);
    vec2 c2 = vec2(cos(t * 0.55) * 0.6, sin(t * 1.05) * 0.35);
    vec2 c3 = vec2(sin(t * 1.25 + 2.0) * 0.42, cos(t * 0.65 + 1.0) * 0.5);

    float glow = 0.0;
    glow += 0.16 / (length(p - c1) + 0.28);
    glow += 0.14 / (length(p - c2) + 0.32);
    glow += 0.12 / (length(p - c3) + 0.3);

    float mezcla = clamp(glow * 0.5, 0.0, 1.0);
    vec3 color = paleta(mezcla);

    gl_FragColor = vec4(color, mezcla * 0.8);
  }
`

export function ShaderBackground({ className = '' }: { className?: string }) {
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const contenedor = contenedorRef.current

    if (!contenedor) {
      return
    }

    const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefiereMenosMovimiento) {
      return
    }

    let renderer: THREE.WebGLRenderer
    let animacionId = 0

    try {
      const camara = new THREE.Camera()
      camara.position.z = 1

      const escena = new THREE.Scene()
      const geometria = new THREE.PlaneGeometry(2, 2)

      const uniforms = {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2() },
      }

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
      })

      const malla = new THREE.Mesh(geometria, material)
      escena.add(malla)

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      contenedor.appendChild(renderer.domElement)

      const redimensionar = () => {
        const ancho = contenedor.clientWidth
        const alto = contenedor.clientHeight
        renderer.setSize(ancho, alto)
        uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height)
      }

      redimensionar()
      const observador = new ResizeObserver(redimensionar)
      observador.observe(contenedor)

      const animar = () => {
        animacionId = requestAnimationFrame(animar)
        uniforms.time.value += 0.05
        renderer.render(escena, camara)
      }

      animar()

      return () => {
        cancelAnimationFrame(animacionId)
        observador.disconnect()
        renderer.dispose()
        geometria.dispose()
        material.dispose()

        if (renderer.domElement.parentNode === contenedor) {
          contenedor.removeChild(renderer.domElement)
        }
      }
    } catch {
      // Si WebGL no está disponible, el fondo de acuarela en CSS de abajo
      // se queda solo — la página se ve bien de todos modos.
      return
    }
  }, [])

  return <div ref={contenedorRef} className={`shader-fondo ${className}`} aria-hidden="true" />
}
