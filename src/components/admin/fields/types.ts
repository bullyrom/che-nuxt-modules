import type { ParsedEntity } from "../../stores/adminPanel/types"
import type { RequestStatus } from "../../types"
/* eslint-disable max-lines */
import type { AdminRealtimeClient, AdminRealtimeEntityName } from "../realtime"
import type { AdminPanelThemeSource } from "../theme"
import type { OpenAPIV3 } from "openapi-types"
import type { Component } from "vue"

type FieldKind =
  | "array"
  | "boolean"
  | "integer"
  | "number"
  | "object"
  | "string"

interface FieldKindValueMap {
  array: unknown[]
  boolean: boolean
  integer: number | undefined
  number: number | undefined
  object: Record<string, unknown>
  string: string
}

type FieldValueOfKind<Kind extends FieldKind> = FieldKindValueMap[Kind]

interface FieldDescriptor {
  children?: FieldDescriptor[]
  description?: string
  format?: string
  key: string
  kind: FieldKind
  multiline?: boolean
  readOnly?: boolean
  required?: boolean
  schema?: OpenAPIV3.SchemaObject
}

interface FieldComponentProperties<Value = unknown> {
  field?: FieldDescriptor
  modelValue: Value
  "onUpdate:modelValue"?: (value: Value) => void
}

type FieldComponent<Value = unknown> = Component<
  FieldComponentProperties<Value>
>

interface FieldComponentRegistry {
  array: FieldComponent<unknown[]>
  boolean: FieldComponent<boolean>
  integer: FieldComponent<number | undefined>
  number: FieldComponent<number | undefined>
  object: FieldComponent<Record<string, unknown>>
  string: FieldComponent<string>
}

type PartialFieldComponentRegistry = Partial<FieldComponentRegistry>

type FieldOverride =
  | { component: FieldComponent<boolean>; kind: "boolean" }
  | { component: FieldComponent<number | undefined>; kind: "integer" }
  | { component: FieldComponent<number | undefined>; kind: "number" }
  | { component: FieldComponent<Record<string, unknown>>; kind: "object" }
  | { component: FieldComponent<string>; kind: "string" }
  | { component: FieldComponent<unknown[]>; kind: "array" }

type FieldOverrideNode =
  | FieldOverride
  | { [nestedKey: string]: FieldOverrideNode }

/**
 * A whole-object customization component. It receives the complete record
 * (`value`, fully typed via the `ObjectType` generic) and renders whatever it
 * wants, using any of the object's fields. Whenever it changes one of the
 * fields the admin must not render itself (`hiddenFields` on the override), it
 * emits the changed subset through the typed `onChange` setter so the admin
 * pushes the change back up.
 */
interface FieldGroupComponentProperties<
  ObjectType extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Typed setter: pass only the changed fields, they are merged back. */
  onChange: (changed: Partial<ObjectType>) => void
  /** The whole object, typed by the host through the config generic. */
  value: ObjectType
}

type FieldGroupComponent<
  ObjectType extends Record<string, unknown> = Record<string, unknown>,
> = Component<FieldGroupComponentProperties<ObjectType>>

/**
 * Object-group override (level 1): the admin hides `hiddenFields` from its own
 * rendering (form / list item / detail) and renders `component` once with the
 * whole object plus the typed setter. Other fields keep the standard rendering.
 */
interface FieldGroupOverride<
  ObjectType extends Record<string, unknown> = Record<string, unknown>,
> {
  component: FieldGroupComponent<ObjectType>
  /** Fields the admin must not render itself; the component owns them. */
  hiddenFields?: (keyof ObjectType & string)[]
}

/** A custom menu link appended to the default admin sidebar. */
interface AdminPanelMenuLink {
  href: string
  label: string
}

/** Per-entity customization of the default sidebar menu. */
interface AdminPanelMenuConfig {
  /** Extra page links appended below the entity list. */
  extraLinks?: AdminPanelMenuLink[]
  /** Names or full paths of entities that must not be listed. */
  hiddenEntities?: string[]
}

/**
 * Config fragment for an embedded list: only what the list needs (grid, its
 * area overrides, query field components, per-item whole-object override). Pass
 * this instead of the whole `AdminPanelConfig` when embedding one list.
 */
interface AdminListConfig<
  ObjectType extends Record<string, unknown> = Record<string, unknown>,
> {
  defaultComponents?: PartialFieldComponentRegistry
  /** Builds a detail URL per record; absent hides the detail action. */
  detailHref?: (record: Record<string, unknown>) => string | undefined
  gridColumns?: number
  itemOverride?: FieldGroupOverride<ObjectType>
  list?: Component<AdminListComponentProperties>
  listFooter?: Component<AdminListComponentProperties>
  listHeader?: Component<AdminListComponentProperties>
}

/**
 * Config fragment for an embedded detail: the whole-detail override and/or the
 * whole-object field-group override.
 */
interface AdminDetailConfig<
  ObjectType extends Record<string, unknown> = Record<string, unknown>,
> {
  detail?: Component<AdminDetailComponentProperties>
  override?: FieldGroupOverride<ObjectType>
}

/**
 * Config fragment for an embedded form: the field components/overrides and the
 * whole-object field-group override.
 */
interface AdminFormConfig<
  ObjectType extends Record<string, unknown> = Record<string, unknown>,
> {
  defaultComponents?: PartialFieldComponentRegistry
  override?: FieldGroupOverride<ObjectType>
  overrides?: Record<string, Record<string, FieldOverrideNode>>
}

interface AdminSidebarGroup {
  entities: ParsedEntity[]
  namespace: string
}

