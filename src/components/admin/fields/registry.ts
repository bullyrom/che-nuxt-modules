import EnumField from "./defaultComponents/EnumField.vue"
import { DEFAULT_FIELD_COMPONENTS, TextareaField } from "./defaults"

import type {
  FieldComponent,
  FieldDescriptor,
  FieldKind,
  FieldOverride,
  FieldOverrideNode,
  PartialFieldComponentRegistry,
} from "./types"
import type { OpenAPIV3 } from "openapi-types"
import type { InjectionKey } from "vue"

const MAX_FIELD_DEPTH = 6

type SchemaOrReference = OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject

type SchemaDocument = Record<string, SchemaOrReference>

export interface FieldRenderContext {
  components?: PartialFieldComponentRegistry
  overrides?: Record<string, FieldOverrideNode>
}

export const FIELD_RENDER_CONTEXT: InjectionKey<FieldRenderContext> = Symbol(
  "che-field-render-context",
)

function normalizeKind(schema: OpenAPIV3.SchemaObject): FieldKind {
  if (schema.type === "array") return "array"
  if (schema.type === "boolean") return "boolean"
  if (schema.type === "integer") return "integer"
  if (schema.type === "number") return "number"
  if (schema.type === "object" || schema.properties !== undefined)
    return "object"
  return "string"
}

function resolveSchemaObject(
  schema: SchemaOrReference | undefined,
  schemas: SchemaDocument | undefined,
): OpenAPIV3.SchemaObject | undefined {
  const seen = new Set<string>()
  let current: SchemaOrReference | undefined = schema
  while (current && "$ref" in current) {
    const referenceName = current.$ref.split("/").at(-1)
    if (!referenceName || seen.has(referenceName)) return undefined
    seen.add(referenceName)
    current = schemas?.[referenceName]
  }
  return current
}

function buildDescriptorsFromObject(
  schema: OpenAPIV3.SchemaObject | undefined,
  schemas: SchemaDocument | undefined,
  depth: number,
): FieldDescriptor[] {
  if (!schema?.properties || depth > MAX_FIELD_DEPTH) return []

  const requiredKeys = new Set(schema.required)

  return Object.entries(schema.properties).flatMap(
    ([key, propertySchema]): FieldDescriptor[] => {
      const schemaObject = resolveSchemaObject(propertySchema, schemas)
      if (!schemaObject || schemaObject.readOnly === true) return []

      const kind = normalizeKind(schemaObject)
      const descriptor: FieldDescriptor = {
        description: schemaObject.description,
        format: schemaObject.format,
        key,
        kind,
        multiline:
          kind === "string" &&
          (key === "description" || schemaObject.format === "textarea"),
        readOnly: schemaObject.readOnly === true,
        required: requiredKeys.has(key),
        schema: schemaObject,
      }

      if (kind === "object") {
        descriptor.children = buildDescriptorsFromObject(
          schemaObject,
          schemas,
          depth + 1,
        )
      }

      return [descriptor]
    },
  )
}

export function buildFieldDescriptors(
  schema: SchemaOrReference | undefined,
  schemas?: SchemaDocument,
): FieldDescriptor[] {
  return buildDescriptorsFromObject(
    resolveSchemaObject(schema, schemas),
    schemas,
    0,
  )
}

export function buildBlankValue(field: FieldDescriptor): unknown {
  if (field.kind === "array") return []
  if (field.kind === "boolean") return false
  if (field.kind === "object") return buildBlankRecord(field.children ?? [])
  if (field.kind === "string") return ""
  return undefined
}

export function buildBlankRecord(
  descriptors: FieldDescriptor[],
): Record<string, unknown> {
  const blank: Record<string, unknown> = {}
  for (const descriptor of descriptors) {
    blank[descriptor.key] = buildBlankValue(descriptor)
  }
  return blank
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function serializeValue(
  value: unknown,
  field: FieldDescriptor,
): unknown {
  switch (field.kind) {
    case "array": {
      return Array.isArray(value) ? value : []
    }
    case "boolean": {
      return Boolean(value)
    }
    case "object": {
      return isRecord(value)
        ? serializeRecord(value, field.children ?? [])
        : buildBlankValue(field)
    }
    case "string": {
      return typeof value === "string" ? value : ""
    }
    default: {
      return typeof value === "number" ? value : undefined
    }
  }
}

export function serializeRecord(
  record: Record<string, unknown>,
  descriptors: FieldDescriptor[],
): Record<string, unknown> {
  const result = buildBlankRecord(descriptors)
  for (const field of descriptors) {
    const value = record[field.key]
    if (value !== undefined && value !== null) {
      result[field.key] = serializeValue(value, field)
    }
  }
  return result
}

export function isFieldOverride(
  node: FieldOverrideNode | undefined,
): node is FieldOverride {
  return node !== undefined && "kind" in node && "component" in node
}

export function resolveFieldComponent(
  field: FieldDescriptor,
  options: {
    components?: PartialFieldComponentRegistry
    override?: FieldOverride
  } = {},
): FieldComponent<unknown> {
  if (options.override) {
    return options.override.component as FieldComponent<unknown>
  }

  const customComponent = options.components?.[field.kind]
  if (customComponent) return customComponent as FieldComponent<unknown>

  if (field.schema?.enum && field.schema.enum.length > 0) {
    return EnumField as FieldComponent<unknown>
  }

  if (field.kind === "string" && field.multiline) {
    return TextareaField as FieldComponent<unknown>
  }

  return DEFAULT_FIELD_COMPONENTS[field.kind] as FieldComponent<unknown>
}
