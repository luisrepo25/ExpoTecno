<!--
  Agenda.vue — Página principal: Directorio de Personas
  ═══════════════════════════════════════════════════════
  Rol: orquestador. Conecta composables con componentes.
  NO contiene lógica de negocio ni markup complejo.

  Composables usados:
    · useSearch      → dos modos de búsqueda (AJAX y Sin AJAX)
    · useRequestLog  → log de peticiones en tiempo real
    · useFoto        → resolución de URLs de fotos

  Componentes usados:
    · SearchCompare  → UI del comparador didáctico AJAX vs Sin AJAX
    · PersonaForm    → formulario de nueva persona
    · PersonaTable   → tabla de resultados
    · PersonaDetail  → barra de detalle con actualización de foto
    · RequestLog     → panel lateral de logs
-->
<script setup>
import '../../css/agenda.css'
import { ref }      from 'vue'
import { router, useForm } from '@inertiajs/vue3'

// ── Componentes ──────────────────────────────────────────────────────────
import SearchCompare from '../Components/Agenda/SearchCompare.vue'
import PersonaForm   from '../Components/Agenda/PersonaForm.vue'
import PersonaTable  from '../Components/Agenda/PersonaTable.vue'
import PersonaDetail from '../Components/Agenda/PersonaDetail.vue'
import RequestLog    from '../Components/Agenda/RequestLog.vue'

// ── Composables ──────────────────────────────────────────────────────────
import { useSearch }     from '../Composables/useSearch.js'
import { useRequestLog } from '../Composables/useRequestLog.js'
import { useFoto }       from '../Composables/useFoto.js'

// ── Props de Inertia ─────────────────────────────────────────────────────
const props = defineProps({
  personas: Array,
  filtros:  Object,
})

// ── Indicador de carga (barra dorada superior) ────────────────────────────
// Solo se activa para operaciones POST (guardar persona, actualizar foto).
// Las búsquedas AJAX son silenciosas — el Request Log documenta la actividad.
// Esto ilustra que AJAX no "congela" la UI: el usuario puede seguir escribiendo.
const isLoading = ref(false)

// ── Log de peticiones ────────────────────────────────────────────────────
const personasRef               = { value: props.personas }  // ref proxy para onMounted
const { logs, addLog, logStatusClass } = useRequestLog(personasRef)

// ── Búsqueda AJAX y Sin AJAX ─────────────────────────────────────────────
const {
  buscarManual, fullReloading,
  ejecutarBusquedaManual, limpiarBusquedaManual,
  buscar,
} = useSearch(addLog)

// ── Resolución de imágenes ───────────────────────────────────────────────
const { fotoSrc, showFoto, fotoError, brokenFotos } = useFoto()

// Helper: iniciales de nombre + apellido
function initials(p) {
  const n = (p.per_nom  ?? '').trim()
  const a = (p.per_appm ?? '').trim()
  return ((n[0] ?? '') + (a[0] ?? '')).toUpperCase()
}

// ── Persona seleccionada ─────────────────────────────────────────────────
const selected = ref(null)

function toggleSelect(p) {
  selected.value = selected.value?.per_cod === p.per_cod ? null : p
}

// ── Formulario nueva persona ─────────────────────────────────────────────
const showForm    = ref(false)
const fotoPreview = ref(null)
const form        = useForm({
  per_cod: '', per_nom: '', per_appm: '', per_prof: '',
  per_telf: '', per_cel: '', per_email: '', per_dir: '',
  per_fnac: '', per_lnac: '', per_foto: null,
})

function onFotoChange(e) {
  const file = e.target.files[0]
  if (!file) return
  form.per_foto    = file
  fotoPreview.value = URL.createObjectURL(file)
}

function guardar() {
  isLoading.value = true   // barra dorada: POST es una operación pesada
  addLog('request', 'POST', '/personas', { per_cod: form.per_cod, per_nom: form.per_nom })
  form.post('/personas', {
    forceFormData: true,
    onSuccess: () => {
      isLoading.value = false
      addLog('response', '302 → GET /', '/personas', { nota: 'Inertia interceptó la redirección → JSON' })
      form.reset()
      fotoPreview.value = null
      showForm.value    = false
    },
    onError: (err) => {
      isLoading.value = false
      addLog('error', '422 Error', '/personas', err)
    },
  })
}

