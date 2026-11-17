import { computed, ref } from "vue"

import {
  getEntityOperationTypes,
  getRequestSchema,
  getSchemaNameFromRef as getSchemaNameFromReference,
  isReferenceObject,
} from "../stores/adminPanel/apiTypes"
import { isPaginatedListSchema } from "../stores/adminPanel/pagination"
import { extractListQueryParameters } from "../stores/adminPanel/queryParameters"

import { useAdminPanelSpecs } from "./useAdminPanelSpecs"

import type { EntityOperationTypes } from "../stores/adminPanel/apiTypes"
import type { ListQueryParameters } from "../stores/adminPanel/queryParameters"
import type {
  MyOpenAPIDocument,
  ParsedEntity,
} from "../stores/adminPanel/types"
import type { OpenAPIV3 } from "openapi-types"

export function useAdminPanel() {
  const specRegistry = useAdminPanelSpecs()
  const activeEntity = ref<ParsedEntity>()
  const baseUrl = ref<string>()

  const {
    filteredEntitiesByNamespace,
    filteredEntitiesByService,
    getSchema,
    isMultiSpec,
    loadSpecs,
    loadStatus: specLoadStatus,
    namespaces,
    parsedEntities,
    schema,
    services,
    setSchema: setSpecSchema,
    setSpecs,
    specs,
  } = specRegistry

  function setSchema(
    schemaValue: MyOpenAPIDocument,
    options?: string | { baseUrl?: string; id?: string; label?: string },
  ) {
    setSpecSchema(schemaValue, options)
  }

  function setBaseUrl(value: string | undefined) {
    baseUrl.value = value
  }

  const showListModal = computed(() => activeEntity.value !== undefined)

  // Getter for active entity operation types
  const activeEntityOperationTypes = computed<EntityOperationTypes>(() => {
    if (!activeEntity.value) return {}
    return getEntityOperationTypes(activeEntity.value)
  })

  // Getter for the list endpoint query parameters (filters + sorting)
  const activeEntityListQueryParameters = computed<ListQueryParameters>(() => {
    const entitySchema = getSchema(activeEntity.value?.service)
    if (!entitySchema) return { filters: [], sorts: [] }
    return extractListQueryParameters(
      activeEntity.value?.listOperation,
      entitySchema,
    )
  })

  // Function for resolving schema references
  function resolveSchema(
    schemaObject:
      | OpenAPIV3.ReferenceObject
      | OpenAPIV3.SchemaObject
      | undefined,
    entity: ParsedEntity | undefined = activeEntity.value,
  ) {
    const entitySchema = getSchema(entity?.service)
    if (!schemaObject || !entitySchema) return undefined

    if (isReferenceObject(schemaObject)) {
      const schemaName = getSchemaNameFromReference(schemaObject)
      if (!schemaName) return undefined

      const { components } = entitySchema
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
  const isActiveEntityListPaginated = computed(() =>
    isPaginatedListSchema(activeEntityListSchema.value),
  )

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
    baseUrl,
    clearEntity,
    closeModal,
    filteredEntitiesByNamespace,
    filteredEntitiesByService,
    getSchemaName,
    getSpecSchema: getSchema,
    isActiveEntityListPaginated,
    isMultiSpec,
    loadSpecs,
    namespaces,
    parsedEntities,
    resolveSchema,
    schema,
    services,
    setBaseUrl,
    setSchema,
    setSpecs,
    showListModal,
    specLoadStatus,
    specs,
  }
}
