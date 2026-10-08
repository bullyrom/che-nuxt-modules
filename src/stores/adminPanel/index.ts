// eslint-disable-next-line import/no-unresolved
import { defineStore } from "pinia"

import { useAdminPanel } from "../../composables/useAdminPanel"

export const useAdminPanelStore = defineStore("admin-panel", () => {
  const adminPanel = useAdminPanel()

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
    filteredEntitiesByNamespace: adminPanel.filteredEntitiesByNamespace,
    isActiveEntityListPaginated: adminPanel.isActiveEntityListPaginated,
    namespaces: adminPanel.namespaces,
    parsedEntities: adminPanel.parsedEntities,
    schema: adminPanel.schema,
    setSchema: adminPanel.setSchema,
    showListModal: adminPanel.showListModal,
  }
})
