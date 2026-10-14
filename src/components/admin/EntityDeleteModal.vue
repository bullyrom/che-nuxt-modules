<script setup lang="ts">
import Modal from "../Modal.vue"

interface Properties {
  entityName?: string
  record?: Record<string, unknown>
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "cancel" | "confirm") => void>()

function recordId(): unknown {
  return properties.record?.id ?? properties.record?.pk
}
</script>

<template>
  <Modal :show="properties.record !== undefined" @set-visible="emit('cancel')">
    <div class="px-6 py-5 text-center">
      <p class="text-sm text-[var(--ch-admin-text-muted)]">
        Delete {{ properties.entityName ?? "record" }} #{{
          recordId() ?? "?"
        }}?
      </p>
      <div class="mt-4 flex justify-center gap-3">
        <button
          class="rounded border border-[var(--ch-admin-border)] px-4 py-1.5 text-sm text-[var(--ch-admin-text-muted)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          class="rounded bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          @click="emit('confirm')"
        >
          Delete
        </button>
      </div>
    </div>
  </Modal>
</template>
