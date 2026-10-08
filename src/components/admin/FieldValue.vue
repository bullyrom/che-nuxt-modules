<script setup lang="ts">
import { computed } from "vue"

import { formatRawValue } from "./rawValue"
import RawValue from "./RawValue.vue"

interface Properties {
  value: unknown
}

const properties = defineProps<Properties>()

defineOptions({ name: "FieldValue" })

const displayString = computed(() => formatRawValue(properties.value))
</script>

<template>
  <template v-if="value === null || value === undefined">
    <span class="text-[var(--ch-admin-text-muted)]">—</span>
  </template>
  <template v-else-if="typeof value === 'boolean'">
    <span
      class="inline-flex rounded px-1.5 py-0.5 text-xs font-medium"
      :class="
        value
          ? 'bg-[var(--ch-admin-success-bg)] text-[var(--ch-admin-success-text)]'
          : 'bg-[var(--ch-admin-danger-bg)] text-[var(--ch-admin-danger-text)]'
      "
    >
      {{ value ? "Yes" : "No" }}
    </span>
  </template>
  <template v-else-if="typeof value === 'number'">
    <span class="font-mono text-sm text-[var(--ch-admin-text-muted)]">
      {{ value.toLocaleString() }}
    </span>
  </template>
  <template v-else-if="typeof value === 'string'">
    <span class="text-sm text-[var(--ch-admin-text)]">{{
      displayString
    }}</span>
  </template>
  <RawValue v-else :value="value" />
</template>
