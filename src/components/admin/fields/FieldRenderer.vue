<script setup lang="ts">
import { computed, inject, provide } from "vue"

import {
  FIELD_RENDER_CONTEXT,
  isFieldOverride,
  resolveFieldComponent,
} from "./registry"

import type {
  FieldDescriptor,
  FieldOverrideNode,
  PartialFieldComponentRegistry,
} from "./types"

interface Properties {
  components?: PartialFieldComponentRegistry
  field: FieldDescriptor
  modelValue: unknown
  override?: FieldOverrideNode
}

const properties = defineProps<Properties>()
const emit =
  defineEmits<(event: "update:modelValue", value: unknown) => void>()

const parentContext = inject(FIELD_RENDER_CONTEXT, undefined)

const effectiveComponents = computed(
  () => properties.components ?? parentContext?.components,
)

const ownOverride = computed(
  () =>
    properties.override ?? parentContext?.overrides?.[properties.field.key],
)

const leafOverride = computed(() =>
  isFieldOverride(ownOverride.value) ? ownOverride.value : undefined,
)

const childOverrides = computed(() => {
  const override = ownOverride.value
  if (override && !isFieldOverride(override)) return override
  return undefined
})

const resolvedComponent = computed(() =>
  resolveFieldComponent(properties.field, {
    components: effectiveComponents.value,
    override: leafOverride.value,
  }),
)

provide(FIELD_RENDER_CONTEXT, {
  get components() {
    return effectiveComponents.value
  },
  get overrides() {
    return childOverrides.value
  },
})

function updateValue(value: unknown) {
  emit("update:modelValue", value)
}
</script>

<template>
  <div>
    <label
      class="mb-1 block text-xs font-medium tracking-wider text-gray-500 uppercase"
    >
      {{ properties.field.key }}
    </label>

    <component
      :is="resolvedComponent"
      :field="properties.field"
      :model-value="properties.modelValue"
      @update:model-value="updateValue"
    />

    <p v-if="properties.field.description" class="mt-1 text-xs text-gray-400">
      {{ properties.field.description }}
    </p>
  </div>
</template>
