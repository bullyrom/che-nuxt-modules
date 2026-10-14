<script setup lang="ts">
interface Properties {
  canCreate?: boolean
  entityName?: string
  fullBasePath?: string
  listChangesCount?: number
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "back" | "create" | "reload") => void>()

const LIST_CHANGES_HINT = "New changes — click to reload the list"
</script>

<template>
  <div
    class="flex items-center justify-between border-b border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] px-4 py-3"
  >
    <button
      class="rounded border border-[var(--ch-admin-border)] px-3 py-1.5 text-sm text-[var(--ch-admin-text-muted)] transition-colors hover:text-[var(--ch-admin-text)]"
      @click="emit('back')"
    >
      &larr; All endpoints
    </button>
    <div class="flex items-center gap-3">
      <button
        v-if="properties.listChangesCount && properties.listChangesCount > 0"
        class="rounded-full border border-[var(--ch-admin-accent)] px-2.5 py-0.5 text-xs font-medium text-[var(--ch-admin-accent)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
        :title="LIST_CHANGES_HINT"
        @click="emit('reload')"
      >
        {{ properties.listChangesCount }} new
      </button>
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
