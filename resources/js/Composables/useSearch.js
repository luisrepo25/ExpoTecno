
import { ref, watch } from 'vue'
import { router }     from '@inertiajs/vue3'

export function useSearch(addLog) {

  // ── MODO SIN AJAX ─────────────────────────────────────────────────────────
  // Se inicializa desde la URL real del navegador: después de una recarga con
  // ?buscar=..., el input muestra el término buscado (coherencia con el servidor).
  const urlParams     = new URLSearchParams(window.location.search)
  const buscarManual  = ref(urlParams.get('buscar') ?? '')
  const fullReloading = ref(false)

  function ejecutarBusquedaManual() {
    const q = buscarManual.value.trim()
    sessionStorage.setItem('sinAjaxLog', JSON.stringify({
      status: 'GET (SIN AJAX)',
      url:    `/?buscar=${encodeURIComponent(q)}`,
      body:   { buscar: q, nota: 'Recarga real del navegador — no es AJAX' },
    }))
    fullReloading.value = true
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

        // Manejo de errores: registra y notifica al usuario de forma mínima
        onError: (err) => {
          try {
            addLog('error', 'AJAX FAILED', `/?buscar=${encodeURIComponent(val)}`, err)
          } catch (e) {
            console.error('Error logging AJAX failure', e)
          }
          // notificación mínima y segura (alert evita referencia a utilidades externas)
          try { alert('Error al buscar. Puede intentar recargar la página o usar Buscar sin AJAX.') } catch (e) { console.error(e) }
        },

        // Siempre: limpiar indicadores si los hubiera
        onFinish: () => {
        },
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
