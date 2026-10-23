<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed } from "vue"

import { getAdminPanelDetailStore } from "../../stores/adminPanel/detail"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import { visibleMenuGroups } from "./menu"

import type {
  AdminPanelConfig,
  AdminPanelMenuLink,
  AdminSidebarGroup,
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

// Selecting an entity also closes an open record view, so clicking the already
// active entity returns from an open record to the list. A host-supplied
// handler (custom sidebar wiring) wins over the default navigation.
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

    <div class="flex-1 space-y-5 overflow-y-auto p-3">
      <section v-for="group in visibleGroups" :key="group.namespace">
        <h3
          class="mb-2 px-2 text-xs font-semibold tracking-wider text-[var(--ch-admin-text-muted)] uppercase"
        >
          {{ group.namespace || "No namespace" }}
        </h3>

        <ul class="space-y-1">
          <li v-for="entity in group.entities" :key="entity.entityName">
            <button
              class="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors"
              :class="
                adminPanelStore.activeEntity?.entityName ===
                  entity.entityName &&
                adminPanelStore.activeEntity?.namespace === entity.namespace
                  ? 'bg-[var(--ch-admin-accent)] font-medium text-white'
                  : 'text-[var(--ch-admin-text)] hover:bg-[var(--ch-admin-surface-hover)]'
              "
              type="button"
              @click="selectEntity(entity)"
            >
              <span class="truncate">{{ entity.entityName }}</span>
            </button>
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
  </div>
</template>
