import type { ParsedEntity } from "./types"

/**
 * Finds a parsed entity by its admin name. `namespace` narrows the lookup when
 * the same entity name exists in several API namespaces.
 */
function findAdminEntity(
  entities: readonly ParsedEntity[],
  entityName: string | undefined,
  namespace?: string,
): ParsedEntity | undefined {
  if (entityName === undefined) return undefined
  return entities.find(
    (entity) =>
      entity.entityName === entityName &&
      (namespace === undefined || entity.namespace === namespace),
  )
}

export { findAdminEntity }
