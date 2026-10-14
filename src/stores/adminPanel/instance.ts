import type { ParsedEntity } from "./types"
import type { AdminPanelConfig } from "../../components/admin/fields/types"

/**
 * Parameters shared by every keyed admin instance store (list, detail, form).
 *
 * The `instanceKey` is the dictionary key: the built-in admin uses one key
 * (`admin-1`) for all entities, while a standalone list/detail/form opened
 * elsewhere uses its own key and therefore gets its own dictionary entry
 * without touching the others.
 *
 * `entity` is the entity source: a getter for a fixed entity (standalone usage)
 * or `undefined` to fall back to the global active entity (inside the admin).
 */
interface AdminInstanceParameters {
  baseUrl: string
  config?: AdminPanelConfig
  entity?: () => ParsedEntity | undefined
  instanceKey: string
}

/** Resolves the instance entity, falling back to the admin's active entity. */
function resolveEntity(
  parameters: AdminInstanceParameters,
  fallback: () => ParsedEntity | undefined,
): ParsedEntity | undefined {
  return parameters.entity?.() ?? fallback()
}

/** Per-instance config wins; otherwise the single global config is reused. */
function resolveConfig(
  parameters: AdminInstanceParameters,
  globalConfig: AdminPanelConfig | undefined,
): AdminPanelConfig | undefined {
  return parameters.config ?? globalConfig
}

/** Per-entity customization for the resolved entity, if any. */
function resolveEntityConfig(
  config: AdminPanelConfig | undefined,
  entity: ParsedEntity | undefined,
) {
  if (config === undefined || entity === undefined) return undefined
  return config.entities?.[entity.entityName]
}

export { resolveConfig, resolveEntity, resolveEntityConfig }
export type { AdminInstanceParameters }
