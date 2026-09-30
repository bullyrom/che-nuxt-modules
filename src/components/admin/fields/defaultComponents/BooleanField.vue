<script setup lang="ts">
import type { FieldDescriptor } from "../types"

defineProps<{ field: FieldDescriptor }>()

const model = defineModel<boolean>({ required: true })
</script>

<template>
  <input v-model="model" class="h-4 w-4" type="checkbox" />
</template>
