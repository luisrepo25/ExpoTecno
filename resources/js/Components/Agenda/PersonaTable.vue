<!-- PersonaTable.vue — Tabla de personas con foto o iniciales -->
<script setup>
defineProps({
  personas: { type: Array,  required: true },
  selected: { type: Object, default: null },
})

defineEmits(['select'])
</script>

<template>
  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th class="th-photo"></th>
          <th>Nombre completo</th>
          <th>CI</th>
          <th>Celular</th>
          <th>Profesión</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="personas.length === 0">
          <td colspan="6" class="tbl-empty">Sin resultados para la búsqueda actual.</td>
        </tr>
        <tr
          v-for="p in personas"
          :key="p.per_cod"
          class="tbl-row"
          :class="{ 'tbl-row-sel': selected?.per_cod === p.per_cod }"
          @click="$emit('select', p)"
        >
          <!-- La foto se delega al padre via slot para no acoplar useFoto aquí -->
          <td class="td-photo">
            <slot name="foto" :persona="p" />
          </td>
          <td class="td-name">
            {{ p.per_nom?.trim() }}
            <span class="td-appm">{{ p.per_appm?.trim() }}</span>
          </td>
          <td class="td-mono">{{ p.per_cod?.trim() }}</td>
          <td class="td-mono">{{ p.per_cel?.trim() }}</td>
          <td class="td-prof">{{ p.per_prof?.trim() || '—' }}</td>
          <td>
            <span class="est-chip" :class="p.per_est ? 'est-on' : 'est-off'">
              {{ p.per_est ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
