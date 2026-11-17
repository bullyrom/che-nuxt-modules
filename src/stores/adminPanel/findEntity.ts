import { AdminEntityResolutionError, resolveAdminEntity } from "./entityKey"
import { getAdminEntityKey } from "./specs"

import type { ParsedEntity } from "./types"

/**
 * Finds a parsed entity by its admin name or full `service:entity` key.
 * `namespace` narrows the lookup when the same entity name exists in several
 * API namespaces.
 */
function findAdminEntity(
  entities: readonly ParsedEntity[],
  entityName: string | undefined,
  namespace?: string,
): ParsedEntity | undefined {
  if (entityName === undefined) return undefined

  if (namespace !== undefined) {
    return entities.find(
      (entity) =>
        (entity.entityName === entityName ||
          getAdminEntityKey(entity) === entityName) &&
        entity.namespace === namespace,
    )
  }

  try {
    return resolveAdminEntity(entities, entityName)
  } catch (error_) {
    if (
      error_ instanceof AdminEntityResolutionError &&
      error_.code === "ambiguous"
    ) {
      throw error_
    }
    return undefined
  }
}

export { findAdminEntity }
