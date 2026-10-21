<script setup lang="ts">
import { ADMIN_AREA_HEADER_CLASSES, ADMIN_BACK_BUTTON_CLASSES } from "./layout"

interface Properties {
  canCreate?: boolean
  entityName?: string
  fullBasePath?: string
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "back" | "create") => void>()
</script>

<template>
  <div :class="ADMIN_AREA_HEADER_CLASSES">
    <button :class="ADMIN_BACK_BUTTON_CLASSES" @click="emit('back')">
      &larr; All endpoints
    </button>
    <div class="flex items-center gap-3">
      <button
        v-if="properties.canCreate"
        class="rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)] px-3 py-1.5 text-sm font-medium text-[var(--ch-admin-text)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
        @click="emit('create')"
      >
        + New
      </button>
      <div class="text-right">
        <h2 class="text-sm font-semibold text-[var(--ch-admin-text)]">
          {{ properties.entityName }}
        </h2>
        <p class="text-xs text-[var(--ch-admin-text-muted)]">
          {{ properties.fullBasePath }}
        </p>
      </div>
    </div>
  </div>
</template>
