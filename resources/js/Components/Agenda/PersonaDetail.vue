<!-- PersonaDetail.vue — Barra de detalle de persona seleccionada -->
<script setup>
defineProps({
  persona:           { type: Object, required: true },
  fotoUpdatePreview: { type: String, default: null },
  processing:        { type: Boolean, default: false },
})

defineEmits(['close', 'foto-change'])
</script>

<template>
  <transition name="slide-up">
    <div class="detail-bar">
      <div class="detail-inner">

        <!-- Foto / iniciales — clic para actualizar -->
        <div
          class="detail-foto-wrap"
          title="Clic para cambiar foto"
          @click="$refs.fotoInput.click()"
        >
          <img
            v-if="fotoUpdatePreview"
            :src="fotoUpdatePreview"
            class="detail-photo"
            alt="Vista previa"
          />
          <!-- El padre pasa la imagen resuelta via slot para no acoplar useFoto aquí -->
          <slot name="foto" />
          <div class="detail-foto-overlay">
            <span v-if="processing" class="spin spin-sm"></span>
            <span v-else class="detail-foto-icon">+</span>
          </div>
        </div>

        <input
          ref="fotoInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="$emit('foto-change', $event)"
        />

        <!-- Datos de la persona -->
        <div class="detail-info">
          <p class="detail-name">
            {{ persona.per_nom?.trim() }} {{ persona.per_appm?.trim() }}
          </p>
          <p class="detail-meta">
            <span v-if="persona.per_prof?.trim()">{{ persona.per_prof.trim() }} &nbsp;·&nbsp; </span>
            <span>{{ persona.per_cel?.trim() }}</span>
            <span v-if="persona.per_email?.trim()"> &nbsp;·&nbsp; {{ persona.per_email.trim() }}</span>
            <span v-if="persona.per_dir?.trim()"> &nbsp;·&nbsp; {{ persona.per_dir.trim() }}</span>
          </p>
          <p class="detail-hint">Clic en la foto para actualizarla</p>
        </div>

        <button class="detail-close" @click="$emit('close')">×</button>
      </div>
    </div>
  </transition>
</template>
