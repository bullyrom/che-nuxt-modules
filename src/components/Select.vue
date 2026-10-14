<script setup lang="ts">
import { onClickOutside } from "@vueuse/core"
import { computed, ref } from "vue"

import { SELECT_FIELD_CLASS, SELECT_PANEL_CLASS } from "./select"
import SelectList from "./SelectList.vue"

import type { SelectOption } from "./select"
import type { RequestStatus } from "../types"

interface Properties {
  disabled?: boolean
  modelValue?: unknown
  options?: SelectOption[]
  placeholder?: string
  searchable?: boolean
  showLoader?: boolean
  status?: RequestStatus
}

const properties = defineProps<Properties>()
const emit = defineEmits<{
  (event: "fetchNextPage"): void
  (event: "update:modelValue", value: unknown): void
}>()

const root = ref<HTMLElement>()
const isOpen = ref(false)
const searchQuery = ref("")

onClickOutside(root, () => {
  isOpen.value = false
})

const selectedLabel = computed(
  () =>
    properties.options?.find(
      (option) => option.value === properties.modelValue,
    )?.label,
)

function toggle() {
  if (properties.disabled === true) return
  isOpen.value = !isOpen.value
}

function selectOption(option: SelectOption) {
  emit("update:modelValue", option.value)
  isOpen.value = false
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
          selectedLabel === undefined
            ? 'text-[var(--ch-admin-text-muted,#6b7280)]'
            : undefined
        "
      >
        <span class="truncate">{{
          selectedLabel ?? properties.placeholder
        }}</span>
        <span class="text-xs">▾</span>
      </span>
    </button>

    <div v-if="isOpen" :class="SELECT_PANEL_CLASS">
      <SelectList
        v-model:search-query="searchQuery"
        :options="properties.options"
        :searchable="properties.searchable"
        :selected-values="
          properties.modelValue === undefined ? [] : [properties.modelValue]
        "
        :show-loader="properties.showLoader"
        :status="properties.status"
        @fetch-next-page="emit('fetchNextPage')"
        @select="selectOption"
      />
    </div>
  </div>
</template>
