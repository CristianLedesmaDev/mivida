import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import type { Contenido } from './content'

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL
const LLAVE_SUPABASE = import.meta.env.VITE_SUPABASE_ANON_KEY

let cliente: SupabaseClient | null = null

// Si el proyecto todavía no tiene Supabase configurado, todo esto se vuelve
// un no-op y la app sigue funcionando con el contenido.json de siempre.
export function supabaseListo(): boolean {
  return Boolean(URL_SUPABASE && LLAVE_SUPABASE)
}

export function obtenerCliente(): SupabaseClient | null {
  if (!supabaseListo()) {
    return null
  }

  if (!cliente) {
    cliente = createClient(URL_SUPABASE!, LLAVE_SUPABASE!)
  }

  return cliente
}

const FILA_CONTENIDO = 1

export async function leerContenidoRemoto(): Promise<Contenido | null> {
  const supabase = obtenerCliente()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('contenido')
    .select('data')
    .eq('id', FILA_CONTENIDO)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data.data as Contenido
}

export async function guardarContenidoRemoto(contenido: Contenido): Promise<void> {
  const supabase = obtenerCliente()

  if (!supabase) {
    throw new Error('Supabase no está configurado todavía.')
  }

  const { error } = await supabase
    .from('contenido')
    .upsert({ id: FILA_CONTENIDO, data: contenido, updated_at: new Date().toISOString() })

  if (error) {
    throw new Error(traducirError(error.message))
  }
}

// Avisa en vivo si el contenido cambió en Supabase (para que, si ella tiene
// la página abierta cuando publicas, la vea actualizarse sola).
export function suscribirseAContenido(onCambio: (contenido: Contenido) => void): () => void {
  const supabase = obtenerCliente()

  if (!supabase) {
    return () => {}
  }

  const canal = supabase
    .channel('contenido-en-vivo')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'contenido', filter: `id=eq.${FILA_CONTENIDO}` },
      (payload) => {
        const nuevo = (payload.new as { data?: Contenido } | null)?.data
        if (nuevo) {
          onCambio(nuevo)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(canal)
  }
}

export async function iniciarSesion(email: string, password: string): Promise<void> {
  const supabase = obtenerCliente()

  if (!supabase) {
    throw new Error('Primero conecta tu proyecto de Supabase.')
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(traducirError(error.message))
  }
}

export async function cerrarSesion(): Promise<void> {
  const supabase = obtenerCliente()
  await supabase?.auth.signOut()
}

export async function sesionActual(): Promise<Session | null> {
  const supabase = obtenerCliente()

  if (!supabase) {
    return null
  }

  const { data } = await supabase.auth.getSession()
  return data.session
}

export function alCambiarSesion(callback: (sesion: Session | null) => void): () => void {
  const supabase = obtenerCliente()

  if (!supabase) {
    return () => {}
  }

  const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => callback(sesion))
  return () => data.subscription.unsubscribe()
}

// Sube un archivo (foto o audio) al bucket indicado y regresa su URL pública.
export async function subirArchivo(bucket: 'fotos' | 'audios', file: File): Promise<string> {
  const supabase = obtenerCliente()

  if (!supabase) {
    throw new Error('Supabase no está configurado todavía.')
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'dat'
  const ruta = `${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from(bucket).upload(ruta, file, {
    cacheControl: '31536000',
    upsert: false,
  })

  if (error) {
    throw new Error(traducirError(error.message))
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(ruta)
  return data.publicUrl
}

function traducirError(mensaje: string): string {
  if (mensaje.includes('Invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }

  if (mensaje.includes('JWT') || mensaje.includes('permission') || mensaje.includes('policy')) {
    return 'No tienes permiso para hacer esto. ¿Iniciaste sesión?'
  }

  return mensaje
}
