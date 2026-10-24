<script setup lang="ts">
import { getAdminPanelDetailStore } from "../../stores/adminPanel/detail"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import SidebarMenuNode from "./SidebarMenuNode.vue"
import { useSidebarMenu } from "./useSidebarMenu"

import type {
  AdminPanelConfig,
  AdminPanelMenuLink,
  AdminSidebarGroup,
  AdminSidebarItemComponent,
  AdminSidebarMenuItem,
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
  /** Custom row component; wins over `config.menu.itemComponent`. */
  itemComponent?: AdminSidebarItemComponent
  onSelectEntity?: (entity: ParsedEntity) => void
  /** Group entities by API namespace; defaults to `false` here (site menu). */
  showGroups?: boolean
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "select", entity: ParsedEntity) => void>()

const adminPanelStore = useAdminPanelStore()
const { expandedIds, itemComponent, sections, toggleItem } = useSidebarMenu({
  config: properties.config,
  extraLinks: properties.extraLinks,
  filteredEntitiesByNamespace: properties.filteredEntitiesByNamespace,
  hiddenEntities: properties.hiddenEntities,
  itemComponent: properties.itemComponent,
  showGroups: properties.showGroups,
})

// Selecting an entity also closes an open record view, so clicking the already
// active entity returns from an open record to the list. A host-supplied
// handler (custom navigation) wins over the default selection.
function selectEntity(entity: ParsedEntity) {
  if (properties.onSelectEntity) {
    properties.onSelectEntity(entity)
    return
  }
  getAdminPanelDetailStore(properties.instanceKey)?.closeView()
  adminPanelStore.activeEntity = entity
  emit("select", entity)
}

function handleSelect(item: AdminSidebarMenuItem) {
  if (item.children.length > 0) toggleItem(item)
  if (item.entity !== undefined) selectEntity(item.entity)
}
</script>

<template>
  <div class="space-y-3">
    <section v-for="section in sections" :key="section.id">
      <h3
        v-if="section.title"
        class="px-3 py-2 text-xs font-semibold tracking-wider text-[var(--ch-admin-text-muted)] uppercase"
      >
        {{ section.title }}
      </h3>

      <ul class="space-y-1">
        <SidebarMenuNode
          v-for="item in section.items"
          :key="item.id"
          :expanded-ids="expandedIds"
          :item="item"
          :item-component="itemComponent"
          :on-select="handleSelect"
        />
      </ul>
    </section>
  </div>
</template>
