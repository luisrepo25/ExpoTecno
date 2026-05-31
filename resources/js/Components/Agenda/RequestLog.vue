<!--
  RequestLog.vue — Panel de request log en tiempo real
  Muestra el ciclo completo AJAX: REQUEST ↑ enviado / RESPONSE ↓ recibido.
  Esto "desnuda" lo que Inertia hace internamente para que sea visible al docente.
-->
<script setup>
defineProps({
  logs:           { type: Array,    required: true },
  logStatusClass: { type: Function, required: true },
})

defineEmits(['clear'])

/** Icono y dirección según el tipo de entrada del log */
function typeLabel(type) {
  if (type === 'request')  return { icon: '↑', label: 'REQUEST',  cls: 'lt-req' }
  if (type === 'response') return { icon: '↓', label: 'RESPONSE', cls: 'lt-res' }
  if (type === 'error')    return { icon: '✕', label: 'ERROR',    cls: 'lt-err' }
  return { icon: '·', label: '', cls: '' }
}
</script>

<template>
  <aside class="pane-log">
    <div class="log-header">
      <span class="log-title">Request Log</span>
      <button class="log-clear" @click="$emit('clear')">clear</button>
    </div>

    <div class="log-body">
      <div v-if="logs.length === 0" class="log-empty">
        Esperando peticiones…<br>
        <span style="font-size:10px;opacity:.6">
          ↑ REQUEST = lo que sale del cliente<br>
          ↓ RESPONSE = lo que llega del servidor
        </span>
      </div>

      <transition-group name="log-in" tag="div" class="log-entries">
        <div
          v-for="log in logs"
          :key="log.id"
          class="log-entry"
          :class="`le-${log.type}`"
        >
          <div class="log-meta">
            <!-- Dirección: REQUEST ↑ o RESPONSE ↓ -->
            <span v-if="log.type" class="log-type" :class="typeLabel(log.type).cls">
              {{ typeLabel(log.type).icon }}
            </span>
            <span class="log-status" :class="logStatusClass(log.status)">
              {{ log.status }}
            </span>
            <span class="log-url">{{ log.url }}</span>
            <span class="log-ts">{{ log.ts }}</span>
          </div>
          <pre class="log-pre">{{ JSON.stringify(log.data, null, 2) }}</pre>
        </div>
      </transition-group>
    </div>

    <!-- Stack técnico de la demo -->
    <div class="stack-info">
      <p class="stack-title">Stack</p>
      <p class="stack-item">Laravel 12 · Query Builder (PDO)</p>
      <p class="stack-item">Inertia.js v2 · X-Inertia header</p>
      <p class="stack-item">Vue 3 · Composition API</p>
      <p class="stack-item">PostgreSQL · ILIKE</p>
    </div>
  </aside>
</template>
