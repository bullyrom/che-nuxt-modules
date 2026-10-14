<script setup lang="ts">
import type { FieldGroupOverride } from "./fields/types"

interface Properties {
  onChange: (changed: Record<string, unknown>) => void
  override: FieldGroupOverride
  value: Record<string, unknown>
}

const properties = defineProps<Properties>()

function handleChange(changed: Record<string, unknown>) {
  properties.onChange(changed)
}
</script>

<template>
  <component
    :is="properties.override.component"
    :value="properties.value"
    :on-change="handleChange"
  />
</template>
