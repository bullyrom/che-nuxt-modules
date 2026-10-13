import { ref } from "vue"

import { useApiDelete } from "../../composables/api"

import { isRecordValue } from "./rawValue"
import { getRecordId } from "./recordId"

import type { AdminPanelConfig } from "./fields/types"
import type { ParsedEntity } from "../../stores/adminPanel/types"

interface UseEntityRecordDeletionParameters {
  baseUrl: string
  config?: AdminPanelConfig
  getActiveEntity: () => ParsedEntity | undefined
  reload: () => Promise<void>
}

/**
 * Owns the admin "delete a record" flow: the pending record, the confirmation
 * state and the request (with the host `beforeDelete` / `afterDelete` hooks),
 * reloading the list on success.
 */
function useEntityRecordDeletion(
  parameters: UseEntityRecordDeletionParameters,
) {
  const { destroy: destroyRecord } = useApiDelete({ url: "" })
  const deletingRecord = ref<Record<string, unknown>>()

  function startDelete(record: unknown) {
    if (isRecordValue(record)) deletingRecord.value = record
  }

  async function doDelete() {
    const record = deletingRecord.value
    if (!record) return

    const entity = parameters.getActiveEntity()
    const recordId = getRecordId(record)
    if (!entity?.fullBasePath || recordId === undefined) return

    const { hooks } = parameters.config ?? {}
    const canDelete = await hooks?.beforeDelete?.(record)
    if (canDelete === false) return

    const response = await destroyRecord({
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

  return { deletingRecord, doDelete, startDelete }
}

export { useEntityRecordDeletion }
export type { UseEntityRecordDeletionParameters }