// ── Actualizar foto de persona existente ─────────────────────────────────
const fotoForm          = useForm({ per_foto: null })
const fotoUpdatePreview = ref(null)

function onFotoUpdateChange(e) {
  const file = e.target.files[0]
  if (!file) return
  fotoForm.per_foto      = file
  fotoUpdatePreview.value = URL.createObjectURL(file)

  const cod = selected.value?.per_cod?.trim()
  addLog('request', 'POST', `/personas/${cod}/foto`, { per_foto: file.name })

  fotoForm.post(`/personas/${encodeURIComponent(cod)}/foto`, {
    forceFormData: true,
    preserveState: true,
    preserveScroll: true,
    onSuccess: () => {
      const actualizado = props.personas?.find(p => p.per_cod?.trim() === cod)
      if (actualizado) {
        selected.value = actualizado
        brokenFotos.value = new Set([...brokenFotos.value].filter(c => c !== cod))
      }
      addLog('response', '200 JSON', 'update foto', { ok: true, nota: 'Foto actualizada vía AJAX' })
      fotoUpdatePreview.value = null
      fotoForm.reset()
    },
    onError: (err) => addLog('error', '422 Error', 'update foto', err),
  })
}
</script>

<template>
  <div class="agenda-root">

    <!-- Barra de progreso dorada (visible durante peticiones Inertia) -->
    <transition name="fade">
      <div v-if="isLoading" class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </transition>

    <!-- ══ Topbar ══════════════════════════════════════════════════════════ -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="topbar-brand">
          <span class="brand-mark"></span>
          <span class="brand-name">AGENDA</span>
          <span class="brand-sep">—</span>
          <span class="brand-sub">Directorio de Personas</span>
        </div>
        <div class="topbar-right">
          <span class="status-dot"></span>
          <span class="status-label">PostgreSQL · db_agenda</span>
          <button class="btn-new" @click="showForm = !showForm">
            {{ showForm ? 'Cancelar' : 'Nueva persona' }}
          </button>
        </div>
      </div>
    </header>

    <!-- ══ Layout principal ════════════════════════════════════════════════ -->
    <div class="shell">

      <!-- ── Panel izquierdo: lista ── -->
      <main class="pane-main">

        <!-- Formulario expandible -->
        <PersonaForm
          v-if="showForm"
          :form="form"
          :processing="form.processing"
          :foto-preview="fotoPreview"
          @guardar="guardar"
          @foto-change="onFotoChange"
        />

        <!-- Comparador AJAX vs Sin AJAX (componente didáctico central) -->
        <SearchCompare
          v-model:buscar-manual="buscarManual"
          v-model:buscar="buscar"
          :full-reloading="fullReloading"
          :total-resultados="personas.length"
          @ejecutar="ejecutarBusquedaManual"
          @limpiar="limpiarBusquedaManual"
        />

        <!-- Tabla de personas -->
        <PersonaTable
          :personas="personas"
          :selected="selected"
          @select="toggleSelect"
        >
          <!-- Slot de foto: useFoto vive en el padre para no duplicar estado -->
          <template #foto="{ persona }">
            <img
              v-if="showFoto(persona)"
              :src="fotoSrc(persona)"
              class="tbl-avatar"
              :alt="persona.per_nom"
              @error="fotoError(persona)"
            />
            <div v-else class="tbl-initials">{{ initials(persona) }}</div>
          </template>
        </PersonaTable>

        <!-- Barra de detalle (visible al seleccionar una fila) -->
        <PersonaDetail
          v-if="selected"
          :persona="selected"
          :foto-update-preview="fotoUpdatePreview"
          :processing="fotoForm.processing"
          @close="selected = null"
          @foto-change="onFotoUpdateChange"
        >
          <template #foto>
            <img
              v-if="showFoto(selected)"
              :src="fotoSrc(selected)"
              class="detail-photo"
              :alt="selected.per_nom"
              @error="fotoError(selected)"
            />
            <div v-else class="detail-initials">{{ initials(selected) }}</div>
          </template>
        </PersonaDetail>

      </main>

      <!-- ── Panel derecho: log de peticiones ── -->
      <RequestLog
        :logs="logs"
        :log-status-class="logStatusClass"
        @clear="logs = []"
      />

    </div>
  </div>
</template>
