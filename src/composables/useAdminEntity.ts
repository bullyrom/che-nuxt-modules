import { storeToRefs } from "pinia"
import { computed, toRefs } from "vue"

import { getEntityOperationTypes } from "../stores/adminPanel/apiTypes"
import { useAdminPanelDetailStore } from "../stores/adminPanel/detail"
import {
  AdminEntityResolutionError,
  resolveAdminEntity,
} from "../stores/adminPanel/entityKey"
import { useAdminPanelFormStore } from "../stores/adminPanel/form"
import { useAdminPanelStore } from "../stores/adminPanel/index"
import { useAdminPanelListStore } from "../stores/adminPanel/list"
import { isPaginatedListSchema } from "../stores/adminPanel/pagination"

import { useShowLoader } from "./useShowLoader"

import type {
  AdminEntityAccess,
  AdminEntityRecord,
  AdminEntityResolvedKey,
  AdminEntityShortName,
  UseAdminEntityByKeyParameters,
  UseAdminEntityByNameParameters,
  UseAdminEntityParameters,
} from "./useAdminEntityTypes"
import type { AdminPanelConfig } from "../components/admin/fields/types"

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
  Key extends keyof EntityTypes & string,
>(
  parameters: UseAdminEntityByKeyParameters<EntityTypes, Key>,
): AdminEntityAccess<EntityTypes[Key]>
function useAdminEntity<
  EntityTypes extends Record<string, AdminEntityRecord>,
  Name extends
    | AdminEntityShortName<EntityTypes>
    | (keyof EntityTypes & string),
>(
  parameters: UseAdminEntityByNameParameters<EntityTypes, Name>,
): AdminEntityAccess<EntityTypes[AdminEntityResolvedKey<EntityTypes, Name>]>
function useAdminEntity<
  EntityTypes extends Record<string, AdminEntityRecord>,
  Key extends keyof EntityTypes & string = keyof EntityTypes & string,
>(
  parameters: UseAdminEntityParameters<EntityTypes>,
): AdminEntityAccess<EntityTypes[Key]> {
  type Entity = EntityTypes[Key]

  const adminPanelStore = useAdminPanelStore()
  const { baseUrl: sharedBaseUrl, parsedEntities } =
    storeToRefs(adminPanelStore)

  const reference = computed(() => {
    if (parameters.entityKey !== undefined) return parameters.entityKey
    const name = parameters.entityName
    if (name === undefined) return undefined
    return parameters.service === undefined
      ? name
      : `${parameters.service}:${name}`
  })

  const entity = computed(() => {
    const { value } = reference
    if (value === undefined) return undefined
    try {
      return resolveAdminEntity(parsedEntities.value, value)
    } catch (error_) {
      if (
        error_ instanceof AdminEntityResolutionError &&
        error_.code === "ambiguous"
      ) {
        throw error_
      }
      return undefined
    }
  })

  const baseUrl = computed(
    () => parameters.baseUrl ?? sharedBaseUrl.value ?? "",
  )

  const instanceParameters: AdminInstanceParameters = {
    baseUrl: baseUrl.value,
    config: parameters.config as AdminPanelConfig | undefined,
    entity: () => entity.value,
    instanceKey: parameters.instanceKey,
    scope: entity.value?.service ?? parameters.service,
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
    return isPaginatedListSchema(
      adminPanelStore.resolveSchema(listResponse, entityValue),
    )
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
  AdminEntityKeyByName,
  AdminEntityListAccess,
  AdminEntityMutationAccess,
  AdminEntityRecord,
  AdminEntityResolvedKey,
  AdminEntityShortName,
  UseAdminEntityBaseParameters,
  UseAdminEntityByKeyParameters,
  UseAdminEntityByNameParameters,
  UseAdminEntityParameters,
} from "./useAdminEntityTypes"
