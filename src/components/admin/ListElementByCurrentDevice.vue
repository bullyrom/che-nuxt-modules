<script setup lang="ts">
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import EntityRecordList from "./EntityRecordList.vue"

import type { AdminPanelConfig } from "./fields/types"

interface Properties {
  baseUrl: string
  config?: AdminPanelConfig
  isMobile?: boolean
}

const properties = defineProps<Properties>()
const adminPanelStore = useAdminPanelStore()
</script>

<template>
  <EntityRecordList
    v-if="adminPanelStore.activeEntity"
    :key="adminPanelStore.activeEntity.fullBasePath"
    :base-url="properties.baseUrl"
    :config="properties.config"
    :is-mobile="properties.isMobile"
  />
  <div
    v-else
    class="flex h-full flex-1 items-center justify-center text-sm text-[var(--ch-admin-text-muted)]"
  >
    Select an endpoint from the sidebar
  </div>
</template>
