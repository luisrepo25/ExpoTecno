/**
 * useSearch.js
 * Composable: lógica de búsqueda — demuestra AJAX vs Sin AJAX en vivo.
 *
 * ╔══════════════════════════╦══════════════════════════════════════════╗
 * ║       SIN AJAX           ║           CON AJAX (Inertia)             ║
 * ╠══════════════════════════╬══════════════════════════════════════════╣
 * ║ Disparo: clic en botón   ║ Disparo: al escribir (debounce 500 ms)   ║
 * ║ Mecanismo: window.href   ║ Mecanismo: router.get() con X-Inertia    ║
 * ║ Resultado: reload total  ║ Resultado: solo props.personas actualiza  ║
 * ║ Estado Vue: destruido    ║ Estado Vue: preservado (preserveState)   ║
 * ║ Request Log: desaparece  ║ Request Log: persiste en tiempo real     ║
 * ║ Servidor responde: HTML  ║ Servidor responde: JSON puro             ║
 * ╚══════════════════════════╩══════════════════════════════════════════╝
 */
import { ref, watch } from 'vue'
import { router }     from '@inertiajs/vue3'

export function useSearch(addLog) {

  // ── MODO SIN AJAX ─────────────────────────────────────────────────────────
  // Se inicializa desde la URL real del navegador: después de una recarga con
  // ?buscar=..., el input muestra el término buscado (coherencia con el servidor).
  const urlParams     = new URLSearchParams(window.location.search)
  const buscarManual  = ref(urlParams.get('buscar') ?? '')
  const fullReloading = ref(false)

  /**
   * Búsqueda SIN AJAX — navegación tradicional completa.
   *
   * Qué ocurre en el navegador:
   *   1. window.location.href cambia → el browser inicia un GET clásico
   *   2. El request NO lleva el header "X-Inertia: true"
   *   3. El servidor detecta que no es Inertia → responde con HTML completo
   *   4. El browser destruye la app Vue y la remonta desde cero
   *   5. Todo el estado local (logs, selected, form…) queda en blanco
   */
  function ejecutarBusquedaManual() {
    const q = buscarManual.value.trim()
    sessionStorage.setItem('sinAjaxLog', JSON.stringify({
      status: 'GET (SIN AJAX)',
      url:    `/?buscar=${encodeURIComponent(q)}`,
      body:   { buscar: q, nota: 'Recarga real del navegador — no es AJAX' },
    }))
    fullReloading.value = true

    // Desvanece solo el área de contenido (no toda la pestaña)
    // para indicar que los resultados van a cambiar por recarga completa.
    document.body.classList.add('sin-ajax-loading')

    setTimeout(() => {
      const url = new URL(window.location.origin + '/')
      if (q) url.searchParams.set('buscar', q)
      window.location.href = url.toString()   // ← recarga real, sin AJAX
    }, 300)
  }

  /**
   * Limpiar filtro SIN AJAX.
   * Incluso vaciar el campo exige una nueva petición al servidor.
   * Con AJAX, borrar el texto actualiza la lista al instante sin recargar nada.
   */
  function limpiarBusquedaManual() {
    buscarManual.value = ''
    sessionStorage.setItem('sinAjaxLog', JSON.stringify({
      status: 'GET (SIN AJAX)',
      url:    '/',
      body:   { buscar: '', nota: 'Limpiar filtro — recarga sin parámetros' },
    }))
    fullReloading.value = true
    document.body.classList.add('sin-ajax-loading')
    setTimeout(() => {
      window.location.href = window.location.origin + '/'
    }, 300)
  }

  // ── MODO CON AJAX ─────────────────────────────────────────────────────────
  // Siempre vacío al montar — independiente de la URL.
  const buscar    = ref('')
  let searchTimer = null

  /**
   * Búsqueda CON AJAX — actualización parcial con Inertia.
   *
   * ─────────────────────────────────────────────────────────────────────────
   * AJAX PURO con fetch() (lo que hace Inertia internamente):
   *
   *   async function buscarPersona(nombre) {
   *     const url  = `/?buscar=${nombre}`
   *     const res  = await fetch(url, {
   *       headers: { 'X-Inertia': 'true', 'X-Inertia-Version': '...' }
   *     })
   *     const data = await res.json()   // ← servidor devuelve JSON, no HTML
   *     actualizarTabla(data.props.personas)
   *     // ✓ sin recargar la página
   *   }
   *
   * Inertia hace exactamente eso — router.get() es el fetch() del framework:
   * ─────────────────────────────────────────────────────────────────────────
   *
   * Qué ocurre paso a paso:
   *   1. watch() detecta que buscar cambió → espera 500 ms (debounce)
   *   2. router.get() envía GET con header "X-Inertia: true"
   *   3. Laravel detecta el header → responde solo con JSON (no HTML):
   *        { component: "Agenda", props: { personas: [...], filtros: {...} } }
   *   4. Inertia recibe el JSON → reemplaza props.personas en Vue
   *   5. Vue actualiza la tabla reactivamente — NADA más cambia en la UI
   *   6. Estado local (logs, selected, form) intacto
   */
  watch(buscar, (val) => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      // Registrar el REQUEST en el log
      addLog('request', 'GET (CON AJAX)', `/?buscar=${encodeURIComponent(val)}`, {
        headers:  { 'X-Inertia': 'true' },
        buscar:   val,
        nota:     'Inertia → fetch() interno → servidor responde JSON',
      })

      // Aquí el fetch() ocurre (gestionado por Inertia)
      router.get('/', { buscar: val }, {
        preserveState: true,
        replace:       true,

        // Registrar la RESPUESTA JSON del servidor
        onSuccess: (page) => addLog('response', '200 JSON', `/?buscar=${encodeURIComponent(val)}`, {
          'Content-Type':   'application/json',
          component:        page.component,
          'props.personas': `Array(${page.props.personas?.length ?? 0})`,
          nota:             'Servidor respondió JSON — no HTML',
        }),
      })
    }, 500)   // debounce: 500 ms para reducir peticiones al servidor remoto
  })

  return {
    buscarManual,
    fullReloading,
    ejecutarBusquedaManual,
    limpiarBusquedaManual,
    buscar,
  }
}
