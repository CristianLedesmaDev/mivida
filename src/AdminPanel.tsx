import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Cloud,
  CloudUpload,
  Crop,
  Download,
  Eye,
  FileUp,
  Lock,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  CLAVE_BORRADOR,
  CLAVE_PANEL,
  CLAVE_PREVIEW,
  CATEGORIAS_RAZONES,
  CONTENIDO_DEFAULT,
  PIN_PANEL,
  guardarBorrador,
  leerBorrador,
  mergeContenido,
  type Contenido,
  type Foto,
} from './content'
import { configGitHubCompleta, guardarConfigGitHub, leerConfigGitHub, publicarEnGitHub, type ConfigGitHub } from './github'
import { parseSpotify, spotifyScanUrl } from './spotify'
import { ImageCropModal } from './components/ImageCropModal'

type AdminPanelProps = {
  publicado: Contenido
}

const SECCIONES = [
  { id: 'basico', etiqueta: '💗 Lo básico' },
  { id: 'entrada', etiqueta: '🔐 Entrada' },
  { id: 'bienvenida', etiqueta: '👋 Bienvenida' },
  { id: 'contador', etiqueta: '⏳ Contador' },
  { id: 'carta', etiqueta: '💌 Carta' },
  { id: 'fotos', etiqueta: '📸 Fotos' },
  { id: 'razones', etiqueta: '💘 Razones' },
  { id: 'idiomas', etiqueta: '🌍 Idiomas' },
  { id: 'historia', etiqueta: '🪐 Historia' },
  { id: 'musica', etiqueta: '🎧 Spotify' },
  { id: 'final', etiqueta: '🏁 Final' },
  { id: 'publicar', etiqueta: '🚀 Publicar' },
] as const

type SeccionId = (typeof SECCIONES)[number]['id']

const cargarImagen = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const imagen = new Image()
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new Error('No se pudo leer la imagen'))
    imagen.src = src
  })

// Reduce las fotos antes de guardarlas: como no hay servidor, todas viven
// como texto (base64) dentro de contenido.json, así que hay que mantenerlas
// livianas para que el archivo no pese demasiado.
async function archivoADataUrl(file: File, maxLado = 1100, calidad = 0.8): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })

  const imagen = await cargarImagen(dataUrl)
  const factor = Math.min(1, maxLado / Math.max(imagen.naturalWidth, imagen.naturalHeight))

  if (factor === 1 && file.size < 250_000) {
    return dataUrl
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(imagen.naturalWidth * factor)
  canvas.height = Math.round(imagen.naturalHeight * factor)

  const contexto = canvas.getContext('2d')

  if (!contexto) {
    return dataUrl
  }

  contexto.imageSmoothingEnabled = true
  contexto.imageSmoothingQuality = 'high'
  contexto.fillStyle = '#ffffff'
  contexto.fillRect(0, 0, canvas.width, canvas.height)
  contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/jpeg', calidad)
}

