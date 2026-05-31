/**
 * useRequestLog.js
 * Composable: gestión del Request Log de peticiones HTTP.
 *
 * Cada entrada tiene un `type` que distingue:
 *   'request'  → lo que el cliente envió al servidor
 *   'response' → lo que el servidor devolvió (JSON o recarga)
 *   'error'    → respuesta de error del servidor
 *
 * Esto "desnuda" el ciclo AJAX completo frente al docente:
 *   Cliente envía REQUEST → Servidor devuelve RESPONSE JSON
 */
import { ref, onMounted } from 'vue'

export function useRequestLog(personasRef) {
  const logs = ref([])

  /**
   * @param {'request'|'response'|'error'} type
   * @param {string} status  Código o etiqueta visible en el badge
   * @param {string} url     Ruta solicitada
   * @param {object} data    Payload o respuesta a mostrar
   */
  function addLog(type, status, url, data) {
    logs.value.unshift({
      id: Date.now(),
      ts: new Date().toLocaleTimeString('es', { hour12: false }),
      type,
      status,
      url,
      data,
    })
    if (logs.value.length > 30) logs.value.pop()
  }

  /** Clase CSS del badge según código de estado */
  function logStatusClass(s) {
    if (s.startsWith('2'))                                              return 'ls-ok'
    if (s.startsWith('3'))                                              return 'ls-rd'
    if (s.startsWith('4') || s.startsWith('G') || s.startsWith('P'))   return 'ls-rq'
    if (s === 'SIN AJAX')                                               return 'ls-noajax'
    return 'ls-rq'
  }

  /**
   * Restaura el log de "Sin AJAX" desde sessionStorage.
   * window.location.href destruye todo el estado Vue.
   * sessionStorage es el puente que sobrevive al reload.
   */
  onMounted(() => {
    const raw = sessionStorage.getItem('sinAjaxLog')
    if (!raw) return
    sessionStorage.removeItem('sinAjaxLog')
    try {
      const { status, url, body } = JSON.parse(raw)
      addLog('request',  status,    url, body)
      addLog('response', '200 HTML', url, {
        'Content-Type': 'text/html',
        nota:           'Servidor respondió HTML completo — no AJAX',
        resultados:     personasRef?.value?.length ?? 0,
      })
    } catch (_) { /* JSON malformado → ignorar */ }
  })

  return { logs, addLog, logStatusClass }
}
