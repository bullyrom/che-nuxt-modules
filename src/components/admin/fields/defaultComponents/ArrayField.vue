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
    class="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm transition-colors outline-none focus:border-blue-400"
    rows="2"
    @input="handleInput"
  />
</template>
