import { getAdminEntityKey } from "./specs"

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
  /** Isolation scope for the spec (its service id). */
  scope?: string
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

/**
 * Per-entity customization for the resolved entity. The full `service:entity`
 * key wins; the bare name remains supported for single-spec configurations.
 */
function resolveEntityConfig(
  config: AdminPanelConfig | undefined,
  entity: ParsedEntity | undefined,
) {
  if (config === undefined || entity === undefined) return undefined
  const { entities } = config
  return entities?.[getAdminEntityKey(entity)] ?? entities?.[entity.entityName]
}

/** Uses the entity's owning spec origin, falling back to the instance base. */
function resolveEntityBaseUrl(
  entity: ParsedEntity | undefined,
  fallback: string,
): string {
  return entity?.baseUrl ?? fallback
}

export {
  resolveConfig,
  resolveEntity,
  resolveEntityBaseUrl,
  resolveEntityConfig,
}
export type { AdminInstanceParameters }
