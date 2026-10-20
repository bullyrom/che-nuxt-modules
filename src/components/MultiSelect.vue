<script setup lang="ts">
import { onClickOutside } from "@vueuse/core"
import { computed, ref } from "vue"

import { SELECT_FIELD_CLASS, SELECT_PANEL_CLASS } from "./select"
import SelectList from "./SelectList.vue"

import type { SelectOption } from "./select"
import type { RequestStatus } from "../types"

interface Properties {
  disabled?: boolean
  modelValue?: unknown[]
  options?: SelectOption[]
  placeholder?: string
  searchable?: boolean
  showLoader?: boolean
  status?: RequestStatus
}

const properties = defineProps<Properties>()
const emit = defineEmits<{
  (event: "fetchNextPage"): void
  (event: "update:modelValue", value: unknown[]): void
}>()

const root = ref<HTMLElement>()
const isOpen = ref(false)
// Exposed as `v-model:search-query` so remote selects can drive their own
// options query; without a binding it stays a local search box.
const searchQuery = defineModel<string>("searchQuery", { default: "" })

onClickOutside(root, () => {
  isOpen.value = false
})

const selectedValues = computed(() => properties.modelValue ?? [])

const selectedLabels = computed(() =>
  (properties.options ?? [])
    .filter((option) => selectedValues.value.includes(option.value))
    .map((option) => option.label),
)

const summary = computed(() =>
  selectedLabels.value.length === 0
    ? properties.placeholder
    : selectedLabels.value.join(", "),
)

function toggle() {
  if (properties.disabled === true) return
  isOpen.value = !isOpen.value
}

function toggleOption(option: SelectOption) {
  const isSelected = selectedValues.value.includes(option.value)
  const nextValue = isSelected
    ? selectedValues.value.filter((value) => value !== option.value)
    : [...selectedValues.value, option.value]
  emit("update:modelValue", nextValue)
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      :class="SELECT_FIELD_CLASS"
      :disabled="properties.disabled"
      type="button"
      @click="toggle"
    >
      <span
        class="flex items-center justify-between gap-2"
        :class="
          selectedLabels.length === 0
            ? 'text-[var(--ch-admin-text-muted,#6b7280)]'
            : undefined
        "
      >
        <span class="truncate">{{ summary }}</span>
        <span class="text-xs">▾</span>
      </span>
    </button>

    <div v-if="isOpen" :class="SELECT_PANEL_CLASS">
      <SelectList
        v-model:search-query="searchQuery"
        :options="properties.options"
        :searchable="properties.searchable"
        :selected-values="selectedValues"
        :show-loader="properties.showLoader"
        :status="properties.status"
        @fetch-next-page="emit('fetchNextPage')"
        @select="toggleOption"
      />
    </div>
  </div>
</template>
