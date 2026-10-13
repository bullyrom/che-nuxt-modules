// eslint-disable-next-line import/no-unresolved
import { defineStore } from "pinia"

import { createAdminPanelEntityDeletion } from "./entityDeletion"
import { createAdminPanelEntityForm } from "./entityForm"
import { createAdminPanelEntityList } from "./entityList"

import type { AdminPanelConfig } from "../../components/admin/fields/types"
import type { InjectionKey } from "vue"

interface UseAdminPanelEntityStoreParameters {
  baseUrl: string
  config?: AdminPanelConfig
  /** Stable per-entity id: the entity's `fullBasePath`. */
  entityPath: string
}

/** The admin entity store instance (all admin data lives here). */
type AdminPanelEntityStore = ReturnType<typeof createAdminPanelEntityStore>

const ADMIN_ENTITY_STORE: InjectionKey<AdminPanelEntityStore> = Symbol(
  "che-admin-entity-store",
)

function createAdminPanelEntityStore(
  parameters: UseAdminPanelEntityStoreParameters,
) {
  const list = createAdminPanelEntityList(parameters)
  const deletion = createAdminPanelEntityDeletion({
    ...parameters,
    reload: list.reload,
  })
  const form = createAdminPanelEntityForm(parameters)

  return { ...list, ...deletion, ...form }
}

const entityStoreDefinitions = new Map<string, () => AdminPanelEntityStore>()

/**
 * Returns the per-entity admin store, creating it on first use. One store per
 * entity (`entity.entityName`/`fullBasePath`), so different entities keep
 * independent, SSR-hydrated data.
 */
function useAdminPanelEntityStore(
  parameters: UseAdminPanelEntityStoreParameters,
): AdminPanelEntityStore {
  const existing = entityStoreDefinitions.get(parameters.entityPath)
  if (existing !== undefined) return existing()

  const useStore = defineStore(`admin-entity:${parameters.entityPath}`, () =>
    createAdminPanelEntityStore(parameters),
  )
  entityStoreDefinitions.set(parameters.entityPath, useStore)
  return useStore()
}

/** Returns an already-created entity store, or `undefined` if none exists. */
function getAdminPanelEntityStore(
  entityPath: string | undefined,
): AdminPanelEntityStore | undefined {
  if (entityPath === undefined) return undefined
  const useStore = entityStoreDefinitions.get(entityPath)
  return useStore?.()
}

export {
  ADMIN_ENTITY_STORE,
  getAdminPanelEntityStore,
  useAdminPanelEntityStore,
}
export type { AdminPanelEntityStore, UseAdminPanelEntityStoreParameters }
