import { ref } from "vue"

import { isRecordValue } from "../../components/admin/rawValue"
import { getRecordId } from "../../components/admin/recordId"
import { useApiDelete, useApiUpdate } from "../../composables/api"

import type { ParsedEntity } from "./types"
import type { AdminPanelConfig } from "../../components/admin/fields/types"

interface CreateAdminPanelEntityDeletionParameters {
  baseUrl: string
  reload: () => Promise<void>
  resolveConfig: () => AdminPanelConfig | undefined
  resolveEntity: () => ParsedEntity | undefined
}

/**
 * Delete/update slice of the admin list store: the pending deletion, the request
 * (with the host `beforeDelete`/`afterDelete` hooks) and the keyed update state,
 * built on `useApiDelete`/`useApiUpdate`. Called only from the list store setup.
 */
function createAdminPanelEntityDeletion(
  parameters: CreateAdminPanelEntityDeletionParameters,
) {
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

    const entity = parameters.resolveEntity()
    const recordId = getRecordId(record)
    if (!entity?.fullBasePath || recordId === undefined) return

    const { hooks } = parameters.resolveConfig() ?? {}
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
