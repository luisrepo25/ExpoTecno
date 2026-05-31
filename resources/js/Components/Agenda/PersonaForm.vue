<!-- PersonaForm.vue — Formulario expandible para crear una nueva persona -->
<script setup>
import { ref } from 'vue'

defineProps({
  form:        { type: Object,  required: true },
  processing:  { type: Boolean, default: false },
  fotoPreview: { type: String,  default: null },
})

defineEmits(['guardar', 'foto-change'])
</script>

<template>
  <transition name="expand">
    <section class="form-panel">
      <h2 class="form-title">Nuevo registro</h2>

      <form class="form-grid" enctype="multipart/form-data" @submit.prevent="$emit('guardar')">

        <!-- Foto -->
        <div class="foto-col">
          <div class="foto-frame" @click="$refs.fotoInput.click()">
            <img v-if="fotoPreview" :src="fotoPreview" class="foto-img" alt="Vista previa" />
            <div v-else class="foto-placeholder">
              <span class="foto-icon">+</span>
              <span class="foto-hint">Subir foto</span>
            </div>
          </div>
          <input
            ref="fotoInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="$emit('foto-change', $event)"
          />
          <p v-if="form.errors?.per_foto" class="field-err">{{ form.errors.per_foto }}</p>
        </div>

        <!-- Campos -->
        <div class="fields-col">
          <div class="field-row">
            <div class="field">
              <label class="fl">CI / Código *</label>
              <input v-model="form.per_cod" class="fi" :class="{'fi-err': form.errors?.per_cod}" placeholder="Ej: 12345678" />
              <p v-if="form.errors?.per_cod" class="field-err">{{ form.errors.per_cod }}</p>
            </div>
            <div class="field">
              <label class="fl">Nombre(s) *</label>
              <input v-model="form.per_nom" class="fi" :class="{'fi-err': form.errors?.per_nom}" placeholder="Ej: Juan Carlos" />
              <p v-if="form.errors?.per_nom" class="field-err">{{ form.errors.per_nom }}</p>
            </div>
            <div class="field">
              <label class="fl">Apellido *</label>
              <input v-model="form.per_appm" class="fi" :class="{'fi-err': form.errors?.per_appm}" placeholder="Ej: Mamani Quispe" />
              <p v-if="form.errors?.per_appm" class="field-err">{{ form.errors.per_appm }}</p>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label class="fl">Profesión</label>
              <input v-model="form.per_prof" class="fi" placeholder="Ej: Ingeniero de Sistemas" />
            </div>
            <div class="field">
              <label class="fl">Celular *</label>
              <input v-model="form.per_cel" class="fi" :class="{'fi-err': form.errors?.per_cel}" placeholder="Ej: 76543210" />
              <p v-if="form.errors?.per_cel" class="field-err">{{ form.errors.per_cel }}</p>
            </div>
            <div class="field">
              <label class="fl">Teléfono</label>
              <input v-model="form.per_telf" class="fi" placeholder="Ej: 3456789" />
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label class="fl">Email</label>
              <input v-model="form.per_email" type="email" class="fi" placeholder="correo@ejemplo.com" />
            </div>
            <div class="field">
              <label class="fl">Fecha de nacimiento</label>
              <input v-model="form.per_fnac" type="date" class="fi" />
            </div>
            <div class="field">
              <label class="fl">Lugar de nacimiento</label>
              <input v-model="form.per_lnac" class="fi" placeholder="Ej: Santa Cruz de la Sierra" />
            </div>
          </div>

          <div class="field-row">
            <div class="field field-full">
              <label class="fl">Dirección</label>
              <input v-model="form.per_dir" class="fi" placeholder="Av. Beni #123, Barrio Las Palmas" />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-save" :disabled="processing">
              <span v-if="processing" class="spin"></span>
              <span v-else>Guardar registro</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  </transition>
</template>
