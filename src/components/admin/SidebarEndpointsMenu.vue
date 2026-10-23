<script setup lang="ts">
import SidebarEndpointsList from "./SidebarEndpointsList.vue"

import type {
  AdminPanelConfig,
  AdminPanelMenuLink,
  AdminSidebarGroup,
  AdminSidebarItemComponent,
} from "./fields/types"
import type { ParsedEntity } from "../../stores/adminPanel/types"

interface Properties {
  /** Admin config whose `menu` provides the defaults for links/visibility. */
  config?: AdminPanelConfig
  /** Explicit links; wins over `config.menu.extraLinks`. */
  extraLinks?: AdminPanelMenuLink[]
  /** Pre-filtered groups; omitted reads the shared admin store. */
  filteredEntitiesByNamespace?: AdminSidebarGroup[]
  /** Explicit hidden entities; wins over `config.menu.hiddenEntities`. */
  hiddenEntities?: string[]
  /** Key of the admin instance whose open record must be closed on select. */
  instanceKey?: string
  isMobile?: boolean
  /** Custom row component; wins over `config.menu.itemComponent`. */
  itemComponent?: AdminSidebarItemComponent
  onSelectEntity?: (entity: ParsedEntity) => void
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "select", entity: ParsedEntity) => void>()
</script>

<template>
  <div
    class="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--ch-admin-border)] bg-[var(--ch-admin-surface)]"
    :class="properties.isMobile ? 'w-full' : 'w-64 shrink-0'"
  >
    <div class="border-b border-[var(--ch-admin-border)] px-4 py-3">
      <h2
        class="text-sm font-semibold tracking-wider text-[var(--ch-admin-text-muted)] uppercase"
      >
        Endpoints
      </h2>
    </div>

    <div class="flex-1 overflow-y-auto p-3">
      <SidebarEndpointsList
        :config="properties.config"
        :extra-links="properties.extraLinks"
        :filtered-entities-by-namespace="
          properties.filteredEntitiesByNamespace
        "
        :hidden-entities="properties.hiddenEntities"
        :instance-key="properties.instanceKey"
        :item-component="properties.itemComponent"
        :on-select-entity="properties.onSelectEntity"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>
