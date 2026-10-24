import type { AdminSidebarGroup, AdminSidebarMenuItem } from "./fields/types"
import type { ParsedEntity } from "../../stores/adminPanel/types"

/** Flat menu item before nesting, ordering and level calculation. */
interface AdminMenuSourceItem {
  entity?: ParsedEntity
  href?: string
  id: string
  index?: number
  isActive: boolean
  label: string
  parent?: string
  parentId?: string
}

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

/** Resolves a parent reference by item id, href or label. */
function buildAliasMap(items: AdminMenuSourceItem[]) {
  const aliases = new Map<string, AdminMenuSourceItem>()
  for (const item of items) {
    aliases.set(item.id, item)
    if (item.href !== undefined) aliases.set(item.href, item)
    aliases.set(item.label, item)
  }
  return aliases
}

/** Removes parent links that form a cycle so rendering cannot recurse forever. */
function breakParentCycles(
  items: AdminMenuSourceItem[],
  parentOf: Map<string, AdminMenuSourceItem>,
) {
  for (const item of items) {
    const seen = new Set<string>([item.id])
    let parent = parentOf.get(item.id)
    while (parent !== undefined && !seen.has(parent.id)) {
      seen.add(parent.id)
      parent = parentOf.get(parent.id)
    }
    if (parent !== undefined) parentOf.delete(item.id)
  }
}

/** Moves items with an `index` to that sibling position; invalid indexes keep
 * the item where it is. */
function applyIndexes(items: AdminMenuSourceItem[]) {
  const ordered = [...items]
  for (const item of items) {
    const targetIndex = item.index
    if (
      targetIndex !== undefined &&
      Number.isInteger(targetIndex) &&
      targetIndex >= 0 &&
      targetIndex < ordered.length
    ) {
      const currentIndex = ordered.indexOf(item)
      if (currentIndex !== -1 && currentIndex !== targetIndex) {
        ordered.splice(currentIndex, 1)
        ordered.splice(targetIndex, 0, item)
      }
    }
  }
  return ordered
}

/**
 * Builds the nested menu tree: items without a resolvable parent are level 1,
 * children follow their parent, `index` reorders siblings and the active flag
 * bubbles up so an expanded parent is highlighted when a child is active.
 */
function buildMenuTree(items: AdminMenuSourceItem[]): AdminSidebarMenuItem[] {
  const aliases = buildAliasMap(items)
  const parentOf = new Map<string, AdminMenuSourceItem>()

  for (const item of items) {
    const parentKey = item.parent ?? item.parentId
    if (parentKey !== undefined) {
      const parent = aliases.get(parentKey)
      if (parent !== undefined && parent.id !== item.id) {
        parentOf.set(item.id, parent)
      }
    }
  }
  breakParentCycles(items, parentOf)

  const childrenOf = new Map<string, AdminMenuSourceItem[]>()
  for (const item of items) {
    const parent = parentOf.get(item.id)
    if (parent !== undefined) {
      const siblings = childrenOf.get(parent.id) ?? []
      siblings.push(item)
      childrenOf.set(parent.id, siblings)
    }
  }

  function buildNode(
    item: AdminMenuSourceItem,
    level: number,
  ): AdminSidebarMenuItem {
    const children = applyIndexes(childrenOf.get(item.id) ?? []).map((child) =>
      buildNode(child, level + 1),
    )
    return {
      children,
      entity: item.entity,
      href: item.href,
      id: item.id,
      index: item.index,
      isActive: item.isActive || children.some((child) => child.isActive),
      label: item.label,
      level,
    }
  }

  const roots = items.filter((item) => !parentOf.has(item.id))
  return applyIndexes(roots).map((item) => buildNode(item, 0))
}

export { buildMenuTree, visibleMenuGroups }
export type { AdminMenuSourceItem }
