<script setup lang="ts">
import type { AdminSidebarItemProperties } from "./fields/types"

const properties = defineProps<AdminSidebarItemProperties>()

const BUTTON_CLASSES =
  "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors"
const ACTIVE_CLASSES = "bg-[var(--ch-admin-accent)] font-medium text-white"
const INACTIVE_CLASSES =
  "text-[var(--ch-admin-text)] hover:bg-[var(--ch-admin-surface-hover)]"
</script>

<template>
  <button
    :class="[
      BUTTON_CLASSES,
      properties.isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES,
    ]"
    type="button"
    @click="properties.onSelect(properties.item)"
  >
    <span class="truncate">{{ properties.item.entityName }}</span>
  </button>
</template>
