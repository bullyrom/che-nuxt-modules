<script setup lang="ts">
import { computed, inject, provide } from "vue"

import FieldLabel from "../../FieldLabel.vue"
import RollDown from "../../RollDown.vue"

import {
  FIELD_RENDER_CONTEXT,
  isFieldOverride,
  resolveFieldComponent,
} from "./registry"

import type {
  FieldComponent,
  FieldDescriptor,
  FieldOverrideNode,
  PartialFieldComponentRegistry,
} from "./types"

interface Properties {
  components?: PartialFieldComponentRegistry
  field: FieldDescriptor
  formats?: Partial<Record<string, FieldComponent>>
  modelValue: unknown
  nested?: boolean
  override?: FieldOverrideNode
}

const properties = defineProps<Properties>()
const emit =
  defineEmits<(event: "update:modelValue", value: unknown) => void>()

const parentContext = inject(FIELD_RENDER_CONTEXT, undefined)

const effectiveComponents = computed(
  () => properties.components ?? parentContext?.components,
)

const effectiveFormats = computed(
  () => properties.formats ?? parentContext?.formats,
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
    formats: effectiveFormats.value,
    override: leafOverride.value,
  }),
)

const isObject = computed(() => properties.field.kind === "object")

const OBJECT_BUTTON_CLASSES =
  "flex w-full items-center gap-2 rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)] px-3 py-2 text-left text-[var(--ch-admin-text)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"

provide(FIELD_RENDER_CONTEXT, {
  get components() {
    return effectiveComponents.value
  },
  get formats() {
    return effectiveFormats.value
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
  <component
    :is="isObject ? RollDown : 'div'"
    :button-classes="isObject ? OBJECT_BUTTON_CLASSES : undefined"
    :class="!isObject && properties.nested ? 'px-1.5' : undefined"
    :title="isObject ? properties.field.key : undefined"
  >
    <template v-if="isObject" #button-content="{ open }">
      <span class="text-[var(--ch-admin-text-muted)]">{{
        open ? "▾" : "▸"
      }}</span>
      <span
        class="font-mono text-xs font-medium text-[var(--ch-admin-text)]"
        v-text="properties.field.key"
      />
    </template>

    <FieldLabel v-if="!isObject" :label="properties.field.key" />

    <component
      :is="resolvedComponent"
      :field="properties.field"
      :model-value="properties.modelValue"
      @update:model-value="updateValue"
    />

    <p
      v-if="properties.field.description"
      class="mt-1 text-xs text-[var(--ch-admin-text-muted)]"
      :class="isObject ? 'px-1.5' : undefined"
    >
      {{ properties.field.description }}
    </p>
  </component>
</template>