/** Props handed to a whole-list override (level 2, full). */
interface AdminListComponentProperties {
  count?: number
  /**
   * Builds the detail URL for a record. When present, the built-in list renders
   * the `View` action as a link; when absent (and no in-place handler) the
   * detail action is hidden.
   */
  detailHref?: (record: Record<string, unknown>) => string | undefined
  entityName?: string
  fetchNextPage: () => Promise<void>
  gridColumns?: number
  nextPageUrl?: string
  previousPageUrl?: string
  records?: Record<string, unknown>[]
  reload: () => Promise<void>
  showNextPageLoader: boolean
  startCreate?: () => void
  status: RequestStatus
}

/** Props handed to a whole-detail override (level 2, full). */
interface AdminDetailComponentProperties {
  close: () => void
  hasDetailEndpoint: boolean
  record?: Record<string, unknown>
  reload: () => Promise<void>
  status: RequestStatus
}

/** Props handed to a header override (level 4). */
interface AdminHeaderComponentProperties {
  canCreate: boolean
  clearEntity: () => void
  entity?: ParsedEntity
  listChangesCount: number
  reload: () => void
  startCreate: () => void
}

/** Props handed to a sidebar override (level 5). */
interface AdminSidebarComponentProperties {
  activeEntity?: ParsedEntity
  extraLinks: AdminPanelMenuLink[]
  groups: AdminSidebarGroup[]
  isMobile?: boolean
  selectEntity: (entity: ParsedEntity) => void
}

/**
 * Whole-area component overrides. Every field is optional: only the areas the
 * host supplies are replaced, the rest keeps the library default.
 */
interface AdminPanelViewsConfig {
  detail?: Component<AdminDetailComponentProperties>
  header?: Component<AdminHeaderComponentProperties>
  list?: Component<AdminListComponentProperties>
  listFooter?: Component<AdminListComponentProperties>
  listHeader?: Component<AdminListComponentProperties>
  sidebar?: Component<AdminSidebarComponentProperties>
}

/** Per-entity customization (level 1 + level 3). */
interface AdminPanelEntityConfig<
  ObjectType extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Whole-object override for the record detail. */
  detailOverride?: FieldGroupOverride<ObjectType>
  /** Whole-object override for the create/edit form. */
  formOverride?: FieldGroupOverride<ObjectType>
  /** Objects per row for this entity; overrides the global value. */
  gridColumns?: number
  /** Whole-object override for each rendered list item. */
  listItemOverride?: FieldGroupOverride<ObjectType>
}

interface AdminPanelFieldConfig {
  defaultComponents?: PartialFieldComponentRegistry
  overrides?: Record<string, Record<string, FieldOverrideNode>>
}

interface AdminPanelHooks {
  afterCreate?: (record: unknown) => unknown
  afterDelete?: (record: Record<string, unknown>) => unknown
  afterUpdate?: (record: unknown) => unknown
  beforeCreate?: (payload: Record<string, unknown>) => unknown
  beforeDelete?: (record: Record<string, unknown>) => unknown
  beforeUpdate?: (payload: Record<string, unknown>) => unknown
}

/**
 * Admin panel configuration. The optional `EntityTypes` generic maps an entity
 * name to its object type so the per-entity override components (and their
 * `value`/`onChange`) are fully typed against the generated OpenAPI types.
 */
interface AdminPanelConfig<
  EntityTypes extends Record<string, Record<string, unknown>> = Record<
    string,
    Record<string, unknown>
  >,
> {
  /** Per-entity overrides, keyed by the parsed entity name. */
  entities?: {
    [Key in keyof EntityTypes]?: AdminPanelEntityConfig<EntityTypes[Key]>
  }
  fields?: AdminPanelFieldConfig
  /** Objects per row for every entity (level 3, global). */
  gridColumns?: number
  hooks?: AdminPanelHooks
  /** Default sidebar menu customization (hidden entities + extra links). */
  menu?: AdminPanelMenuConfig
  /**
   * Structural realtime client injected by the host app. When present, the
   * admin list and detail subscribe to their `entity:<model>` /
   * `entity:<model>:<id>` rooms and reload/refetch on `changed`.
   */
  realtime?: AdminRealtimeClient
  /**
   * Resolves the realtime room identifier for an entity. The backend emits the
   * Django model label (`model._meta.label_lower`, e.g. `record.recordproject`)
   * while the admin derives names from the URL (`record-projects`), so the host
   * maps one to the other here. Defaults to `entity.entityName`.
   */
  realtimeEntityName?: AdminRealtimeEntityName
  /**
   * Reactive admin theme supplied by the host application. Accepts a plain
   * `"dark" | "light"` value, a ref/computed or a getter so the panel can
   * follow the app's color mode without the library depending on
   * `@nuxtjs/color-mode`.
   */
  theme?: AdminPanelThemeSource
  /** Whole-area component overrides (levels 2, 4, 5). */
  views?: AdminPanelViewsConfig
}

export type {
  AdminDetailComponentProperties,
  AdminDetailConfig,
  AdminFormConfig,
  AdminHeaderComponentProperties,
  AdminListComponentProperties,
  AdminListConfig,
  AdminPanelConfig,
  AdminPanelEntityConfig,
  AdminPanelFieldConfig,
  AdminPanelHooks,
  AdminPanelMenuConfig,
  AdminPanelMenuLink,
  AdminPanelViewsConfig,
  AdminSidebarComponentProperties,
  AdminSidebarGroup,
  FieldComponent,
  FieldComponentProperties,
  FieldComponentRegistry,
  FieldDescriptor,
  FieldGroupComponent,
  FieldGroupComponentProperties,
  FieldGroupOverride,
  FieldKind,
  FieldKindValueMap,
  FieldOverride,
  FieldOverrideNode,
  FieldValueOfKind,
  PartialFieldComponentRegistry,
}
