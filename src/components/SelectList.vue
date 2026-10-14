<script setup lang="ts">
import { computed } from "vue"

import LazyLoadList from "./LazyLoadList.vue"
import MainLoader from "./MainLoader.vue"
import { SELECT_FIELD_CLASS } from "./select"

import type { SelectOption } from "./select"
import type { RequestStatus } from "../types"

interface Properties {
  options?: SelectOption[]
  searchable?: boolean
  searchQuery?: string
  selectedValues?: unknown[]
  showLoader?: boolean
  status?: RequestStatus
}

const properties = defineProps<Properties>()
const emit = defineEmits<{
  (event: "fetchNextPage"): void
  (event: "select", option: SelectOption): void
  (event: "update:searchQuery", value: string): void
}>()

const FETCH_VISIBLE_ITEM_NUMBER = 4
const OPTION_CLASS =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--ch-admin-surface-hover,#f3f4f6)]"

const selectedSet = computed(() => new Set(properties.selectedValues))

function isSelected(option: SelectOption): boolean {
  return selectedSet.value.has(option.value)
}

function handleSearch(event: Event) {
  emit("update:searchQuery", (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="w-full">
    <input
      v-if="properties.searchable"
      :value="properties.searchQuery"
      :class="SELECT_FIELD_CLASS"
      placeholder="Search..."
      type="text"
      @input="handleSearch"
    />

    <div
      v-if="
        properties.status === 'pending' &&
        (properties.options?.length ?? 0) === 0
      "
      class="flex h-24 items-center justify-center"
    >
      <MainLoader :wh="24" />
    </div>

    <LazyLoadList
      v-else
      v-slot="{ item }"
      :items="properties.options"
      :show-loader="properties.showLoader ?? false"
      :fetch-visible-item-number="FETCH_VISIBLE_ITEM_NUMBER"
      list-class="max-h-60 overflow-y-auto"
      @fetch-next-page="emit('fetchNextPage')"
    >
      <button
        :class="OPTION_CLASS"
        type="button"
        @click="emit('select', item)"
      >
        <span class="w-4 shrink-0">{{ isSelected(item) ? "✓" : "" }}</span>
        <span class="truncate">{{ item.label }}</span>
      </button>
    </LazyLoadList>
  </div>
</template>
