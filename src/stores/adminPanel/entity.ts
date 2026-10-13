// eslint-disable-next-line import/no-unresolved
import { defineStore, getActivePinia } from "pinia"

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

// Store definitions are scoped to the active Pinia (one per SSR request and per
// client app) so nothing leaks between requests and no stale entity store is
// reused with another request's `baseUrl`/`config`.
const registries = new WeakMap<
  object,
  Map<string, () => AdminPanelEntityStore>
>()

function entityRegistry():
  | Map<string, () => AdminPanelEntityStore>
  | undefined {
  const pinia = getActivePinia()
  if (pinia === undefined) return undefined

  const existing = registries.get(pinia)
  if (existing !== undefined) return existing

  const registry = new Map<string, () => AdminPanelEntityStore>()
  registries.set(pinia, registry)
  return registry
}

/**
 * Returns the per-entity admin store, creating it on first use. One store per
 * entity id (`entity.fullBasePath`), so every entity keeps independent,
 * SSR-hydrated data.
 */
function useAdminPanelEntityStore(
  parameters: UseAdminPanelEntityStoreParameters,
): AdminPanelEntityStore {
  const registry = entityRegistry()
  const existing = registry?.get(parameters.entityPath)
  if (existing !== undefined) return existing()

  const useStore = defineStore(`admin-entity:${parameters.entityPath}`, () =>
    createAdminPanelEntityStore(parameters),
  )
  registry?.set(parameters.entityPath, useStore)
  return useStore()
}

/** Returns an already-created entity store, or `undefined` if none exists. */
function getAdminPanelEntityStore(
  entityPath: string | undefined,
): AdminPanelEntityStore | undefined {
  if (entityPath === undefined) return undefined
  return entityRegistry()?.get(entityPath)?.()
}

export {
  ADMIN_ENTITY_STORE,
  getAdminPanelEntityStore,
  useAdminPanelEntityStore,
}
export type { AdminPanelEntityStore, UseAdminPanelEntityStoreParameters }
