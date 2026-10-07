<script setup lang="ts">
import type { FieldDescriptor } from "../types"

defineProps<{ field: FieldDescriptor }>()

const model = defineModel<number | undefined>({ required: true })
</script>

<template>
  <input
    v-model.number="model"
    class="w-full rounded border border-gray-300 px-3 py-2 text-sm transition-colors outline-none focus:border-blue-400"
    type="number"
  />
</template>
