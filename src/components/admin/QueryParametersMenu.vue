<script setup lang="ts">
import { computed } from "vue"

import FieldRenderer from "./fields/FieldRenderer.vue"

import type {
  FieldDescriptor,
  PartialFieldComponentRegistry,
} from "./fields/types"

interface Properties {
  components?: PartialFieldComponentRegistry
  filters: FieldDescriptor[]
  modelValue: Record<string, unknown>
  sorts: FieldDescriptor[]
}

const properties = defineProps<Properties>()
const emit =
  defineEmits<
    (event: "update:modelValue", value: Record<string, unknown>) => void
  >()

const hasParameters = computed(
  () => properties.filters.length > 0 || properties.sorts.length > 0,
)

const hasValues = computed(() => Object.keys(properties.modelValue).length > 0)

function updateValue(key: string, value: unknown) {
  emit("update:modelValue", { ...properties.modelValue, [key]: value })
}

function resetValues() {
  emit("update:modelValue", {})
}
</script>

<template>
  <div v-if="hasParameters" class="space-y-3">
    <div v-if="properties.filters.length > 0">
      <div class="mb-2 flex items-center justify-between">
        <h3
          class="text-xs font-semibold tracking-wider text-[var(--ch-admin-text-muted)] uppercase"
        >
          Filters
        </h3>
        <button
          v-if="hasValues"
          class="rounded-[var(--ch-admin-radius-sm)] px-2 py-0.5 text-xs text-[var(--ch-admin-text-muted)] transition-colors hover:bg-[var(--ch-admin-surface-hover)] hover:text-[var(--ch-admin-text)]"
          type="button"
          @click="resetValues()"
        >
          Reset
        </button>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FieldRenderer
          v-for="field in properties.filters"
          :key="field.key"
          :components="properties.components"
          :field="field"
          :model-value="properties.modelValue[field.key]"
          @update:model-value="(value) => updateValue(field.key, value)"
        />
      </div>
    </div>

    <div v-if="properties.sorts.length > 0">
      <h3
        class="mb-2 text-xs font-semibold tracking-wider text-[var(--ch-admin-text-muted)] uppercase"
      >
        Sorting
      </h3>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FieldRenderer
          v-for="field in properties.sorts"
          :key="field.key"
          :components="properties.components"
          :field="field"
          :model-value="properties.modelValue[field.key]"
          @update:model-value="(value) => updateValue(field.key, value)"
        />
      </div>
    </div>
  </div>
</template>
