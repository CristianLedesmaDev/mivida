import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ArrowDown,
  ArrowUp,
  Check,
  CloudUpload,
  Copy,
  Crop,
  Database,
  Download,
  Eye,
  FileUp,
  LogIn,
  LogOut,
  Lock,
  Mic,
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
  type AudioClip,
  type Contenido,
  type Foto,
} from './content'
import {
  alCambiarSesion,
  cerrarSesion,
  guardarContenidoRemoto,
  iniciarSesion,
  sesionActual,
  subirArchivo,
  supabaseListo,
} from './supabase'
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
  { id: 'audios', etiqueta: '🎙️ Audios' },
  { id: 'playlist', etiqueta: '🎧 Playlist' },
  { id: 'final', etiqueta: '🏁 Final' },
  { id: 'conexion', etiqueta: '🔌 Conexión' },
] as const

type SeccionId = (typeof SECCIONES)[number]['id']

const SQL_SETUP = `create table public.contenido (
  id int primary key default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint solo_una_fila check (id = 1)
);
insert into public.contenido (id, data) values (1, '{}'::jsonb);
alter table public.contenido enable row level security;

create policy "lectura publica" on public.contenido
  for select using (true);
create policy "solo admin escribe" on public.contenido
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true);
insert into storage.buckets (id, name, public) values ('audios', 'audios', true);

create policy "fotos lectura publica" on storage.objects
  for select using (bucket_id = 'fotos');
create policy "fotos solo admin sube" on storage.objects
  for insert with check (bucket_id = 'fotos' and auth.role() = 'authenticated');
create policy "audios lectura publica" on storage.objects
  for select using (bucket_id = 'audios');
create policy "audios solo admin sube" on storage.objects
  for insert with check (bucket_id = 'audios' and auth.role() = 'authenticated');`

const cargarImagen = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const imagen = new Image()
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new Error('No se pudo leer la imagen'))
    imagen.src = src
  })

