<script setup lang="ts">
interface Properties {
  /** Whether the tracked scroll container is scrolled down. */
  visible: boolean
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "scrollToTop") => void>()

const SCROLL_TO_TOP_TEXT = "↑"
const SCROLL_TO_TOP_TITLE = "Scroll to top"

const BUTTON_CLASSES =
  "pointer-events-auto rounded-full border border-[var(--ch-admin-border,#d1d5db)] bg-[var(--ch-admin-surface,#fff)] px-3 py-1.5 text-sm text-[var(--ch-admin-text-muted,#6b7280)] shadow-lg transition-colors hover:bg-[var(--ch-admin-surface-hover,#f3f4f6)] hover:text-[var(--ch-admin-text,#111827)]"
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
      v-if="properties.visible"
      :class="BUTTON_CLASSES"
      :title="SCROLL_TO_TOP_TITLE"
      type="button"
      @click="emit('scrollToTop')"
    >
      {{ SCROLL_TO_TOP_TEXT }}
    </button>
  </Transition>
</template>
