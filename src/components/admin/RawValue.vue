<script setup lang="ts">
import { computed } from "vue"

import { formatRawValue } from "./rawValue"

interface Properties {
  value: unknown
}

const properties = defineProps<Properties>()

const formattedValue = computed(() => formatRawValue(properties.value))
</script>

<template>
  <pre
    class="max-h-80 overflow-auto rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)] p-2 font-mono text-xs break-all whitespace-pre-wrap text-[var(--ch-admin-text)]"
    v-text="formattedValue"
  />
</template>
