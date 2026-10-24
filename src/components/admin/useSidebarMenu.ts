import { storeToRefs } from "pinia"
import { computed, ref, watch } from "vue"

import { useAdminPanelStore } from "../../stores/adminPanel/index"

import { visibleMenuGroups } from "./menu"
import { buildMenuSections } from "./menuSections"
import SidebarMenuItem from "./SidebarMenuItem.vue"

import type {
  AdminPanelConfig,
  AdminPanelMenuLink,
  AdminSidebarGroup,
  AdminSidebarItemComponent,
  AdminSidebarMenuItem,
} from "./fields/types"
import type { MenuSection } from "./menuSections"
import type { ParsedEntity } from "../../stores/adminPanel/types"

interface UseSidebarMenuParameters {
  config?: AdminPanelConfig
  extraLinks?: AdminPanelMenuLink[]
  filteredEntitiesByNamespace?: AdminSidebarGroup[]
  hiddenEntities?: string[]
  itemComponent?: AdminSidebarItemComponent
  showGroups?: boolean
}

/** Builds the unified, optionally grouped and nested menu model. */
function useSidebarMenu(parameters: UseSidebarMenuParameters) {
  const adminPanelStore = useAdminPanelStore()
  const { config: storeConfig, filteredEntitiesByNamespace: storeGroups } =
    storeToRefs(adminPanelStore)

  const menuConfig = computed(() => parameters.config?.menu)

  const groups = computed(
    () => parameters.filteredEntitiesByNamespace ?? storeGroups.value,
  )

  const visibleGroups = computed(() =>
    visibleMenuGroups(
      groups.value,
      parameters.hiddenEntities ??
        menuConfig.value?.hiddenEntities ??
        storeConfig.value?.menu?.hiddenEntities,
    ),
  )

  const links = computed(
    () =>
      parameters.extraLinks ??
      menuConfig.value?.extraLinks ??
      storeConfig.value?.menu?.extraLinks ??
      [],
  )

  const showGroups = computed(
    () => parameters.showGroups ?? menuConfig.value?.showGroups ?? false,
  )

  const itemComponent = computed<AdminSidebarItemComponent>(
    () =>
      parameters.itemComponent ??
      menuConfig.value?.itemComponent ??
      storeConfig.value?.menu?.itemComponent ??
      SidebarMenuItem,
  )

  function isActive(entity: ParsedEntity) {
    return (
      adminPanelStore.activeEntity?.entityName === entity.entityName &&
      adminPanelStore.activeEntity?.namespace === entity.namespace
    )
  }

  const sections = computed<MenuSection[]>(() =>
    buildMenuSections({
      groups: visibleGroups.value,
      isActive,
      links: links.value,
      showGroups: showGroups.value,
    }),
  )

  const expandedIds = ref<Set<string>>(new Set())

  function expandActiveAncestors(
    items: AdminSidebarMenuItem[],
    ancestors: string[],
  ) {
    for (const item of items) {
      if (item.isActive) {
        for (const id of ancestors) expandedIds.value.add(id)
      }
      expandActiveAncestors(item.children, [...ancestors, item.id])
    }
  }

  watch(
    sections,
    () => {
      expandActiveAncestors(
        sections.value.flatMap((section) => section.items),
        [],
      )
      expandedIds.value = new Set(expandedIds.value)
    },
    { immediate: true },
  )

  function toggleItem(item: AdminSidebarMenuItem) {
    if (item.children.length === 0) return
    const next = new Set(expandedIds.value)
    if (next.has(item.id)) next.delete(item.id)
    else next.add(item.id)
    expandedIds.value = next
  }

  return { expandedIds, itemComponent, sections, toggleItem }
}

export { useSidebarMenu }
export type { UseSidebarMenuParameters }
