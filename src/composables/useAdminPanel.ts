import { computed, ref } from "vue"

import {
  getEntityOperationTypes,
  getRequestSchema,
  getSchemaNameFromRef as getSchemaNameFromReference,
  isReferenceObject,
} from "../stores/adminPanel/apiTypes"
import { parseEntities } from "../stores/adminPanel/parser"
import { extractListQueryParameters } from "../stores/adminPanel/queryParameters"

import type { EntityOperationTypes } from "../stores/adminPanel/apiTypes"
import type { ListQueryParameters } from "../stores/adminPanel/queryParameters"
import type {
  MyOpenAPIDocument,
  ParsedEntity,
} from "../stores/adminPanel/types"
import type { OpenAPIV3 } from "openapi-types"

const emptyParseResult = {
  entities: [] as ParsedEntity[],
  namespaces: [] as string[],
}

export function useAdminPanel() {
  const schema = ref<MyOpenAPIDocument>()
  const activeEntity = ref<ParsedEntity>()

  function setSchema(schemaValue: MyOpenAPIDocument) {
    schema.value = schemaValue
  }

  const showListModal = computed(() => activeEntity.value !== undefined)

  const parsedData = computed(() => {
    if (!schema.value) return emptyParseResult
    return parseEntities(schema.value)
  })

  const parsedEntities = computed(() => parsedData.value.entities)
  const namespaces = computed(() => parsedData.value.namespaces)

  // Getter for grouping entities by namespace, filtering only those with listOperation
  const filteredEntitiesByNamespace = computed(() => {
    const grouped: { entities: ParsedEntity[]; namespace: string }[] = []

    // Create a Map for grouping
    const namespaceMap = new Map<string, ParsedEntity[]>()

    for (const entity of parsedEntities.value) {
      // Filter only entities with listOperation
      if (entity.listOperation) {
        const namespace = entity.namespace || ""
        if (!namespaceMap.has(namespace)) {
          namespaceMap.set(namespace, [])
        }
        const entitiesForNamespace = namespaceMap.get(namespace)
        if (entitiesForNamespace) {
          entitiesForNamespace.push(entity)
        }
      }
    }

    // Convert the Map to an array of objects
    for (const [namespace, entities] of namespaceMap.entries()) {
      grouped.push({
        entities,
        namespace,
      })
    }

    // Sort by namespace name
    return grouped.toSorted((namespaceA, namespaceB) =>
      namespaceA.namespace.localeCompare(namespaceB.namespace),
    )
  })

  // Getter for active entity operation types
  const activeEntityOperationTypes = computed<EntityOperationTypes>(() => {
    if (!activeEntity.value) return {}
    return getEntityOperationTypes(activeEntity.value)
  })

  // Getter for the list endpoint query parameters (filters + sorting)
  const activeEntityListQueryParameters = computed<ListQueryParameters>(() => {
    if (!schema.value) return { filters: [], sorts: [] }
    return extractListQueryParameters(
      activeEntity.value?.listOperation,
      schema.value,
    )
  })

  // Function for resolving schema references
  function resolveSchema(
    schemaObject:
      | OpenAPIV3.ReferenceObject
      | OpenAPIV3.SchemaObject
      | undefined,
  ) {
    if (!schemaObject || !schema.value) return undefined

    if (isReferenceObject(schemaObject)) {
      const schemaName = getSchemaNameFromReference(schemaObject)
      if (!schemaName) return undefined

      const { components } = schema.value
      if (components?.schemas && schemaName in components.schemas) {
        return components.schemas[schemaName]
      }
      return undefined
    }

    return schemaObject
  }

  // Getter for active entity list response schema
  const activeEntityListSchema = computed(() => {
    return resolveSchema(activeEntityOperationTypes.value.listResponse)
  })

  // Checks whether the list response is paginated (django-style)
  const isActiveEntityListPaginated = computed(() => {
    const listSchema = activeEntityListSchema.value
    if (!listSchema || !("properties" in listSchema)) return false
    const { properties } = listSchema
    if (!properties || typeof properties !== "object") return false
    const keys = Object.keys(properties)
    return (
      keys.includes("count") &&
      keys.includes("next") &&
      keys.includes("previous") &&
      keys.includes("results")
    )
  })

  // Getter for active entity detail response schema
  const activeEntityDetailSchema = computed(() => {
    return resolveSchema(activeEntityOperationTypes.value.detailResponse)
  })

  // Getter for active entity update response schema
  const activeEntityUpdateSchema = computed(() => {
    return resolveSchema(activeEntityOperationTypes.value.updateResponse)
  })

  // Getter for active entity delete response schema
  const activeEntityDeleteSchema = computed(() => {
    return resolveSchema(activeEntityOperationTypes.value.deleteResponse)
  })

  // Getter for active entity create request body schema
  const activeEntityCreateSchema = computed(() => {
    if (!activeEntity.value?.createOperation) return undefined
    const requestSchema = getRequestSchema(activeEntity.value.createOperation)
    return resolveSchema(requestSchema)
  })

  // Getter for extracting schema name from a reference
  // eslint-disable-next-line unicorn/consistent-function-scoping
  function getSchemaName(
    schemaObject:
      | OpenAPIV3.ReferenceObject
      | OpenAPIV3.SchemaObject
      | undefined,
  ): string | undefined {
    if (!schemaObject) return undefined
    if (isReferenceObject(schemaObject)) {
      return getSchemaNameFromReference(schemaObject)
    }
    return undefined
  }

  // Getter for active entity list response schema name
  const activeEntityListSchemaName = computed(() => {
    return getSchemaName(activeEntityOperationTypes.value.listResponse)
  })

  function clearEntity() {
    activeEntity.value = undefined
  }

  function closeModal() {
    activeEntity.value = undefined
  }

  return {
    activeEntity,
    activeEntityCreateSchema,
    activeEntityDeleteSchema,
    activeEntityDetailSchema,
    activeEntityListQueryParameters,
    activeEntityListSchema,
    activeEntityListSchemaName,
    activeEntityOperationTypes,
    activeEntityUpdateSchema,
    clearEntity,
    closeModal,
    filteredEntitiesByNamespace,
    getSchemaName,
    isActiveEntityListPaginated,
    namespaces,
    parsedEntities,
    resolveSchema,
    schema,
    setSchema,
    showListModal,
  }
}
