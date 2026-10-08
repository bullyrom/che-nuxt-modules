import type { AdminPanelTheme } from "../theme"
import type { OpenAPIV3 } from "openapi-types"
import type { Component, MaybeRef } from "vue"

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

interface AdminPanelConfig {
  fields?: AdminPanelFieldConfig
  hooks?: AdminPanelHooks
  /**
   * Reactive admin theme supplied by the host application. Accepts a plain
   * `"dark" | "light"` value or a ref/computed so the panel can follow the
   * app's color mode without the library depending on `@nuxtjs/color-mode`.
   */
  theme?: MaybeRef<AdminPanelTheme>
}

export type {
  AdminPanelConfig,
  AdminPanelFieldConfig,
  AdminPanelHooks,
  FieldComponent,
  FieldComponentProperties,
  FieldComponentRegistry,
  FieldDescriptor,
  FieldKind,
  FieldKindValueMap,
  FieldOverride,
  FieldOverrideNode,
  FieldValueOfKind,
  PartialFieldComponentRegistry,
}
