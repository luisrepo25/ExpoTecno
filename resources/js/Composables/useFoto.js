/**
 * useFoto.js
 * Composable: resolución de URLs de fotos de personas.
 *
 * La BD puede contener per_foto en 4 formatos distintos según el origen:
 *   1. URL absoluta  → "https://servidor.com/foto.png"  (otros grupos)
 *   2. Storage local → "/storage/fotos/xxxx.jpg"        (subidas aquí)
 *   3. Nombre suelto → "9760600_timestamp.png"          (sistema PHP del grupo)
 *   4. Ruta relativa → "personas/rvU2g...jpg"           (otro sistema, sin base URL)
 */
import { ref } from 'vue'

// Base URL del servidor tecnoweb donde están las imágenes del sistema PHP original.
// Configurable en .env → VITE_FOTO_BASE_URL
const FOTO_BASE = (import.meta.env.VITE_FOTO_BASE_URL ?? '').replace(/\/$/, '')

export function useFoto() {
  /** Set de per_cod cuya imagen falló al cargar (404 u otro error de red) */
  const brokenFotos = ref(new Set())

  /** Devuelve la URL pública de la foto o '' si no hay URL resoluble */
  function fotoSrc(p) {
    const path = (p.per_foto ?? '').trim()
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (path.startsWith('/storage/'))                               return path
    if (!path.includes('/') && FOTO_BASE)   return `${FOTO_BASE}/${path}`
    return ''  // ruta con carpeta pero sin servidor conocido
  }

  /** true si la persona tiene foto que se puede intentar mostrar */
  function showFoto(p) {
    const path = (p.per_foto ?? '').trim()
    if (!path || path.includes('placeholder'))       return false
    if (brokenFotos.value.has(p.per_cod?.trim()))    return false
    return fotoSrc(p).length > 0
  }

  /** Marca la foto de la persona como rota para mostrar iniciales */
  function fotoError(p) {
    brokenFotos.value = new Set([...brokenFotos.value, p.per_cod?.trim()])
  }

  return { brokenFotos, fotoSrc, showFoto, fotoError }
}
