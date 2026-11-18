import type { PaginationFormat } from "./api/paginationTypes"
import type { AdminPanelConfig } from "../components/admin/fields/types"
import type { ListQueryParameters } from "../stores/adminPanel/queryParameters"
import type { ParsedEntity } from "../stores/adminPanel/types"
import type { FormErrors, RequestStatus } from "../types"
import type { ComputedRef, Ref } from "vue"

type AdminEntityRecord = Record<string, unknown>

/** Short entity names derived from the full `service:entity` type keys. */
type AdminEntityShortName<
  EntityTypes extends Record<string, AdminEntityRecord>,
> = {
  [Key in keyof EntityTypes & string]: Key extends `${string}:${infer Name}`
    ? Name
    : Key
}[keyof EntityTypes & string]

/** Maps a short name back to its full key(s) so the entity type is inferred. */
type AdminEntityKeyByName<
  EntityTypes extends Record<string, AdminEntityRecord>,
  Name extends string,
> = {
  [Key in keyof EntityTypes & string]: Key extends `${string}:${infer Short}`
    ? Short extends Name
      ? Key
      : never
    : Key extends Name
      ? Key
      : never
}[keyof EntityTypes & string]

/** A full key stays as-is; a short name is mapped to its full key. */
type AdminEntityResolvedKey<
  EntityTypes extends Record<string, AdminEntityRecord>,
  Name extends string,
> = Name extends keyof EntityTypes & string
  ? Name
  : AdminEntityKeyByName<EntityTypes, Name>

/** Parameters shared by both entity reference modes. */
interface UseAdminEntityBaseParameters<
  EntityTypes extends Record<string, AdminEntityRecord>,
> {
  /** Base API origin used by every request of this instance. */
  baseUrl?: string
  /** Optional per-instance config; falls back to the shared admin config. */
  config?: AdminPanelConfig<EntityTypes>
  /** Instance dictionary key; separate keys give independent stores. */
  instanceKey: string
  /** Narrow the entity lookup when the name exists in several namespaces. */
  namespace?: string
  /** Service id used to disambiguate a short `entityName`. */
  service?: string
}

/** Resolves an entity by its full `service:entity` key. */
interface UseAdminEntityByKeyParameters<
  EntityTypes extends Record<string, AdminEntityRecord>,
  Key extends keyof EntityTypes & string = keyof EntityTypes & string,
> extends UseAdminEntityBaseParameters<EntityTypes> {
  entityKey: Key
  entityName?: never
}

/** Resolves an entity by a short name (allowed only when unique). */
interface UseAdminEntityByNameParameters<
  EntityTypes extends Record<string, AdminEntityRecord>,
  Name extends
    | AdminEntityShortName<EntityTypes>
    | (keyof EntityTypes & string) = AdminEntityShortName<EntityTypes>,
> extends UseAdminEntityBaseParameters<EntityTypes> {
  entityKey?: never
  entityName: Name
}

type UseAdminEntityParameters<
  EntityTypes extends Record<string, AdminEntityRecord>,
  Name extends
    | AdminEntityShortName<EntityTypes>
    | (keyof EntityTypes & string) = AdminEntityShortName<EntityTypes>,
> =
  | UseAdminEntityByKeyParameters<EntityTypes>
  | UseAdminEntityByNameParameters<EntityTypes, Name>

interface AdminEntityListAccess<Entity extends AdminEntityRecord> {
  count: Ref<number | undefined>
  fetchNextPage: () => Promise<void>
  isPaginated: ComputedRef<boolean>
  listQueryParameters: ComputedRef<ListQueryParameters>
  nextPageUrl: Ref<null | string | undefined>
  page: Ref<number | undefined>
  pageSize: Ref<number | undefined>
  paginationFormat: Ref<PaginationFormat | undefined>
  previousPageUrl: Ref<null | string | undefined>
  queryValues: Ref<Record<string, unknown>>
  records: Ref<Entity[] | undefined>
  reload: () => Promise<void>
  searchQuery: Ref<string>
  showFooter: ComputedRef<boolean>
  showNextPageLoader: ComputedRef<boolean>
  status: Ref<RequestStatus>
  totalPages: Ref<number | undefined>
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
}
