import type { OpenAPIV3 } from "openapi-types"
import type { Component } from "vue"

export type FieldKind =
  | "array"
  | "boolean"
  | "integer"
  | "number"
  | "object"
  | "string"

export interface FieldKindValueMap {
  array: unknown[]
  boolean: boolean
  integer: number | undefined
  number: number | undefined
  object: Record<string, unknown>
  string: string
}

export type FieldValueOfKind<Kind extends FieldKind> = FieldKindValueMap[Kind]

export interface FieldDescriptor {
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

export interface FieldComponentProperties<Value = unknown> {
  field?: FieldDescriptor
  modelValue: Value
  "onUpdate:modelValue"?: (value: Value) => void
}

export type FieldComponent<Value = unknown> = Component<
  FieldComponentProperties<Value>
>

export interface FieldComponentRegistry {
  array: FieldComponent<unknown[]>
  boolean: FieldComponent<boolean>
  integer: FieldComponent<number | undefined>
  number: FieldComponent<number | undefined>
  object: FieldComponent<Record<string, unknown>>
  string: FieldComponent<string>
}

export type PartialFieldComponentRegistry = Partial<FieldComponentRegistry>

export type FieldOverride =
  | { component: FieldComponent<boolean>; kind: "boolean" }
  | { component: FieldComponent<number | undefined>; kind: "integer" }
  | { component: FieldComponent<number | undefined>; kind: "number" }
  | { component: FieldComponent<Record<string, unknown>>; kind: "object" }
  | { component: FieldComponent<string>; kind: "string" }
  | { component: FieldComponent<unknown[]>; kind: "array" }

export type FieldOverrideNode =
  | FieldOverride
  | { [nestedKey: string]: FieldOverrideNode }

export interface AdminPanelFieldConfig {
  defaultComponents?: PartialFieldComponentRegistry
  overrides?: Record<string, Record<string, FieldOverrideNode>>
}

export interface AdminPanelHooks {
  afterCreate?: (record: unknown) => unknown
  afterDelete?: (record: Record<string, unknown>) => unknown
  afterUpdate?: (record: unknown) => unknown
  beforeCreate?: (payload: Record<string, unknown>) => unknown
  beforeDelete?: (record: Record<string, unknown>) => unknown
  beforeUpdate?: (payload: Record<string, unknown>) => unknown
}

export interface AdminPanelConfig {
  fields?: AdminPanelFieldConfig
  hooks?: AdminPanelHooks
}
