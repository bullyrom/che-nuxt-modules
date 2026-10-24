import { buildMenuTree } from "./menu"

import type {
  AdminPanelMenuLink,
  AdminSidebarGroup,
  AdminSidebarMenuItem,
} from "./fields/types"
import type { AdminMenuSourceItem } from "./menu"
import type { ParsedEntity } from "../../stores/adminPanel/types"

interface MenuSection {
  id: string
  items: AdminSidebarMenuItem[]
  title?: string
}

interface BuildMenuSectionsParameters {
  groups: AdminSidebarGroup[]
  isActive: (entity: ParsedEntity) => boolean
  links: AdminPanelMenuLink[]
  showGroups: boolean
}

function entityItem(
  entity: ParsedEntity,
  isActive: (entity: ParsedEntity) => boolean,
): AdminMenuSourceItem {
  return {
    entity,
    id: entity.fullBasePath || entity.entityName,
    isActive: isActive(entity),
    label: entity.entityName,
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

  if (!parameters.showGroups) {
    return [
      {
        id: "all",
        items: buildMenuTree([
          ...parameters.groups.flatMap((group) =>
            group.entities.map((entity) =>
              entityItem(entity, parameters.isActive),
            ),
          ),
          ...linkItems,
        ]),
      },
    ]
  }

  const groupSections = parameters.groups
    .map((group) => ({
      id: group.namespace || "no-namespace",
      items: buildMenuTree(
        group.entities.map((entity) =>
          entityItem(entity, parameters.isActive),
        ),
      ),
      title: group.namespace || "No namespace",
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
