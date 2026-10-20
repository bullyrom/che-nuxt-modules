<script setup lang="ts" generic="OptionType extends Record<string, unknown>">
import { useRemoteSelectOptions } from "../composables/useRemoteSelectOptions"

import Select from "./Select.vue"

import type { SelectOption } from "./select"

const properties = defineProps<{
  disabled?: boolean
  extraOptions?: SelectOption[]
  instanceKey?: string
  labelKey: keyof OptionType
  modelValue?: unknown
  placeholder?: string
  query?: Record<string, unknown>
  searchable?: boolean
  searchParameter?: string
  url: string
  valueKey: keyof OptionType
}>()
const emit =
  defineEmits<(event: "update:modelValue", value: unknown) => void>()

const { options, store } = useRemoteSelectOptions<OptionType>({
  extraOptions: properties.extraOptions,
  instanceKey: properties.instanceKey,
  labelKey: properties.labelKey,
  query: properties.query,
  searchParameter: properties.searchParameter,
  url: properties.url,
  valueKey: properties.valueKey,
})
</script>

<template>
  <Select
    :disabled="properties.disabled"
    :model-value="properties.modelValue"
    :options="options"
    :placeholder="properties.placeholder"
    :searchable="properties.searchable"
    :search-query="store.searchQuery"
    :show-loader="store.showLoader"
    :status="store.status"
    @fetch-next-page="store.loadNextPage()"
    @update:search-query="store.searchQuery = $event"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