// Reduce las fotos antes de guardarlas para que el borrador local no pese
// demasiado (solo aplica cuando aún no hay Supabase conectado).
async function archivoADataUrl(file: File, maxLado = 1400, calidad = 0.85): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })

  const imagen = await cargarImagen(dataUrl)
  const factor = Math.min(1, maxLado / Math.max(imagen.naturalWidth, imagen.naturalHeight))

  if (factor === 1 && file.size < 350_000) {
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
        <p className="subtitulo-escena">
          esta parte es solo para quien hizo la página. Pista: la fecha en la que todo empezó
          (ddmmaa).
        </p>

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
  const [sesion, setSesion] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [entrandoSesion, setEntrandoSesion] = useState(false)
  const [errorSesion, setErrorSesion] = useState('')
  const [sqlCopiado, setSqlCopiado] = useState(false)
  const inputFotos = useRef<HTMLInputElement>(null)
  const inputAudios = useRef<HTMLInputElement>(null)
  const inputImportar = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!autorizado) {
      return
    }

    if (!guardarBorrador(contenido)) {
      setEstado('⚠ No cupo todo en el navegador. Borra alguna foto o usa fotos más ligeras.')
    }
  }, [contenido, autorizado])

  useEffect(() => {
    if (!autorizado || !supabaseListo()) {
      return
    }

    sesionActual().then(setSesion)
    return alCambiarSesion(setSesion)
  }, [autorizado])

  if (!autorizado) {
    return <PinGate onOk={() => setAutorizado(true)} />
  }

  const conectado = supabaseListo() && sesion !== null

  const actualizar = (parche: Partial<Contenido>) => {
    setContenido((previo) => ({ ...previo, ...parche }))
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

    if (!supabaseListo()) {
      setSeccion('conexion')
      setEstado('⚠ Primero conecta Supabase (pestaña 🔌 Conexión) para publicar sin GitHub.')
      return
    }

    if (!sesion) {
      setSeccion('conexion')
      setEstado('⚠ Primero inicia sesión (pestaña 🔌 Conexión) para poder publicar.')
      return
    }

    setPublicando(true)
    setEstado('Publicando… ⏳')

    try {
      await guardarContenidoRemoto(contenido)
      setEstado('¡Publicado! Ella ya lo puede ver, sin esperar nada más. 💘')
    } catch (error) {
      setEstado(`⚠ ${error instanceof Error ? error.message : 'Algo salió mal. Intenta de nuevo.'}`)
    } finally {
      setPublicando(false)
    }
  }

  const entrar = async (event: FormEvent) => {
    event.preventDefault()

    if (entrandoSesion) {
      return
    }

    setEntrandoSesion(true)
    setErrorSesion('')

    try {
      await iniciarSesion(email, password)
      setPassword('')
    } catch (error) {
      setErrorSesion(error instanceof Error ? error.message : 'No se pudo iniciar sesión.')
    } finally {
      setEntrandoSesion(false)
    }
  }

  const salir = async () => {
    await cerrarSesion()
  }

  const copiarSql = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SETUP)
      setSqlCopiado(true)
      setTimeout(() => setSqlCopiado(false), 2000)
    } catch {
      // si el navegador bloquea el portapapeles, igual pueden seleccionar el texto a mano
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
        const src = conectado ? await subirArchivo('fotos', archivo) : await archivoADataUrl(archivo)
        nuevas.push({ id: crypto.randomUUID(), src, caption: archivo.name.replace(/\.[^.]+$/, '') })
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

  const subirAudios = async (event: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(event.target.files ?? []).filter((archivo) =>
      archivo.type.startsWith('audio/')
    )
    event.target.value = ''

    if (archivos.length === 0) {
      return
    }

    if (!conectado) {
      setEstado('⚠ Conecta Supabase e inicia sesión primero (pestaña 🔌 Conexión) para subir audio.')
      return
    }

    setEstado('Subiendo audio…')

    const nuevos: AudioClip[] = []

    for (const archivo of archivos) {
      try {
        const src = await subirArchivo('audios', archivo)
        nuevos.push({ id: crypto.randomUUID(), src, titulo: archivo.name.replace(/\.[^.]+$/, '') })
      } catch {
        // si un audio falla, seguimos con los demás
      }
    }

    if (nuevos.length > 0) {
      actualizar({ audios: { ...contenido.audios, items: [...contenido.audios.items, ...nuevos] } })
      setEstado(`Se ${nuevos.length === 1 ? 'agregó 1 audio' : `agregaron ${nuevos.length} audios`}. 🎙️`)
    } else {
      setEstado('⚠ No se pudo subir ningún audio.')
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
          <span className={`estado-conexion ${conectado ? 'estado-conexion-ok' : ''}`}>
            <Database size={13} />
            {conectado ? 'Supabase conectado — publicas al instante' : 'Supabase sin conectar'}
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
            <p className="panel-nota">La fecha del contador se cambia en “💗 Lo básico”.</p>
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
                {conectado
                  ? 'se guardan en tu Supabase y luego las recortas aquí mismo'
                  : 'se comprimen y guardan en este navegador; conecta Supabase para que vivan en la nube'}
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
            <p className="panel-nota">
              Ponles categoría para que aparezcan chips de filtro en la página (ej. {CATEGORIAS_RAZONES.join(', ')}).
            </p>

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

        {seccion === 'audios' && (
          <section className="panel-seccion">
            <h2>🎙️ Audios ({contenido.audios.items.length})</h2>
            <label className="campo">
              <span>Título de la sección</span>
              <input
                value={contenido.audios.titulo}
                onChange={(event) =>
                  actualizar({ audios: { ...contenido.audios, titulo: event.target.value } })
                }
              />
            </label>
            <label className="campo">
              <span>Subtítulo</span>
              <input
                value={contenido.audios.subtitulo}
                onChange={(event) =>
                  actualizar({ audios: { ...contenido.audios, subtitulo: event.target.value } })
                }
              />
            </label>

            <input
              ref={inputAudios}
              type="file"
              accept="audio/*"
              multiple
              className="hidden-input"
              onChange={subirAudios}
            />

            {conectado ? (
              <button className="subir-fotos" type="button" onClick={() => inputAudios.current?.click()}>
                <Mic size={22} />
                <span>
                  <strong>Sube notas de voz o canciones</strong>
                  se guardan directo en tu Supabase
                </span>
              </button>
            ) : (
              <p className="panel-nota">
                ⚠ Conecta Supabase e inicia sesión (pestaña 🔌 Conexión) para poder subir audio: los
                archivos de audio son pesados para guardarlos solo en este navegador.
              </p>
            )}

            <div className="panel-audios">
              {contenido.audios.items.map((audio) => (
                <article key={audio.id} className="panel-audio">
                  <audio controls src={audio.src} />
                  <input
                    value={audio.titulo}
                    placeholder="Título"
                    onChange={(event) =>
                      actualizar({
                        audios: {
                          ...contenido.audios,
                          items: contenido.audios.items.map((item) =>
                            item.id === audio.id ? { ...item, titulo: event.target.value } : item
                          ),
                        },
                      })
                    }
                  />
                  <input
                    value={audio.nota ?? ''}
                    placeholder="Nota (opcional)"
                    onChange={(event) =>
                      actualizar({
                        audios: {
                          ...contenido.audios,
                          items: contenido.audios.items.map((item) =>
                            item.id === audio.id ? { ...item, nota: event.target.value } : item
                          ),
                        },
                      })
                    }
                  />
                  <button
                    type="button"
                    className="accion-borrar boton-icono"
                    title="Eliminar audio"
                    onClick={() =>
                      actualizar({
                        audios: {
                          ...contenido.audios,
                          items: contenido.audios.items.filter((item) => item.id !== audio.id),
                        },
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {seccion === 'playlist' && (
          <section className="panel-seccion">
            <h2>🎧 Playlist con Spotify</h2>

            <div className="bloque-playlist-grande">
              <label className="campo">
                <span>Tu playlist completa de Spotify (opcional, la mejor opción)</span>
                <input
                  value={contenido.final.spotifyPlaylistUrl ?? ''}
                  placeholder="https://open.spotify.com/playlist/…"
                  onChange={(event) =>
                    actualizar({ final: { ...contenido.final, spotifyPlaylistUrl: event.target.value } })
                  }
                />
              </label>
              <p className="panel-nota">
                Créala en la app de Spotify, dale <strong>Compartir → Copiar enlace al playlist</strong> y
                pégala aquí. Sale como un reproductor grande, arriba de las canciones sueltas.
              </p>
              {contenido.final.spotifyPlaylistUrl ? (
                parseSpotify(contenido.final.spotifyPlaylistUrl) ? (
                  <span className="url-ok">
                    <Check size={14} /> link válido
                  </span>
                ) : (
                  <span className="url-mal">link no reconocido</span>
                )
              ) : null}
            </div>

            <p className="panel-nota">
              También puedes agregar canciones sueltas: pega el link de cada una (en Spotify:
              compartir → copiar enlace). Si el link es válido, en la página aparece el reproductor
              con la portada y el código para escanear. Sin link, se muestra solo el nombre.
            </p>

            {contenido.final.playlist.map((cancion) => {
              const ref = parseSpotify(cancion.url)

              return (
                <div key={cancion.id} className="bloque-cancion">
                  <div className="fila-cancion">
                    <input
                      value={cancion.titulo}
                      placeholder="Canción"
                      onChange={(event) =>
                        actualizar({
                          final: {
                            ...contenido.final,
                            playlist: contenido.final.playlist.map((item) =>
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
                          final: {
                            ...contenido.final,
                            playlist: contenido.final.playlist.map((item) =>
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
                          final: {
                            ...contenido.final,
                            playlist: contenido.final.playlist.filter((item) => item.id !== cancion.id),
                          },
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="fila-url">
                    <input
                      value={cancion.url ?? ''}
                      placeholder="https://open.spotify.com/track/…"
                      onChange={(event) =>
                        actualizar({
                          final: {
                            ...contenido.final,
                            playlist: contenido.final.playlist.map((item) =>
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
                  final: {
                    ...contenido.final,
                    playlist: [
                      ...contenido.final.playlist,
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
            <p className="panel-nota">
              Arriba del final también corre una cintita con sus apodos (se editan en “💗 Lo básico”)
              y abajo va la playlist (pestaña “🎧 Playlist”).
            </p>
          </section>
        )}

        {seccion === 'conexion' && (
          <>
            <section className="panel-seccion">
              <h2>🔌 Conexión con Supabase (recomendado)</h2>
              <p className="panel-nota">
                Con esto conectado, cada vez que toques <strong>“Guardar y publicar”</strong> ella lo
                ve al momento al abrir (o incluso en vivo si ya tiene la página abierta) — sin tocar
                GitHub ni esperar nada.
              </p>

              {!supabaseListo() ? (
                <p className="conexion-aviso">
                  ⚠ Tu página todavía no tiene las llaves de Supabase. Sigue la guía de abajo y
                  agrégalas como te explico.
                </p>
              ) : !sesion ? (
                <form className="form-login" onSubmit={entrar}>
                  <label className="campo">
                    <span>Tu correo (el que registraste en Supabase)</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </label>
                  <label className="campo">
                    <span>Tu contraseña</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </label>
                  {errorSesion && <p className="pin-error">{errorSesion}</p>}
                  <button className="btn-amor" type="submit" disabled={entrandoSesion}>
                    <LogIn size={16} />
                    {entrandoSesion ? 'Entrando…' : 'Iniciar sesión'}
                  </button>
                </form>
              ) : (
                <div className="sesion-activa">
                  <span>
                    <Check size={15} /> Conectado como <strong>{sesion.user.email}</strong>
                  </span>
                  <button className="btn-suave" type="button" onClick={salir}>
                    <LogOut size={15} />
                    Cerrar sesión
                  </button>
                </div>
              )}

              <details className="guia-token">
                <summary>¿Cómo conecto Supabase? (pasos, ~10 min, gratis)</summary>
                <ol>
                  <li>Crea cuenta gratis en <strong>supabase.com</strong> y un proyecto nuevo.</li>
                  <li>
                    Ve a <strong>SQL Editor</strong> → pega este script → <strong>Run</strong>:
                    <div className="bloque-sql">
                      <pre>{SQL_SETUP}</pre>
                      <button type="button" className="btn-suave sql-copiar" onClick={copiarSql}>
                        <Copy size={14} />
                        {sqlCopiado ? 'copiado ✓' : 'copiar'}
                      </button>
                    </div>
                  </li>
                  <li>
                    Ve a <strong>Authentication → Users → Add user</strong> y crea tu usuario (tu
                    correo + una contraseña). Esa va a ser tu cuenta de admin.
                  </li>
                  <li>
                    Ve a <strong>Project Settings → API</strong> y copia el <strong>Project URL</strong>{' '}
                    y la <strong>anon public key</strong>.
                  </li>
                  <li>
                    En tu computadora: copia el archivo <code>.env.local.example</code> a{' '}
                    <code>.env.local</code> y pega ahí esos dos valores. Reinicia <code>npm run dev</code>.
                  </li>
                  <li>
                    Para que funcione en GitHub Pages: en tu repositorio → <strong>Settings → Secrets and
                    variables → Actions</strong>, crea los secrets <code>VITE_SUPABASE_URL</code> y{' '}
                    <code>VITE_SUPABASE_ANON_KEY</code> con esos mismos valores, y vuelve a hacer push.
                  </li>
                  <li>Recarga esta página, inicia sesión arriba con tu correo y contraseña, ¡y ya!</li>
                </ol>
              </details>
            </section>

            <section className="panel-seccion panel-guia">
              <h2>📦 Plan B: archivo mágico</h2>
              <p className="panel-nota">
                Úsalo mientras conectas Supabase, o como respaldo. No se actualiza sola: hay que
                subir el archivo a mano cada vez.
              </p>
              <ol>
                <li>Toca <strong>“Descargar archivo mágico”</strong>: se baja <code>contenido.json</code>.</li>
                <li>En github.com abre tu repositorio → carpeta <code>public</code>.</li>
                <li><strong>Add file → Upload files</strong>, arrastra el archivo y dale <strong>Commit changes</strong>.</li>
                <li>Espera 1-2 minutos… ¡y ya lo ve ella! 💌</li>
              </ol>

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

              <p className="panel-nota">
                Para volver a entrar aquí: agrega <code>#panel</code> al final del link, o toca 5
                veces el corazoncito del final de la página. PIN: la fecha en la que empezaron (ddmmaa).
              </p>
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