function PinGate({ onOk }: { onOk: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const comprobar = () => {
    if (pin.trim() === PIN_PANEL) {
      sessionStorage.setItem(CLAVE_PANEL, '1')
      onOk()
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <section className="escena">
      <div className="tarjeta-escena tarjeta-pin">
        <Lock size={38} className="pin-icono" />
        <h2 className="titulo-escena">Panel secreto</h2>

        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          value={pin}
          placeholder="······"
          onChange={(event) => {
            setPin(event.target.value)
            setError(false)
          }}
          onKeyDown={(event) => event.key === 'Enter' && comprobar()}
        />

        {error && <p className="pin-error">mmm, esa no es… inténtalo de nuevo 👀</p>}

        <div className="pin-acciones">
          <button className="btn-amor" type="button" onClick={comprobar}>
            entrar
          </button>
          <button className="btn-suave" type="button" onClick={() => (window.location.hash = '')}>
            volver a la página
          </button>
        </div>
      </div>
    </section>
  )
}

export function AdminPanel({ publicado }: AdminPanelProps) {
  const [autorizado, setAutorizado] = useState(() => sessionStorage.getItem(CLAVE_PANEL) === '1')
  const [contenido, setContenido] = useState<Contenido>(() => leerBorrador() ?? publicado)
  const [seccion, setSeccion] = useState<SeccionId>('basico')
  const [estado, setEstado] = useState('Todo lo que edites aquí se guarda como borrador en este navegador.')
  const [fotoRecorte, setFotoRecorte] = useState<Foto | null>(null)
  const [publicando, setPublicando] = useState(false)
  const [configGitHub, setConfigGitHub] = useState<ConfigGitHub>(() => leerConfigGitHub())
  const inputFotos = useRef<HTMLInputElement>(null)
  const inputImportar = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!autorizado) {
      return
    }

    if (!guardarBorrador(contenido)) {
      setEstado('⚠ No cupo todo en el navegador. Borra alguna foto o usa fotos más ligeras.')
    }
  }, [contenido, autorizado])

  if (!autorizado) {
    return <PinGate onOk={() => setAutorizado(true)} />
  }

  const listoParaPublicar = configGitHubCompleta(configGitHub)

  const actualizar = (parche: Partial<Contenido>) => {
    setContenido((previo) => ({ ...previo, ...parche }))
  }

  const actualizarConfigGitHub = (parche: Partial<ConfigGitHub>) => {
    setConfigGitHub((previa) => {
      const nueva = { ...previa, ...parche }
      guardarConfigGitHub(nueva)
      return nueva
    })
  }

  const verComoElla = () => {
    sessionStorage.setItem(CLAVE_PREVIEW, '1')
    window.location.hash = ''
  }

  const descargarArchivo = () => {
    const blob = new Blob([JSON.stringify(contenido, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = 'contenido.json'
    enlace.click()
    URL.revokeObjectURL(url)
    setEstado('Se descargó contenido.json. Súbelo a la carpeta public de tu repo y listo. 💾')
  }

  const importarArchivo = async (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0]
    event.target.value = ''

    if (!archivo) {
      return
    }

    try {
      const texto = await archivo.text()
      setContenido(mergeContenido(CONTENIDO_DEFAULT, JSON.parse(texto)))
      setEstado('Archivo importado. Revísalo y publícalo cuando quieras.')
    } catch {
      setEstado('⚠ Ese archivo no se pudo leer. ¿Seguro que era un contenido.json?')
    }
  }

  const restaurarPublicado = () => {
    localStorage.removeItem(CLAVE_BORRADOR)
    setContenido(publicado)
    setEstado('Borrador eliminado: volviste a la versión publicada.')
  }

  const guardarYPublicar = async () => {
    if (publicando) {
      return
    }

    if (!listoParaPublicar) {
      setSeccion('publicar')
      setEstado('⚠ Primero conecta tu GitHub (pestaña 🚀 Publicar) para publicar con un clic.')
      return
    }

    setPublicando(true)
    setEstado('Publicando en GitHub… ⏳')

    try {
      const mensaje = await publicarEnGitHub(configGitHub, contenido)
      setEstado(mensaje)
    } catch (error) {
      setEstado(`⚠ ${error instanceof Error ? error.message : 'Algo salió mal. Intenta de nuevo.'}`)
    } finally {
      setPublicando(false)
    }
  }

  const subirFotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(event.target.files ?? []).filter((archivo) =>
      archivo.type.startsWith('image/')
    )
    event.target.value = ''

    if (archivos.length === 0) {
      return
    }

    setEstado('Preparando fotos…')

    const nuevas: Foto[] = []

    for (const archivo of archivos) {
      try {
        nuevas.push({
          id: crypto.randomUUID(),
          src: await archivoADataUrl(archivo),
          caption: archivo.name.replace(/\.[^.]+$/, ''),
        })
      } catch {
        // Si una foto falla, seguimos con las demás.
      }
    }

    if (nuevas.length > 0) {
      actualizar({ fotos: [...contenido.fotos, ...nuevas] })
      setEstado(`Se ${nuevas.length === 1 ? 'agregó 1 foto' : `agregaron ${nuevas.length} fotos`}. Dales recorte para que queden perfectas. ✂`)
    } else {
      setEstado('⚠ No se pudo leer ninguna de esas fotos.')
    }
  }

  const moverFoto = (indice: number, direccion: -1 | 1) => {
    const destino = indice + direccion

    if (destino < 0 || destino >= contenido.fotos.length) {
      return
    }

    const fotos = [...contenido.fotos]
    ;[fotos[indice], fotos[destino]] = [fotos[destino], fotos[indice]]
    actualizar({ fotos })
  }

  const moverHito = (indice: number, direccion: -1 | 1) => {
    const destino = indice + direccion

    if (destino < 0 || destino >= contenido.historia.items.length) {
      return
    }

    const items = [...contenido.historia.items]
    ;[items[indice], items[destino]] = [items[destino], items[indice]]
    actualizar({ historia: { ...contenido.historia, items } })
  }

  const guardarRecorte = (croppedSrc: string) => {
    if (!fotoRecorte) {
      return
    }

    actualizar({
      fotos: contenido.fotos.map((foto) =>
        foto.id === fotoRecorte.id ? { ...foto, src: croppedSrc } : foto
      ),
    })
    setFotoRecorte(null)
    setEstado('Recorte guardado. 📐')
  }

  return (
    <div className="panel">
      <header className="panel-cabecera">
        <div>
          <p className="panel-eyebrow">panel secreto 🔧💘</p>
          <h1>Editor de tu página para {contenido.nombre}</h1>
          <p className="panel-estado">{estado}</p>
          <span className={`estado-conexion ${listoParaPublicar ? 'estado-conexion-ok' : ''}`}>
            <Cloud size={13} />
            {listoParaPublicar ? 'GitHub conectado — publicas al instante' : 'GitHub sin conectar'}
          </span>
        </div>

        <div className="panel-acciones">
          <button className="btn-amor" type="button" onClick={verComoElla}>
            <Eye size={17} />
            Ver como ella
          </button>
          <button className="btn-amor" type="button" onClick={guardarYPublicar} disabled={publicando}>
            <CloudUpload size={17} />
            {publicando ? 'Publicando…' : 'Guardar y publicar'}
          </button>
          <button className="btn-suave btn-peligro" type="button" onClick={restaurarPublicado}>
            <RotateCcw size={17} />
            Descartar borrador
          </button>
        </div>
      </header>

      <nav className="panel-menu" aria-label="Secciones del editor">
        {SECCIONES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`panel-menu-item ${seccion === item.id ? 'panel-menu-activo' : ''}`}
            onClick={() => setSeccion(item.id)}
          >
            {item.etiqueta}
          </button>
        ))}
      </nav>

      <main className="panel-cuerpo">
        {seccion === 'basico' && (
          <section className="panel-seccion">
            <h2>💗 Lo básico</h2>
            <label className="campo">
              <span>Su nombre o apodo principal</span>
              <input
                value={contenido.nombre}
                onChange={(event) => actualizar({ nombre: event.target.value })}
              />
            </label>
            <label className="campo">
              <span>Tu firma</span>
              <input
                value={contenido.firma}
                onChange={(event) => actualizar({ firma: event.target.value })}
              />
            </label>
            <label className="campo">
              <span>Fecha en la que empezaron</span>
              <input
                type="date"
                value={contenido.fechaInicio.slice(0, 10)}
                onChange={(event) =>
                  event.target.value && actualizar({ fechaInicio: `${event.target.value}T00:00:00` })
                }
              />
            </label>
            <label className="campo">
              <span>Sus apodos (uno por línea — van rotando en la entrada y en el final)</span>
              <textarea
                rows={8}
                value={contenido.apodos.join('\n')}
                onChange={(event) =>
                  actualizar({
                    apodos: event.target.value
                      .split('\n')
                      .map((apodo) => apodo.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
          </section>
        )}

        {seccion === 'entrada' && (
          <section className="panel-seccion">
            <h2>🔐 Pantalla de entrada</h2>
            <label className="campo">
              <span>Saludo (antes del apodo que va rotando)</span>
              <input
                value={contenido.entrada.saludo}
                onChange={(event) =>
                  actualizar({ entrada: { ...contenido.entrada, saludo: event.target.value } })
                }
              />
            </label>
            <label className="campo">
              <span>Título grande</span>
              <input
                value={contenido.entrada.titulo}
                onChange={(event) =>
                  actualizar({ entrada: { ...contenido.entrada, titulo: event.target.value } })
                }
              />
            </label>
            <label className="campo">
              <span>Texto de abajo</span>
              <textarea
                rows={3}
                value={contenido.entrada.subtitulo}
                onChange={(event) =>
                  actualizar({ entrada: { ...contenido.entrada, subtitulo: event.target.value } })
                }
              />
            </label>
            <label className="campo">
              <span>Texto del botón</span>
              <input
                value={contenido.entrada.boton}
                onChange={(event) =>
                  actualizar({ entrada: { ...contenido.entrada, boton: event.target.value } })
                }
              />
            </label>
          </section>
        )}

        {seccion === 'bienvenida' && (
          <section className="panel-seccion">
            <h2>👋 Bienvenida</h2>
            <label className="campo">
              <span>Título</span>
              <input
                value={contenido.bienvenida.titulo}
                onChange={(event) =>
                  actualizar({ bienvenida: { ...contenido.bienvenida, titulo: event.target.value } })
                }
              />
            </label>
            <label className="campo">
              <span>Texto (se escribe solo, letra por letra)</span>
              <textarea
                rows={3}
                value={contenido.bienvenida.texto}
                onChange={(event) =>
                  actualizar({ bienvenida: { ...contenido.bienvenida, texto: event.target.value } })
                }
              />
            </label>
          </section>
        )}

        {seccion === 'contador' && (
          <section className="panel-seccion">
            <h2>⏳ Contador de tiempo</h2>
            <label className="campo">
              <span>Título</span>
              <input
                value={contenido.contador.titulo}
                onChange={(event) =>
                  actualizar({ contador: { ...contenido.contador, titulo: event.target.value } })
                }
              />
            </label>
            <label className="campo">
              <span>Notita debajo del contador</span>
              <textarea
                rows={2}
                value={contenido.contador.nota}
                onChange={(event) =>
                  actualizar({ contador: { ...contenido.contador, nota: event.target.value } })
                }
              />
            </label>
          </section>
        )}

        {seccion === 'carta' && (
          <section className="panel-seccion">
            <h2>💌 La carta</h2>
            <label className="campo">
              <span>Título de la carta</span>
              <input
                value={contenido.carta.titulo}
                onChange={(event) =>
                  actualizar({ carta: { ...contenido.carta, titulo: event.target.value } })
                }
              />
            </label>
            <label className="campo">
              <span>Cuerpo (separa los párrafos con una línea vacía)</span>
              <textarea
                rows={12}
                value={contenido.carta.parrafos.join('\n\n')}
                onChange={(event) =>
                  actualizar({
                    carta: {
                      ...contenido.carta,
                      parrafos: event.target.value
                        .split(/\n\s*\n/)
                        .map((parrafo) => parrafo.trim())
                        .filter(Boolean),
                    },
                  })
                }
              />
            </label>
            <label className="campo">
              <span>Despedida</span>
              <input
                value={contenido.carta.despedida}
                onChange={(event) =>
                  actualizar({ carta: { ...contenido.carta, despedida: event.target.value } })
                }
              />
            </label>
          </section>
        )}

        {seccion === 'fotos' && (
          <section className="panel-seccion">
            <h2>📸 Fotos ({contenido.fotos.length})</h2>

            <input
              ref={inputFotos}
              type="file"
              accept="image/*"
              multiple
              className="hidden-input"
              onChange={subirFotos}
            />

            <button className="subir-fotos" type="button" onClick={() => inputFotos.current?.click()}>
              <Upload size={22} />
              <span>
                <strong>Sube sus fotos</strong>
              </span>
            </button>

            <div className="panel-fotos">
              {contenido.fotos.map((foto, index) => (
                <article key={foto.id} className="panel-foto">
                  <img src={foto.src} alt={foto.caption} />
                  <input
                    value={foto.caption}
                    placeholder="Escribe una notita para la foto"
                    onChange={(event) =>
                      actualizar({
                        fotos: contenido.fotos.map((item) =>
                          item.id === foto.id ? { ...item, caption: event.target.value } : item
                        ),
                      })
                    }
                  />
                  <div className="panel-foto-acciones">
                    <button type="button" title="Subir" onClick={() => moverFoto(index, -1)}>
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" title="Bajar" onClick={() => moverFoto(index, 1)}>
                      <ArrowDown size={15} />
                    </button>
                    <button type="button" title="Recortar" onClick={() => setFotoRecorte(foto)}>
                      <Crop size={15} />
                    </button>
                    <button
                      type="button"
                      title="Eliminar"
                      className="accion-borrar"
                      onClick={() =>
                        actualizar({ fotos: contenido.fotos.filter((item) => item.id !== foto.id) })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {seccion === 'razones' && (
          <section className="panel-seccion">
            <h2>💘 Razones</h2>
            <label className="campo">
              <span>Título de la sección</span>
              <input
                value={contenido.razones.titulo}
                onChange={(event) =>
                  actualizar({ razones: { ...contenido.razones, titulo: event.target.value } })
                }
              />
            </label>

            {contenido.razones.items.map((razon) => (
              <div key={razon.id} className="fila-razon">
                <input
                  className="input-emoji"
                  value={razon.emoji}
                  maxLength={4}
                  onChange={(event) =>
                    actualizar({
                      razones: {
                        ...contenido.razones,
                        items: contenido.razones.items.map((item) =>
                          item.id === razon.id ? { ...item, emoji: event.target.value } : item
                        ),
                      },
                    })
                  }
                />
                <input
                  value={razon.texto}
                  placeholder="Porque…"
                  onChange={(event) =>
                    actualizar({
                      razones: {
                        ...contenido.razones,
                        items: contenido.razones.items.map((item) =>
                          item.id === razon.id ? { ...item, texto: event.target.value } : item
                        ),
                      },
                    })
                  }
                />
                <input
                  className="input-categoria"
                  value={razon.categoria ?? ''}
                  placeholder="Categoría"
                  list="lista-categorias"
                  onChange={(event) =>
                    actualizar({
                      razones: {
                        ...contenido.razones,
                        items: contenido.razones.items.map((item) =>
                          item.id === razon.id ? { ...item, categoria: event.target.value } : item
                        ),
                      },
                    })
                  }
                />
                <button
                  type="button"
                  className="accion-borrar boton-icono"
                  title="Eliminar razón"
                  onClick={() =>
                    actualizar({
                      razones: {
                        ...contenido.razones,
                        items: contenido.razones.items.filter((item) => item.id !== razon.id),
                      },
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            <datalist id="lista-categorias">
              {CATEGORIAS_RAZONES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>

            <button
              className="btn-suave"
              type="button"
              onClick={() =>
                actualizar({
                  razones: {
                    ...contenido.razones,
                    items: [
                      ...contenido.razones.items,
                      { id: crypto.randomUUID(), emoji: '💗', texto: '', categoria: '' },
                    ],
                  },
                })
              }
            >
              <Plus size={16} />
              agregar razón
            </button>
          </section>
        )}

        {seccion === 'idiomas' && (
          <section className="panel-seccion">
            <h2>🌍 Te amo en todos los idiomas</h2>
            <label className="campo">
              <span>Frase grande (ej. “Te amoquieroadoro”)</span>
              <input
                value={contenido.idiomas.titulo}
                onChange={(event) =>
                  actualizar({ idiomas: { ...contenido.idiomas, titulo: event.target.value } })
                }
              />
            </label>
            <label className="campo">
              <span>Subtítulo</span>
              <input
                value={contenido.idiomas.subtitulo}
                onChange={(event) =>
                  actualizar({ idiomas: { ...contenido.idiomas, subtitulo: event.target.value } })
                }
              />
            </label>

            {contenido.idiomas.items.map((idioma) => (
              <div key={idioma.id} className="fila-idioma">
                <input
                  className="input-idioma"
                  value={idioma.idioma}
                  placeholder="Idioma"
                  onChange={(event) =>
                    actualizar({
                      idiomas: {
                        ...contenido.idiomas,
                        items: contenido.idiomas.items.map((item) =>
                          item.id === idioma.id ? { ...item, idioma: event.target.value } : item
                        ),
                      },
                    })
                  }
                />
                <input
                  value={idioma.texto}
                  placeholder="Te amo"
                  onChange={(event) =>
                    actualizar({
                      idiomas: {
                        ...contenido.idiomas,
                        items: contenido.idiomas.items.map((item) =>
                          item.id === idioma.id ? { ...item, texto: event.target.value } : item
                        ),
                      },
                    })
                  }
                />
                <input
                  className="input-nota"
                  value={idioma.nota ?? ''}
                  placeholder="se dice…"
                  onChange={(event) =>
                    actualizar({
                      idiomas: {
                        ...contenido.idiomas,
                        items: contenido.idiomas.items.map((item) =>
                          item.id === idioma.id ? { ...item, nota: event.target.value } : item
                        ),
                      },
                    })
                  }
                />
                <button
                  type="button"
                  className="accion-borrar boton-icono"
                  title="Eliminar idioma"
                  onClick={() =>
                    actualizar({
                      idiomas: {
                        ...contenido.idiomas,
                        items: contenido.idiomas.items.filter((item) => item.id !== idioma.id),
                      },
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            <button
              className="btn-suave"
              type="button"
              onClick={() =>
                actualizar({
                  idiomas: {
                    ...contenido.idiomas,
                    items: [
                      ...contenido.idiomas.items,
                      { id: crypto.randomUUID(), idioma: '', texto: '', nota: '' },
                    ],
                  },
                })
              }
            >
              <Plus size={16} />
              agregar idioma
            </button>
          </section>
        )}

        {seccion === 'historia' && (
          <section className="panel-seccion">
            <h2>🪐 Línea de tiempo</h2>
            <label className="campo">
              <span>Título</span>
              <input
                value={contenido.historia.titulo}
                onChange={(event) =>
                  actualizar({ historia: { ...contenido.historia, titulo: event.target.value } })
                }
              />
            </label>
            <label className="campo">
              <span>Subtítulo</span>
              <input
                value={contenido.historia.subtitulo}
                onChange={(event) =>
                  actualizar({ historia: { ...contenido.historia, subtitulo: event.target.value } })
                }
              />
            </label>

            {contenido.historia.items.map((hito, index) => (
              <div key={hito.id} className="bloque-hito">
                <div className="fila-hito">
                  <input
                    className="input-emoji"
                    value={hito.emoji}
                    maxLength={4}
                    onChange={(event) =>
                      actualizar({
                        historia: {
                          ...contenido.historia,
                          items: contenido.historia.items.map((item) =>
                            item.id === hito.id ? { ...item, emoji: event.target.value } : item
                          ),
                        },
                      })
                    }
                  />
                  <input
                    className="input-idioma"
                    value={hito.fecha}
                    placeholder="Fecha o momento"
                    onChange={(event) =>
                      actualizar({
                        historia: {
                          ...contenido.historia,
                          items: contenido.historia.items.map((item) =>
                            item.id === hito.id ? { ...item, fecha: event.target.value } : item
                          ),
                        },
                      })
                    }
                  />
                  <input
                    value={hito.titulo}
                    placeholder="Título del recuerdo"
                    onChange={(event) =>
                      actualizar({
                        historia: {
                          ...contenido.historia,
                          items: contenido.historia.items.map((item) =>
                            item.id === hito.id ? { ...item, titulo: event.target.value } : item
                          ),
                        },
                      })
                    }
                  />
                  <div className="fila-hito-acciones">
                    <button type="button" title="Subir" onClick={() => moverHito(index, -1)}>
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" title="Bajar" onClick={() => moverHito(index, 1)}>
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      className="accion-borrar"
                      title="Eliminar"
                      onClick={() =>
                        actualizar({
                          historia: {
                            ...contenido.historia,
                            items: contenido.historia.items.filter((item) => item.id !== hito.id),
                          },
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={hito.texto}
                  placeholder="Cuenta el recuerdo…"
                  onChange={(event) =>
                    actualizar({
                      historia: {
                        ...contenido.historia,
                        items: contenido.historia.items.map((item) =>
                          item.id === hito.id ? { ...item, texto: event.target.value } : item
                        ),
                      },
                    })
                  }
                />
              </div>
            ))}

            <button
              className="btn-suave"
              type="button"
              onClick={() =>
                actualizar({
                  historia: {
                    ...contenido.historia,
                    items: [
                      ...contenido.historia.items,
                      { id: crypto.randomUUID(), emoji: '💫', fecha: '', titulo: '', texto: '' },
                    ],
                  },
                })
              }
            >
              <Plus size={16} />
              agregar momento
            </button>
          </section>
        )}

        {seccion === 'musica' && (
          <section className="panel-seccion">
            <h2>🎧 Nuestra música en Spotify</h2>
            <label className="campo">
              <span>Título de la sección</span>
              <input
                value={contenido.musica.titulo}
                onChange={(event) => actualizar({ musica: { ...contenido.musica, titulo: event.target.value } })}
              />
            </label>
            <label className="campo">
              <span>Subtítulo</span>
              <input
                value={contenido.musica.subtitulo}
                onChange={(event) =>
                  actualizar({ musica: { ...contenido.musica, subtitulo: event.target.value } })
                }
              />
            </label>

            <h3 className="panel-subtitulo">Playlists completas</h3>

            {contenido.musica.playlists.map((playlist) => {
              const ref = parseSpotify(playlist.url)

              return (
                <div key={playlist.id} className="bloque-cancion">
                  <div className="fila-cancion">
                    <input
                      value={playlist.etiqueta}
                      placeholder="Nombre de la playlist (ej. Nuestros domingos)"
                      onChange={(event) =>
                        actualizar({
                          musica: {
                            ...contenido.musica,
                            playlists: contenido.musica.playlists.map((item) =>
                              item.id === playlist.id ? { ...item, etiqueta: event.target.value } : item
                            ),
                          },
                        })
                      }
                    />
                    <button
                      type="button"
                      className="accion-borrar boton-icono"
                      title="Eliminar playlist"
                      onClick={() =>
                        actualizar({
                          musica: {
                            ...contenido.musica,
                            playlists: contenido.musica.playlists.filter((item) => item.id !== playlist.id),
                          },
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="fila-url">
                    <input
                      value={playlist.url}
                      placeholder="https://open.spotify.com/playlist/…"
                      onChange={(event) =>
                        actualizar({
                          musica: {
                            ...contenido.musica,
                            playlists: contenido.musica.playlists.map((item) =>
                              item.id === playlist.id ? { ...item, url: event.target.value } : item
                            ),
                          },
                        })
                      }
                    />
                    {playlist.url ? (
                      ref ? (
                        <span className="url-ok">
                          <Check size={14} /> link válido
                        </span>
                      ) : (
                        <span className="url-mal">link no reconocido</span>
                      )
                    ) : null}
                  </div>

                  {ref && (
                    <img
                      className="spotify-scan spotify-scan-mini"
                      src={spotifyScanUrl(ref)}
                      alt="Código Spotify"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              )
            })}

            <button
              className="btn-suave"
              type="button"
              onClick={() =>
                actualizar({
                  musica: {
                    ...contenido.musica,
                    playlists: [
                      ...contenido.musica.playlists,
                      { id: crypto.randomUUID(), etiqueta: '', url: '' },
                    ],
                  },
                })
              }
            >
              <Plus size={16} />
              agregar playlist
            </button>

            <h3 className="panel-subtitulo">Canciones sueltas</h3>

            {contenido.musica.canciones.map((cancion) => {
              const ref = parseSpotify(cancion.url)

              return (
                <div key={cancion.id} className="bloque-cancion">
                  <div className="fila-cancion">
                    <input
                      value={cancion.titulo}
                      placeholder="Canción"
                      onChange={(event) =>
                        actualizar({
                          musica: {
                            ...contenido.musica,
                            canciones: contenido.musica.canciones.map((item) =>
                              item.id === cancion.id ? { ...item, titulo: event.target.value } : item
                            ),
                          },
                        })
                      }
                    />
                    <input
                      value={cancion.artista}
                      placeholder="Artista"
                      onChange={(event) =>
                        actualizar({
                          musica: {
                            ...contenido.musica,
                            canciones: contenido.musica.canciones.map((item) =>
                              item.id === cancion.id ? { ...item, artista: event.target.value } : item
                            ),
                          },
                        })
                      }
                    />
                    <button
                      type="button"
                      className="accion-borrar boton-icono"
                      title="Eliminar canción"
                      onClick={() =>
                        actualizar({
                          musica: {
                            ...contenido.musica,
                            canciones: contenido.musica.canciones.filter((item) => item.id !== cancion.id),
                          },
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="fila-url">
                    <input
                      value={cancion.url}
                      placeholder="https://open.spotify.com/track/…"
                      onChange={(event) =>
                        actualizar({
                          musica: {
                            ...contenido.musica,
                            canciones: contenido.musica.canciones.map((item) =>
                              item.id === cancion.id ? { ...item, url: event.target.value } : item
                            ),
                          },
                        })
                      }
                    />
                    {cancion.url ? (
                      ref ? (
                        <span className="url-ok">
                          <Check size={14} /> link válido
                        </span>
                      ) : (
                        <span className="url-mal">link no reconocido</span>
                      )
                    ) : null}
                  </div>

                  {ref && (
                    <img
                      className="spotify-scan spotify-scan-mini"
                      src={spotifyScanUrl(ref)}
                      alt="Código Spotify"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              )
            })}

            <button
              className="btn-suave"
              type="button"
              onClick={() =>
                actualizar({
                  musica: {
                    ...contenido.musica,
                    canciones: [
                      ...contenido.musica.canciones,
                      { id: crypto.randomUUID(), titulo: '', artista: '', url: '' },
                    ],
                  },
                })
              }
            >
              <Plus size={16} />
              agregar canción
            </button>
          </section>
        )}

        {seccion === 'final' && (
          <section className="panel-seccion">
            <h2>🏁 Pantalla final</h2>
            <label className="campo">
              <span>Título del final</span>
              <input
                value={contenido.final.titulo}
                onChange={(event) =>
                  actualizar({ final: { ...contenido.final, titulo: event.target.value } })
                }
              />
            </label>
            <label className="campo">
              <span>Mensaje final</span>
              <textarea
                rows={4}
                value={contenido.final.mensaje}
                onChange={(event) =>
                  actualizar({ final: { ...contenido.final, mensaje: event.target.value } })
                }
              />
            </label>
          </section>
        )}

        {seccion === 'publicar' && (
          <>
            <section className="panel-seccion">
              <h2>🚀 Publicar directo a GitHub</h2>

              <label className="campo">
                <span>Tu usuario de GitHub</span>
                <input
                  value={configGitHub.owner}
                  placeholder="ej. CristianLedesmaDev"
                  onChange={(event) => actualizarConfigGitHub({ owner: event.target.value })}
                />
              </label>
              <label className="campo">
                <span>Nombre del repositorio</span>
                <input
                  value={configGitHub.repo}
                  placeholder="ej. mivida"
                  onChange={(event) => actualizarConfigGitHub({ repo: event.target.value })}
                />
              </label>
              <label className="campo">
                <span>Token de GitHub</span>
                <input
                  type="password"
                  value={configGitHub.token}
                  placeholder="github_pat_…"
                  onChange={(event) => actualizarConfigGitHub({ token: event.target.value })}
                />
              </label>

              {listoParaPublicar && (
                <p className="sesion-activa">
                  <span>
                    <Check size={15} /> Listo para publicar en{' '}
                    <strong>{configGitHub.owner}/{configGitHub.repo}</strong>
                  </span>
                </p>
              )}

              <button className="btn-amor" type="button" onClick={guardarYPublicar} disabled={publicando}>
                <CloudUpload size={17} />
                {publicando ? 'Publicando…' : 'Publicar ahora'}
              </button>
            </section>

            <section className="panel-seccion panel-guia">
              <h2>📦 Plan B: archivo mágico</h2>

              <div className="panel-acciones">
                <button className="btn-suave" type="button" onClick={descargarArchivo}>
                  <Download size={17} />
                  Descargar archivo mágico
                </button>
                <button className="btn-suave" type="button" onClick={() => inputImportar.current?.click()}>
                  <FileUp size={17} />
                  Importar archivo
                </button>
                <input
                  ref={inputImportar}
                  type="file"
                  accept="application/json,.json"
                  className="hidden-input"
                  onChange={importarArchivo}
                />
              </div>
            </section>
          </>
        )}
      </main>

      <ImageCropModal
        open={fotoRecorte !== null}
        image={fotoRecorte ? { src: fotoRecorte.src, name: fotoRecorte.caption || 'Foto' } : null}
        onClose={() => setFotoRecorte(null)}
        onSave={guardarRecorte}
      />
    </div>
  )
}
