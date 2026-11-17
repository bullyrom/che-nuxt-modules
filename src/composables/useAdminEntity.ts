import { storeToRefs } from "pinia"
import { computed, toRefs } from "vue"

import { getEntityOperationTypes } from "../stores/adminPanel/apiTypes"
import { useAdminPanelDetailStore } from "../stores/adminPanel/detail"
import { findAdminEntity } from "../stores/adminPanel/findEntity"
import { useAdminPanelFormStore } from "../stores/adminPanel/form"
import { useAdminPanelStore } from "../stores/adminPanel/index"
import { useAdminPanelListStore } from "../stores/adminPanel/list"
import { isPaginatedListSchema } from "../stores/adminPanel/pagination"

import { useShowLoader } from "./useShowLoader"

import type { AdminPanelConfig } from "../components/admin/fields/types"
import type { AdminInstanceParameters } from "../stores/adminPanel/instance"
import type { ListQueryParameters } from "../stores/adminPanel/queryParameters"
import type { ParsedEntity } from "../stores/adminPanel/types"
import type { FormErrors, RequestStatus } from "../types"
import type { ComputedRef, Ref } from "vue"

type AdminEntityRecord = Record<string, unknown>

interface UseAdminEntityParameters<
  EntityTypes extends Record<string, AdminEntityRecord>,
  Name extends keyof EntityTypes & string,
> {
  /** Base API origin used by every request of this instance. */
  baseUrl?: string
  /** Optional per-instance config; falls back to the shared admin config. */
  config?: AdminPanelConfig<EntityTypes>
  /** Admin (parsed OpenAPI) entity name. */
  entityName: Name
  /** Instance dictionary key; separate keys give independent stores. */
  instanceKey: string
  /** Narrow the entity lookup when the name exists in several namespaces. */
  namespace?: string
}

interface AdminEntityListAccess<Entity extends AdminEntityRecord> {
  count: Ref<number | undefined>
  fetchNextPage: () => Promise<void>
  isPaginated: ComputedRef<boolean>
  listQueryParameters: ComputedRef<ListQueryParameters>
  nextPageUrl: Ref<null | string | undefined>
  page: Ref<number | undefined>
  previousPageUrl: Ref<null | string | undefined>
  queryValues: Ref<Record<string, unknown>>
  records: Ref<Entity[] | undefined>
  reload: () => Promise<void>
  searchQuery: Ref<string>
  showFooter: ComputedRef<boolean>
  showNextPageLoader: ComputedRef<boolean>
  status: Ref<RequestStatus>
}

interface AdminEntityDetailAccess<Entity extends AdminEntityRecord> {
  closeView: () => void
  hasDetailEndpoint: ComputedRef<boolean>
  loadRecordDetail: () => Promise<void>
  patchRecord: (changed: Partial<Entity>) => void
  record: ComputedRef<Entity | undefined>
  startView: (record: Entity) => void
  status: Ref<RequestStatus>
  viewingRecord: Ref<Entity | undefined>
}

interface AdminEntityFormAccess<Entity extends AdminEntityRecord> {
  closeForm: () => void
  editingRecord: Ref<Entity | undefined>
  form: Ref<Partial<Entity>>
  formErrors: Ref<FormErrors | undefined>
  formIsOpen: Ref<boolean>
  isEditMode: ComputedRef<boolean>
  sendFormRequestErrors: Ref<string | undefined>
  startCreate: () => void
  startEdit: (record: Entity) => void
  status: Ref<RequestStatus>
  submitForm: () => Promise<boolean>
}

interface AdminEntityMutationAccess<Entity extends AdminEntityRecord> {
  deletingRecord: Ref<Entity | undefined>
  doDelete: () => Promise<void>
  resetUpdate: (id: string) => void
  startDelete: (record: Entity) => void
  update: (parameters: {
    data: Partial<Entity>
    id: string
  }) => Promise<Entity | undefined>
  updateErrors: (id: string) => FormErrors | undefined
  updateRequestErrors: (id: string) => string | undefined
  updateStatus: (id: string) => RequestStatus
}

interface AdminEntityAccess<Entity extends AdminEntityRecord> {
  detail: AdminEntityDetailAccess<Entity>
  entity: ComputedRef<ParsedEntity | undefined>
  form: AdminEntityFormAccess<Entity>
  list: AdminEntityListAccess<Entity>
  mutations: AdminEntityMutationAccess<Entity>
  showLoader: ComputedRef<boolean>
}

/**
 * Typed facade over the keyed admin instance stores. Pass the parsed entity
 * name and an instance key; the composable wires the list/detail/form slices to
 * that entity, exposes them fully typed by the entity's OpenAPI type and adds
 * the merged loader. A different `instanceKey` creates an independent copy of
 * the same entity.
 *
 * The data composables stay inside the Pinia stores; this composable only casts
 * their records to the host-provided entity type and curries the instance
 * parameters.
 */
