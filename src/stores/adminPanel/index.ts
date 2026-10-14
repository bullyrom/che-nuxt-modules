// eslint-disable-next-line import/no-unresolved
import { defineStore } from "pinia"
import { shallowRef } from "vue"

import { useAdminPanel } from "../../composables/useAdminPanel"

import type { AdminPanelConfig } from "../../components/admin/fields/types"

/**
 * Global admin panel store: the schema (+ its derived getters), the active
 * entity used by the built-in navigation, and the single shared config. The
 * keyed list/detail/form stores read the config from here when no per-instance
 * config is passed, so the host config is never duplicated per instance.
 *
 * The config is a `shallowRef`: it holds component definitions, which must not
 * be turned into reactive proxies.
 */
export const useAdminPanelStore = defineStore("admin-panel", () => {
  const adminPanel = useAdminPanel()

  const config = shallowRef<AdminPanelConfig>()

  function setConfig(value: AdminPanelConfig | undefined) {
    config.value = value
  }

  return {
    activeEntity: adminPanel.activeEntity,
    activeEntityCreateSchema: adminPanel.activeEntityCreateSchema,
    activeEntityDeleteSchema: adminPanel.activeEntityDeleteSchema,
    activeEntityDetailSchema: adminPanel.activeEntityDetailSchema,
    activeEntityListQueryParameters:
      adminPanel.activeEntityListQueryParameters,
    activeEntityListSchema: adminPanel.activeEntityListSchema,
    activeEntityOperationTypes: adminPanel.activeEntityOperationTypes,
    activeEntityUpdateSchema: adminPanel.activeEntityUpdateSchema,
    clearEntity: adminPanel.clearEntity,
    closeModal: adminPanel.closeModal,
    config,
    filteredEntitiesByNamespace: adminPanel.filteredEntitiesByNamespace,
    getSchemaName: adminPanel.getSchemaName,
    isActiveEntityListPaginated: adminPanel.isActiveEntityListPaginated,
    namespaces: adminPanel.namespaces,
    parsedEntities: adminPanel.parsedEntities,
    resolveSchema: adminPanel.resolveSchema,
    schema: adminPanel.schema,
    setConfig,
    setSchema: adminPanel.setSchema,
    showListModal: adminPanel.showListModal,
  }
})
