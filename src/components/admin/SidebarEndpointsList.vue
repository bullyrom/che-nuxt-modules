<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed } from "vue"

import { getAdminPanelDetailStore } from "../../stores/adminPanel/detail"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import { visibleMenuGroups } from "./menu"
import SidebarEndpointItem from "./SidebarEndpointItem.vue"

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
  /** Custom row component; wins over `config.menu.itemComponent`. */
  itemComponent?: AdminSidebarItemComponent
  onSelectEntity?: (entity: ParsedEntity) => void
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "select", entity: ParsedEntity) => void>()

const adminPanelStore = useAdminPanelStore()
const { config: storeConfig, filteredEntitiesByNamespace: storeGroups } =
  storeToRefs(adminPanelStore)

const menuConfig = computed(() => properties.config?.menu)

const groups = computed(
  () => properties.filteredEntitiesByNamespace ?? storeGroups.value,
)

const visibleGroups = computed(() =>
  visibleMenuGroups(
    groups.value,
    properties.hiddenEntities ??
      menuConfig.value?.hiddenEntities ??
      storeConfig.value?.menu?.hiddenEntities,
  ),
)

const extraLinks = computed(
  () =>
    properties.extraLinks ??
    menuConfig.value?.extraLinks ??
    storeConfig.value?.menu?.extraLinks ??
    [],
)

const itemComponent = computed<AdminSidebarItemComponent>(
  () =>
    properties.itemComponent ??
    menuConfig.value?.itemComponent ??
    storeConfig.value?.menu?.itemComponent ??
    SidebarEndpointItem,
)

function isActive(entity: ParsedEntity) {
  return (
    adminPanelStore.activeEntity?.entityName === entity.entityName &&
    adminPanelStore.activeEntity?.namespace === entity.namespace
  )
}

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
</script>

<template>
  <div class="space-y-5">
    <section v-for="group in visibleGroups" :key="group.namespace">
      <h3
        class="mb-2 px-2 text-xs font-semibold tracking-wider text-[var(--ch-admin-text-muted)] uppercase"
      >
        {{ group.namespace || "No namespace" }}
      </h3>

      <ul class="space-y-1">
        <li v-for="item in group.entities" :key="item.entityName">
          <component
            :is="itemComponent"
            :is-active="isActive(item)"
            :item="item"
            :on-select="selectEntity"
          />
        </li>
      </ul>
    </section>

    <section v-if="extraLinks.length > 0">
      <h3
        class="mb-2 px-2 text-xs font-semibold tracking-wider text-[var(--ch-admin-text-muted)] uppercase"
      >
        Links
      </h3>
      <ul class="space-y-1">
        <li v-for="link in extraLinks" :key="link.href">
          <a
            class="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-[var(--ch-admin-text)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
            :href="link.href"
          >
            <span class="truncate">{{ link.label }}</span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>
