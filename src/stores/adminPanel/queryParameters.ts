import { buildFieldDescriptors } from "../../components/admin/fields/registry"

import { isReferenceObject } from "./apiTypes"

import type { MyOpenAPIDocument } from "./types"
import type { FieldDescriptor } from "../../components/admin/fields/types"
import type { OpenAPIV3 } from "openapi-types"

/**
 * Query parameters are split into two visual groups. Sorting is not a special
 * feature — it is an ordinary query parameter whose name matches this pattern
 * and is rendered under its own heading.
 */
const SORT_PARAMETER_PATTERN = /^(?:order|sort)/iv

const FALLBACK_QUERY_SCHEMA: OpenAPIV3.SchemaObject = { type: "string" }

interface ListQueryParameters {
  filters: FieldDescriptor[]
  sorts: FieldDescriptor[]
}

/**
 * Resolves a parameter that may be an inline object or a `$ref` into
 * `components.parameters`.
 */
function resolveParameterObject(
  parameter: OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject,
  document: MyOpenAPIDocument,
): OpenAPIV3.ParameterObject | undefined {
  if (!isReferenceObject(parameter)) return parameter

  const parameterName = parameter.$ref.split("/").at(-1)
  if (!parameterName) return undefined

  const resolved = document.components?.parameters?.[parameterName]
  if (!resolved || isReferenceObject(resolved)) return undefined

  return resolved
}

/**
 * Extracts `in: query` parameters from a list operation, resolving references
 * and dropping non-query parameters (`header`, `path`, `cookie`).
 */
function extractQueryParameters(
  operation: OpenAPIV3.OperationObject | undefined,
  document: MyOpenAPIDocument,
): OpenAPIV3.ParameterObject[] {
  const rawParameters = operation?.parameters ?? []

  return rawParameters
    .map((parameter) => resolveParameterObject(parameter, document))
    .filter(
      (parameter): parameter is OpenAPIV3.ParameterObject =>
        parameter !== undefined && parameter.in === "query",
    )
}

/**
 * Builds schema-typed field descriptors for query parameters by reusing the
 * regular field-descriptor builder over a synthetic object schema.
 */
function buildDescriptorByKey(
  parameters: OpenAPIV3.ParameterObject[],
  document: MyOpenAPIDocument,
): Map<string, FieldDescriptor> {
  if (parameters.length === 0) return new Map()

  const properties: Record<
    string,
    OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
  > = {}
  for (const parameter of parameters) {
    properties[parameter.name] = parameter.schema ?? FALLBACK_QUERY_SCHEMA
  }

  const required = parameters
    .filter((parameter) => parameter.required)
    .map((parameter) => parameter.name)

  const syntheticSchema: OpenAPIV3.SchemaObject = {
    properties,
    required,
    type: "object",
  }

  const descriptors = buildFieldDescriptors(
    syntheticSchema,
    document.components?.schemas,
  )

  return new Map(descriptors.map((descriptor) => [descriptor.key, descriptor]))
}

/**
 * Splits the list-endpoint query parameters into filter and sort groups, each
 * descriptor typed from the OpenAPI schema (enum, number, boolean, string).
 */
function extractListQueryParameters(
  operation: OpenAPIV3.OperationObject | undefined,
  document: MyOpenAPIDocument,
): ListQueryParameters {
  const parameters = extractQueryParameters(operation, document)
  const descriptorByKey = buildDescriptorByKey(parameters, document)

  const filters: FieldDescriptor[] = []
  const sorts: FieldDescriptor[] = []

  for (const parameter of parameters) {
    const descriptor = descriptorByKey.get(parameter.name)
    if (descriptor) {
      const enriched: FieldDescriptor = {
        ...descriptor,
        description: parameter.description ?? descriptor.description,
      }

      if (SORT_PARAMETER_PATTERN.test(parameter.name)) {
        sorts.push(enriched)
      } else {
        filters.push(enriched)
      }
    }
  }

  return { filters, sorts }
}

/**
 * Checks whether a query parameter (filter or sort) with the given name is
 * declared by the endpoint.
 */
function hasQueryParameter(
  parameters: ListQueryParameters,
  name: string,
): boolean {
  return [...parameters.filters, ...parameters.sorts].some(
    (parameter) => parameter.key === name,
  )
}

/**
 * Drops empty values so they are not sent to the backend, and joins array
 * parameters into a comma-separated string.
 */
function buildQueryValues(
  values: Record<string, unknown>,
): Record<string, unknown> {
  const query: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(values)) {
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)

    if (!isEmpty) {
      query[key] = Array.isArray(value) ? value.join(",") : value
    }
  }

  return query
}

export type { ListQueryParameters }
export {
  buildQueryValues,
  extractListQueryParameters,
  hasQueryParameter,
  SORT_PARAMETER_PATTERN,
}
