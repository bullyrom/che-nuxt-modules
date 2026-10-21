<script setup lang="ts">
interface Properties {
  /** Number of realtime changes accumulated since the last reload. */
  count: number
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "reload") => void>()

const LIST_CHANGES_HINT = "New changes — click to reload the list"

const BUTTON_CLASSES =
  "pointer-events-auto rounded-full border border-[var(--ch-admin-accent)] bg-[var(--ch-admin-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ch-admin-accent)] shadow-lg transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <button
      v-if="properties.count > 0"
      :class="BUTTON_CLASSES"
      :title="LIST_CHANGES_HINT"
      type="button"
      @click="emit('reload')"
    >
      {{ properties.count }} new
    </button>
  </Transition>
</template>
