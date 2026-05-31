<!--
  SearchCompare.vue — Comparador visual AJAX vs Sin AJAX
  ═══════════════════════════════════════════════════════

  PROPÓSITO DIDÁCTICO
  Este componente es el corazón de la demostración. Muestra lado a lado
  dos formas de buscar, con comportamientos completamente distintos:

  ┌────────────────────────────┬─────────────────────────────────────────┐
  │       SIN AJAX             │          CON AJAX (Inertia)             │
  ├────────────────────────────┼─────────────────────────────────────────┤
  │ • Requiere clic en Buscar  │ • Automático al escribir (500 ms)       │
  │ • Usa window.location.href │ • Usa router.get() con header especial  │
  │ • Recarga TODA la página   │ • Solo cambia los datos (props)         │
  │ • El log desaparece        │ • El log persiste en tiempo real        │
  │ • Estado Vue: reiniciado   │ • Estado Vue: intacto                   │
  └────────────────────────────┴─────────────────────────────────────────┘

  Props y eventos siguen el patrón v-model para integrarse limpiamente
  con el composable useSearch en el padre (Agenda.vue).
-->
<script setup>
defineProps({
  buscarManual:    { type: String,  required: true },
  buscar:          { type: String,  required: true },
  fullReloading:   { type: Boolean, default: false },
  totalResultados: { type: Number,  default: 0 },
})

defineEmits([
  'update:buscarManual',   // v-model del input Sin AJAX
  'update:buscar',         // v-model del input Con AJAX
  'ejecutar',              // clic en "Buscar"
  'limpiar',               // clic en "×"
])
</script>

<template>
  <div class="search-compare">

    <!-- ══ Panel SIN AJAX ══════════════════════════════════════════════════
         El usuario DEBE hacer clic para que ocurra algo.
         La búsqueda recarga la página completa como lo haría un formulario
         HTML tradicional sin JavaScript.
    -->
    <div class="search-panel sp-manual">
      <div class="sp-badge sp-badge-manual">Sin AJAX</div>
      <div class="sp-row">
        <svg class="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
        </svg>
        <input
          :value="buscarManual"
          class="search-input sp-input-manual"
          placeholder="Escribe y presiona Buscar…"
          autocomplete="off"
          @input="$emit('update:buscarManual', $event.target.value)"
          @keydown.enter="$emit('ejecutar')"
        />
        <button
          v-if="buscarManual"
          class="sp-btn-clear"
          title="Limpiar y ver todos"
          @click="$emit('limpiar')"
        >×</button>
        <button
          class="sp-btn-buscar"
          :disabled="fullReloading"
          @click="$emit('ejecutar')"
        >
          {{ fullReloading ? '…' : 'Buscar' }}
        </button>
      </div>
      <p class="sp-hint">Requiere clic · recarga completa · sin AJAX</p>
    </div>

    <!-- ══ Panel CON AJAX ══════════════════════════════════════════════════
         La búsqueda ocurre automáticamente mientras el usuario escribe.
         Inertia envía una petición XHR con el header X-Inertia: true,
         el servidor responde solo con JSON, y Vue actualiza la tabla.
    -->
    <div class="search-panel sp-ajax">
      <div class="sp-badge sp-badge-ajax">Con AJAX</div>
      <div class="sp-row">
        <svg class="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
        </svg>
        <input
          :value="buscar"
          class="search-input sp-input-ajax"
          placeholder="Escribe para buscar en tiempo real…"
          autocomplete="off"
          @input="$emit('update:buscar', $event.target.value)"
        />
        <span class="sp-live-dot" title="Búsqueda automática activa"></span>
      </div>
      <p class="sp-hint">Automático · 500 ms debounce · solo props actualizan</p>
    </div>

    <span class="search-count-total">
      {{ totalResultados }} resultado{{ totalResultados !== 1 ? 's' : '' }}
    </span>
  </div>
</template>
