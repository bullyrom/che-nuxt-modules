import { computed, ref } from "vue"

import { mergeOpenApiDocuments } from "../stores/adminPanel/schemaMerge"
import {
  isOpenApiDocument,
  mergeAdminSpecs,
  normalizeAdminSpecs,
} from "../stores/adminPanel/specs"

import { useDetailApi } from "./api/useDetailApi"

import type {
  AdminOpenApiSpec,
  AdminRegisteredSpec,
  MyOpenAPIDocument,
  ParsedEntity,
} from "../stores/adminPanel/types"
import type { RequestStatus } from "../types"

/** Groups entities that expose a list endpoint by their path namespace. */
function groupsByNamespace(entities: readonly ParsedEntity[]) {
  const namespaceMap = new Map<string, ParsedEntity[]>()
  for (const entity of entities) {
    if (entity.listOperation) {
      const namespace = entity.namespace || ""
      const group = namespaceMap.get(namespace) ?? []
      group.push(entity)
      namespaceMap.set(namespace, group)
    }
  }
  return (
    [...namespaceMap.entries()]
      .map(([namespace, groupEntities]) => ({
        entities: groupEntities,
        namespace,
      }))
      // eslint-disable-next-line unicorn/no-array-sort -- the build targets ES2022
      .sort((first, second) => first.namespace.localeCompare(second.namespace))
  )
}

/**
 * Registry state for one or more OpenAPI specs: stores spec descriptors, loads
 * schemas from their `url`s, merges parsed entities and exposes the menu
 * groups. Called from the global admin store setup, so the schema request lives
 * in the store (the data composable rule).
 */
function useAdminPanelSpecs() {
  const specs = ref<AdminRegisteredSpec[]>([])
  const loadStatus = ref<Record<string, RequestStatus>>({})
  const loader = useDetailApi<MyOpenAPIDocument>()

  const loadedSpecs = computed(() =>
    specs.value.filter((spec) => spec.schema !== undefined),
  )
  const isMultiSpec = computed(() => loadedSpecs.value.length > 1)

  const mergeResult = computed(() => mergeAdminSpecs(loadedSpecs.value))
  const parsedEntities = computed(() => mergeResult.value.entities)
  const namespaces = computed(() => mergeResult.value.namespaces)
  const schema = computed(() =>
    mergeOpenApiDocuments(
      loadedSpecs.value.flatMap((spec) =>
        spec.schema === undefined ? [] : [spec.schema],
      ),
    ),
  )

  const filteredEntitiesByService = computed(() =>
    mergeResult.value.groups
      .map((group) => ({
        entities: group.entities.filter((entity) => entity.listOperation),
        namespace: group.namespace,
        service: group.service,
        title: group.title,
      }))
      .filter((group) => group.entities.length > 0),
  )

  const filteredEntitiesByNamespace = computed(() =>
    isMultiSpec.value
      ? filteredEntitiesByService.value
      : groupsByNamespace(parsedEntities.value),
  )

  const services = computed(() =>
    specs.value.map((spec) => ({
      hasSchema: spec.schema !== undefined,
      id: spec.id,
      label: spec.label,
    })),
  )

  /** Returns the schema of a service (or the first loaded schema). */
  function getSchema(service?: string): MyOpenAPIDocument | undefined {
    if (service === undefined) return schema.value
    return specs.value.find((candidate) => candidate.id === service)?.schema
  }

  /** Registers specs; a previously loaded schema survives a metadata update. */
  function setSpecs(input: readonly AdminOpenApiSpec[]) {
    const normalized = normalizeAdminSpecs(input)
    specs.value = normalized.map((spec) => {
      if (spec.schema !== undefined) return spec
      const previous = specs.value.find((item) => item.id === spec.id)
      return previous?.schema === undefined
        ? spec
        : { ...spec, schema: previous.schema }
    })
  }

  /** Registers a single schema using the single-spec compatibility contract. */
  function setSchema(
    schemaValue: MyOpenAPIDocument,
    options: string | { baseUrl?: string; id?: string; label?: string } = {},
  ) {
    const settings = typeof options === "string" ? { id: options } : options
    setSpecs([
      {
        baseUrl: settings.baseUrl,
        id: settings.id ?? "",
        label: settings.label,
        schema: schemaValue,
      },
    ])
  }

  /** Loads every spec that has a `url` and no inlined schema. */
  async function loadSpecs(input: readonly AdminOpenApiSpec[]) {
    const normalized = normalizeAdminSpecs(input)
    const statuses: Record<string, RequestStatus> = {}
    const results: AdminRegisteredSpec[] = []

    for (const spec of normalized) {
      let resolved = spec
      if (spec.schema !== undefined) {
        statuses[spec.id] = "success"
      } else if (spec.url) {
        // Specs load one by one so a slow schema does not block the others
        // from being reported individually.
        // eslint-disable-next-line no-await-in-loop
        await loader.fetchData({ url: spec.url })
        const loaded = loader.data.value
        const success =
          loader.fetchDataStatus.value === "success" &&
          isOpenApiDocument(loaded)
        statuses[spec.id] = success ? "success" : "error"
        resolved = success ? { ...spec, schema: loaded } : spec
      } else {
        statuses[spec.id] = "error"
      }
      results.push(resolved)
    }

    loadStatus.value = statuses
    specs.value = results
  }

  return {
    filteredEntitiesByNamespace,
    filteredEntitiesByService,
    getSchema,
    isMultiSpec,
    loadSpecs,
    loadStatus,
    namespaces,
    parsedEntities,
    schema,
    services,
    setSchema,
    setSpecs,
    specs,
  }
}

export { useAdminPanelSpecs }
