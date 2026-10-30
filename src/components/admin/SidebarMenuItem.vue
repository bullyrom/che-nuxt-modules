<script setup lang="ts">
import { computed } from "vue"

import type { AdminSidebarItemProperties } from "./fields/types"

const properties = defineProps<AdminSidebarItemProperties>()

const ITEM_CLASSES =
  "flex w-full items-center gap-2 rounded-lg py-2 text-left text-sm transition-colors"
const ACTIVE_CLASSES = "bg-[var(--ch-admin-accent)] font-medium text-white"
const INACTIVE_CLASSES =
  "text-[var(--ch-admin-text)] hover:bg-[var(--ch-admin-surface-hover)]"

const hasChildren = computed(() => properties.item.children.length > 0)
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
    :type="properties.item.href === undefined ? 'button' : undefined"
    @click="properties.onSelect(properties.item)"
  >
    <span
      v-if="hasChildren"
      class="w-3 shrink-0 text-center text-xs"
      aria-hidden="true"
    >
      {{ properties.isExpanded ? "▾" : "▸" }}
    </span>
    <span class="truncate">{{ properties.item.label }}</span>
  </component>
</template>
