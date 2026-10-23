import type { AdminSidebarGroup } from "./fields/types"

/** Drops hidden entities (by name or full path) from the endpoint menu groups. */
function visibleMenuGroups(
  groups: AdminSidebarGroup[],
  hiddenEntities: readonly string[] | undefined,
): AdminSidebarGroup[] {
  const hidden = new Set(hiddenEntities)
  return groups
    .map((group) => ({
      entities: group.entities.filter(
        (entity) =>
          !hidden.has(entity.entityName) && !hidden.has(entity.fullBasePath),
      ),
      namespace: group.namespace,
    }))
    .filter((group) => group.entities.length > 0)
}

export { visibleMenuGroups }