function useAdminEntity<
  EntityTypes extends Record<string, AdminEntityRecord>,
  Name extends keyof EntityTypes & string,
>(
  parameters: UseAdminEntityParameters<EntityTypes, Name>,
): AdminEntityAccess<EntityTypes[Name]> {
  type Entity = EntityTypes[Name]

  const adminPanelStore = useAdminPanelStore()
  const { baseUrl: sharedBaseUrl, parsedEntities } =
    storeToRefs(adminPanelStore)

  const entity = computed(() =>
    findAdminEntity(
      parsedEntities.value,
      parameters.entityName,
      parameters.namespace,
    ),
  )

  const baseUrl = computed(
    () => parameters.baseUrl ?? sharedBaseUrl.value ?? "",
  )

  const instanceParameters: AdminInstanceParameters = {
    baseUrl: baseUrl.value,
    config: parameters.config as AdminPanelConfig | undefined,
    entity: () => entity.value,
    instanceKey: parameters.instanceKey,
  }

  const listStore = useAdminPanelListStore(instanceParameters)
  const detailStore = useAdminPanelDetailStore(instanceParameters)
  const formStore = useAdminPanelFormStore(instanceParameters)

  const listReferences = toRefs(listStore)
  const detailReferences = toRefs(detailStore)
  const formReferences = toRefs(formStore)

  const isPaginated = computed(() => {
    const entityValue = entity.value
    if (entityValue === undefined) return false
    const { listResponse } = getEntityOperationTypes(entityValue)
    return isPaginatedListSchema(adminPanelStore.resolveSchema(listResponse))
  })

  const showLoader = useShowLoader(
    [
      listReferences.fetchDataStatus,
      detailReferences.detailStatus,
      formReferences.sendFormStatus,
    ],
    true,
  )

  function update(updateParameters: {
    data: Partial<Entity>
    id: string
  }): Promise<Entity | undefined> {
    return listStore.update({
      data: updateParameters.data,
      id: updateParameters.id,
    }) as Promise<Entity | undefined>
  }

  return {
    detail: {
      closeView: detailStore.closeView,
      hasDetailEndpoint: detailStore.hasDetailEndpoint,
      loadRecordDetail: detailStore.loadRecordDetail,
      patchRecord: detailStore.patchRecord as (
        changed: Partial<Entity>,
      ) => void,
      record: detailReferences.detailRecord as ComputedRef<Entity | undefined>,
      startView: detailStore.startView as (record: Entity) => void,
      status: detailReferences.detailStatus,
      viewingRecord: detailReferences.viewingRecord as Ref<Entity | undefined>,
    },
    entity,
    form: {
      closeForm: formStore.closeForm,
      editingRecord: formReferences.editingRecord as Ref<Entity | undefined>,
      form: formReferences.form as Ref<Partial<Entity>>,
      formErrors: formReferences.formErrors as Ref<FormErrors | undefined>,
      formIsOpen: formReferences.formIsOpen,
      isEditMode: formReferences.isEditMode,
      sendFormRequestErrors: formReferences.sendFormRequestErrors,
      startCreate: formStore.startCreate,
      startEdit: formStore.startEdit as (record: Entity) => void,
      status: formReferences.sendFormStatus,
      submitForm: formStore.submitForm,
    },
    list: {
      count: listReferences.count,
      fetchNextPage: listStore.fetchNextPage,
      isPaginated,
      listQueryParameters: listReferences.listQueryParameters,
      nextPageUrl: listReferences.nextPageUrl,
      page: listReferences.page,
      previousPageUrl: listReferences.previousPageUrl,
      queryValues: listReferences.queryValues,
      records: listReferences.entityRecords as Ref<Entity[] | undefined>,
      reload: listStore.reload,
      searchQuery: listReferences.searchQuery,
      showFooter: listReferences.showFooter,
      showNextPageLoader: listReferences.showNextPageLoader,
      status: listReferences.fetchDataStatus,
    },
    mutations: {
      deletingRecord: listReferences.deletingRecord as Ref<Entity | undefined>,
      doDelete: listStore.doDelete,
      resetUpdate: listStore.resetUpdate,
      startDelete: listStore.startDelete as (record: Entity) => void,
      update,
      updateErrors: listStore.updateErrors,
      updateRequestErrors: listStore.updateRequestErrors,
      updateStatus: listStore.updateStatus,
    },
    showLoader,
  }
}

export { useAdminEntity }
export type {
  AdminEntityAccess,
  AdminEntityDetailAccess,
  AdminEntityFormAccess,
  AdminEntityListAccess,
  AdminEntityMutationAccess,
  UseAdminEntityParameters,
}
