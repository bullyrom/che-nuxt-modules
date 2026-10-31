import { storeToRefs } from "pinia"
import { computed } from "vue"

import { useAdminPanelStore } from "../../stores/adminPanel/index"

import { visibleMenuGroups } from "./menu"
import { buildMenuSections } from "./menuSections"

import type {
  AdminPanelConfig,
  AdminPanelMenuLink,
  AdminSidebarGroup,
} from "./fields/types"
import type { MenuSection } from "./menuSections"
import type { ParsedEntity } from "../../stores/adminPanel/types"

/** Optional overrides for the menu data; omitted values fall back to the store. */
interface UseAdminMenuSectionsParameters {
  /** Admin config whose `menu` provides the defaults for links/visibility. */
  config?: AdminPanelConfig
  /** Explicit links; wins over `config.menu.extraLinks`. */
  extraLinks?: AdminPanelMenuLink[]
  /** Pre-filtered groups; omitted reads the shared admin store. */
  filteredEntitiesByNamespace?: AdminSidebarGroup[]
  /** Explicit hidden entities; wins over `config.menu.hiddenEntities`. */
  hiddenEntities?: string[]
  /** Group entities by API namespace; defaults to `false`. */
  showGroups?: boolean
}

/**
 * Reactive menu model used by the endpoints sidebar (`SidebarEndpointsMenu` /
 * `SidebarEndpointsList`). Reads the shared admin panel store when groups,
 * links or visibility are not passed explicitly, so a host can render its own
 * navigation from exactly the same data the built-in sidebar shows.
 */
function useAdminMenuSections(
  parameters: UseAdminMenuSectionsParameters = {},
) {
  const adminPanelStore = useAdminPanelStore()
  const {
    activeEntity,
    config: storeConfig,
    filteredEntitiesByNamespace: storeGroups,
  } = storeToRefs(adminPanelStore)

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

  function isActive(entity: ParsedEntity) {
    return (
      activeEntity.value?.entityName === entity.entityName &&
      activeEntity.value?.namespace === entity.namespace
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

  return { sections }
}

export { useAdminMenuSections }
export type { UseAdminMenuSectionsParameters }
