<script setup lang="ts">
import FieldRenderer from "../FieldRenderer.vue"

import type { FieldDescriptor } from "../types"

interface Properties {
  field: FieldDescriptor
  modelValue: Record<string, unknown>
}

const properties = defineProps<Properties>()
const emit =
  defineEmits<
    (event: "update:modelValue", value: Record<string, unknown>) => void
  >()

function updateChild(key: string, value: unknown) {
  emit("update:modelValue", { ...properties.modelValue, [key]: value })
}
</script>

<template>
  <div class="space-y-3 rounded border border-gray-100 bg-gray-50 p-3">
    <FieldRenderer
      v-for="child in properties.field.children"
      :key="child.key"
      :field="child"
      :model-value="properties.modelValue[child.key]"
      @update:model-value="(value) => updateChild(child.key, value)"
    />
  </div>
</template>
