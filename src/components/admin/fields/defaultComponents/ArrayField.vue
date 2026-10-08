<script setup lang="ts">
import type { FieldDescriptor } from "../types"

defineProps<{ field: FieldDescriptor }>()

const model = defineModel<unknown[]>({ required: true })

function handleInput(event: Event) {
  const { value } = event.target as HTMLTextAreaElement
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) model.value = parsed
  } catch {
    // Ignore invalid JSON while the user is still typing.
  }
}
</script>

<template>
  <textarea
    :value="JSON.stringify(model ?? [])"
    class="w-full rounded-[var(--ch-admin-radius-sm)] border border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] px-3 py-2 font-mono text-sm text-[var(--ch-admin-text)] transition-colors outline-none placeholder:text-[var(--ch-admin-text-muted)] focus:border-[var(--ch-admin-accent)]"
    rows="2"
    @input="handleInput"
  />
</template>
