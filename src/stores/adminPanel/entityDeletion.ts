import { ref } from "vue"

import { isRecordValue } from "../../components/admin/rawValue"
import { getRecordId } from "../../components/admin/recordId"
import { useApiDelete, useApiUpdate } from "../../composables/api"

import { useAdminPanelStore } from "./index"

import type { AdminPanelConfig } from "../../components/admin/fields/types"

interface CreateAdminPanelEntityDeletionParameters {
  baseUrl: string
  config?: AdminPanelConfig
  reload: () => Promise<void>
}

/**
 * Delete/update slice of the admin entity store: the pending deletion, the
 * request (with the host `beforeDelete`/`afterDelete` hooks) and the keyed
 * update state, built on `useApiDelete`/`useApiUpdate`. Called only from the
 * entity store setup.
 */
function createAdminPanelEntityDeletion(
  parameters: CreateAdminPanelEntityDeletionParameters,
) {
  const adminPanelStore = useAdminPanelStore()

  const { destroy } = useApiDelete({ url: "" })
  const {
    reset: resetUpdate,
    update,
    updateErrors,
    updateRequestErrors,
    updateStatus,
  } = useApiUpdate({ url: "" })

  const deletingRecord = ref<Record<string, unknown>>()

  function startDelete(record: unknown) {
    if (isRecordValue(record)) deletingRecord.value = record
  }

  async function doDelete() {
    const record = deletingRecord.value
    if (!record) return

    const entity = adminPanelStore.activeEntity
    const recordId = getRecordId(record)
    if (!entity?.fullBasePath || recordId === undefined) return

    const { hooks } = parameters.config ?? {}
    const canDelete = await hooks?.beforeDelete?.(record)
    if (canDelete === false) return

    const response = await destroy({
      id: String(recordId),
      url: `${parameters.baseUrl}${entity.fullBasePath}`,
    })
    if (response !== undefined) {
      await hooks?.afterDelete?.(record)
    }
    // eslint-disable-next-line require-atomic-updates
    deletingRecord.value = undefined
    await parameters.reload()
  }

  return {
    deletingRecord,
    doDelete,
    resetUpdate,
    startDelete,
    update,
    updateErrors,
    updateRequestErrors,
    updateStatus,
  }
}

export { createAdminPanelEntityDeletion }
export type { CreateAdminPanelEntityDeletionParameters }
