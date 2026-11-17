import {
  entityDisplayLabel,
  entityReference,
} from "../../stores/adminPanel/entityKey"

import { buildMenuTree } from "./menu"

import type {
  AdminPanelMenuLink,
  AdminSidebarGroup,
  AdminSidebarMenuItem,
} from "./fields/types"
import type { AdminMenuSourceItem } from "./menu"
import type { AdminEntityLabelMode } from "../../stores/adminPanel/entityKey"
import type { ParsedEntity } from "../../stores/adminPanel/types"

interface MenuSection {
  id: string
  items: AdminSidebarMenuItem[]
  title?: string
}

interface BuildMenuSectionsParameters {
  /** Every connected entity, including hidden ones, for label conflicts. */
  allEntities?: readonly ParsedEntity[]
  /** Entity label mode; `auto` prefixes only conflicting short names. */
  entityLabel?: AdminEntityLabelMode
  groups: AdminSidebarGroup[]
  isActive: (entity: ParsedEntity) => boolean
  links: AdminPanelMenuLink[]
  showGroups: boolean
}

/** Builds one menu row; ids use the service key so specs cannot collide. */
function entityItem(
  entity: ParsedEntity,
  entities: readonly ParsedEntity[],
  isActive: (entity: ParsedEntity) => boolean,
  labelMode: AdminEntityLabelMode,
  useServiceKeys: boolean,
): AdminMenuSourceItem {
  const serviceKey =
    entityReference(entity) || entity.fullBasePath || entity.entityName
  return {
    entity,
    id: useServiceKeys ? serviceKey : entity.fullBasePath || serviceKey,
    isActive: isActive(entity),
    label: entityDisplayLabel(entity, entities, labelMode),
  }
}

function linkItem(link: AdminPanelMenuLink): AdminMenuSourceItem {
  return {
    href: link.href,
    id: link.id ?? link.href,
    index: link.index,
    isActive: false,
    label: link.label,
    parent: link.parent,
    parentId: link.parentId,
  }
}

/** Maps endpoints and site links to the unified, grouped/flat menu sections. */
function buildMenuSections(
  parameters: BuildMenuSectionsParameters,
): MenuSection[] {
  const linkItems = parameters.links.map((link) => linkItem(link))
  const entities =
    parameters.allEntities ??
    parameters.groups.flatMap((group) => group.entities)
  const labelMode = parameters.entityLabel ?? "auto"
  const useServiceKeys = parameters.groups.some(
    (group) => group.service !== undefined,
  )

  if (!parameters.showGroups) {
    return [
      {
        id: "all",
        items: buildMenuTree([
          ...entities.map((entity) =>
            entityItem(
              entity,
              entities,
              parameters.isActive,
              labelMode,
              useServiceKeys,
            ),
          ),
          ...linkItems,
        ]),
      },
    ]
  }

  const groupSections = parameters.groups
    .map((group) => ({
      id: group.service ?? (group.namespace || "no-namespace"),
      items: buildMenuTree(
        group.entities.map((entity) =>
          entityItem(
            entity,
            entities,
            parameters.isActive,
            labelMode,
            useServiceKeys,
          ),
        ),
      ),
      title: group.title ?? (group.namespace || "No namespace"),
    }))
    .filter((section) => section.items.length > 0)

  const linkSection =
    linkItems.length > 0
      ? [
          {
            id: "links",
            items: buildMenuTree(linkItems),
            title: "Links",
          },
        ]
      : []

  return [...groupSections, ...linkSection]
}

export { buildMenuSections }
export type { BuildMenuSectionsParameters, MenuSection }
