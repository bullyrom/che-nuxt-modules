<script setup lang="ts">
import QueryParametersMenu from "./QueryParametersMenu.vue"

import type {
  FieldComponent,
  FieldDescriptor,
  PartialFieldComponentRegistry,
} from "./fields/types"

interface Properties {
  components?: PartialFieldComponentRegistry
  filters: FieldDescriptor[]
  formats?: Partial<Record<string, FieldComponent>>
  sorts: FieldDescriptor[]
  usesSchemaSearch: boolean
}

const properties = defineProps<Properties>()

const queryValues = defineModel<Record<string, unknown>>("queryValues", {
  required: true,
})
const searchQuery = defineModel<string>("searchQuery", { required: true })
</script>

<template>
  <div class="mb-4 space-y-3">
    <input
      v-if="!properties.usesSchemaSearch"
      v-model="searchQuery"
      class="w-full rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)] px-3 py-1.5 text-sm text-[var(--ch-admin-text)] transition-colors outline-none placeholder:text-[var(--ch-admin-text-muted)] focus:border-[var(--ch-admin-accent)]"
      placeholder="Search..."
      type="text"
    />
    <QueryParametersMenu
      v-model="queryValues"
      :components="properties.components"
      :filters="properties.filters"
      :formats="properties.formats"
      :sorts="properties.sorts"
    />
  </div>
</template>
