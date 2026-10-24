<script setup lang="ts">
import { computed } from "vue"

import type { AdminSidebarItemProperties } from "./fields/types"

const properties = defineProps<AdminSidebarItemProperties>()

const BASE_PADDING_PX = 12
const INDENT_PX = 16

const ITEM_CLASSES =
  "flex w-full items-center gap-2 rounded-lg py-2 text-left text-sm transition-colors"
const ACTIVE_CLASSES = "bg-[var(--ch-admin-accent)] font-medium text-white"
const INACTIVE_CLASSES =
  "text-[var(--ch-admin-text)] hover:bg-[var(--ch-admin-surface-hover)]"

const hasChildren = computed(() => properties.item.children.length > 0)

const paddingLeft = computed(
  () => `${BASE_PADDING_PX + properties.item.level * INDENT_PX}px`,
)
</script>

<template>
  <component
    :is="properties.item.href === undefined ? 'button' : 'a'"
    :aria-expanded="hasChildren ? properties.isExpanded : undefined"
    :class="[
      ITEM_CLASSES,
      properties.isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES,
    ]"
    :href="properties.item.href"
    :style="{ paddingLeft }"
    :type="properties.item.href === undefined ? 'button' : undefined"
    @click="properties.onSelect(properties.item)"
  >
    <span class="w-3 shrink-0 text-center text-xs" aria-hidden="true">
      {{ hasChildren ? (properties.isExpanded ? "▾" : "▸") : "" }}
    </span>
    <span class="truncate">{{ properties.item.label }}</span>
  </component>
</template>
