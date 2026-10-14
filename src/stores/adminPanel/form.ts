import { computed, ref } from "vue"

import { isRecord } from "../../components/admin/fields/registry"
import { isRecordValue } from "../../components/admin/rawValue"
import { getRecordId } from "../../components/admin/recordId"
import { useFormApi } from "../../composables/api"
import { createInstanceRegistry } from "../instanceRegistry"

import { resolveConfig, resolveEntity } from "./instance"

import { useAdminPanelStore } from "./index"

import type { AdminInstanceParameters } from "./instance"
import type { ParsedEntity } from "./types"

const REQUEST_ERROR_MESSAGE = "Failed to save record"

/**
 * Create/edit form slice of a keyed admin instance: the form state, backend
 * errors, open state and the submit flow (with the host `before*`/`after*`
 * hooks), built on `useFormApi`. Independent from the list/detail slices.
 */
function createAdminPanelForm(parameters: AdminInstanceParameters) {
  const adminPanelStore = useAdminPanelStore()

  function currentEntity(): ParsedEntity | undefined {
    return resolveEntity(parameters, () => adminPanelStore.activeEntity)
  }

  function currentConfig() {
    return resolveConfig(parameters, adminPanelStore.config)
  }

  const { form, formErrors, sendForm, sendFormRequestErrors, sendFormStatus } =
    useFormApi<Record<string, unknown>>({
      blankForm: {},
      method: "post",
      url: "",
    })

  const formIsOpen = ref(false)
  const editingRecord = ref<Record<string, unknown>>()
  const isEditMode = computed(() => editingRecord.value !== undefined)

  function resetFormStatus() {
    sendFormStatus.value = "idle"
    formErrors.value = undefined
    sendFormRequestErrors.value = undefined
  }

  function startCreate() {
    editingRecord.value = undefined
    formIsOpen.value = true
    resetFormStatus()
  }

  function startEdit(record: unknown) {
    if (!isRecordValue(record)) return
    editingRecord.value = record
    formIsOpen.value = true
    resetFormStatus()
  }

  function closeForm() {
    formIsOpen.value = false
    editingRecord.value = undefined
  }

  function submitUrl(): string | undefined {
    const entity = currentEntity()
    if (!entity?.fullBasePath) return undefined

    const recordId = editingRecord.value
      ? getRecordId(editingRecord.value)
      : undefined
    if (isEditMode.value && recordId !== undefined) {
      return `${parameters.baseUrl}${entity.fullBasePath}${String(recordId)}/`
    }
    return `${parameters.baseUrl}${entity.fullBasePath}`
  }

  async function applyBeforeHook(payload: Record<string, unknown>) {
    const { hooks } = currentConfig() ?? {}
    const hook = isEditMode.value ? hooks?.beforeUpdate : hooks?.beforeCreate
    const result = await hook?.(payload)
    return isRecord(result) ? result : payload
  }

  async function applyAfterHook(record: unknown) {
    const { hooks } = currentConfig() ?? {}
    await (isEditMode.value
      ? hooks?.afterUpdate?.(record)
      : hooks?.afterCreate?.(record))
  }

  /** Sends the form; returns `true` on a successful save. */
  async function submitForm(): Promise<boolean> {
    const url = submitUrl()
    if (url === undefined) return false

    try {
      const body = await applyBeforeHook(form.value)
      const record = await sendForm({
        form: body,
        method: isEditMode.value ? "patch" : "post",
        url,
      })

      if (sendFormStatus.value === "success") {
        await applyAfterHook(record)
        return true
      }

      if (sendFormStatus.value === "error" && formErrors.value === undefined) {
        sendFormRequestErrors.value = REQUEST_ERROR_MESSAGE
      }
    } catch {
      sendFormRequestErrors.value = REQUEST_ERROR_MESSAGE
      sendFormStatus.value = "error"
    }
    return false
  }

  return {
    closeForm,
    editingRecord,
    form,
    formErrors,
    formIsOpen,
    isEditMode,
    sendFormRequestErrors,
    sendFormStatus,
    startCreate,
    startEdit,
    submitForm,
  }
}

type AdminPanelFormStore = ReturnType<typeof createAdminPanelForm>

const formRegistry = createInstanceRegistry<
  AdminInstanceParameters,
  AdminPanelFormStore
>({
  idPrefix: "admin-form",
  setup: createAdminPanelForm,
})

/** Returns (creating on first use) the form store for the instance key. */
function useAdminPanelFormStore(
  parameters: AdminInstanceParameters,
): AdminPanelFormStore {
  return formRegistry.use(parameters)
}

/** Returns an already-created form store, or `undefined`. */
function getAdminPanelFormStore(
  instanceKey: string | undefined,
): AdminPanelFormStore | undefined {
  return formRegistry.get(instanceKey)
}

export { createAdminPanelForm, getAdminPanelFormStore, useAdminPanelFormStore }
export type { AdminPanelFormStore }
