import { parseEntities } from "./parser"

import type {
  AdminOpenApiSpec,
  AdminRegisteredSpec,
  AdminSpecMergeResult,
  MyOpenAPIDocument,
  ParsedEntity,
} from "./types"

const DEFAULT_ADMIN_SPEC_ID = "default"

function specLabel(spec: AdminOpenApiSpec): string {
  const label = spec.label?.trim()
  return label && label.length > 0 ? label : spec.id
}

function specId(spec: AdminOpenApiSpec, index: number, total: number): string {
  const id = spec.id?.trim()
  if (id && id.length > 0) return id
  if (total === 1) return DEFAULT_ADMIN_SPEC_ID
  return `spec-${index + 1}`
}

/**
 * Normalizes spec descriptors, fills default ids/labels and rejects duplicate
 * service ids (the id is the namespace of every internal entity key).
 */
function normalizeAdminSpecs(
  specs: readonly AdminOpenApiSpec[],
): AdminRegisteredSpec[] {
  const usedIds = new Set<string>()
  return specs.map((spec, index) => {
    const id = specId(spec, index, specs.length)
    if (usedIds.has(id)) {
      throw new Error(`Duplicate admin OpenAPI spec id: ${id}`)
    }
    usedIds.add(id)
    return {
      baseUrl: spec.baseUrl,
      id,
      label: specLabel({ ...spec, id }),
      schema: spec.schema,
      url: spec.url,
    }
  })
}

/** Builds the internal `service:entity` key (or the bare name without a service). */
function adminEntityKey(
  service: string | undefined,
  entityName: string,
): string {
  return service ? `${service}:${entityName}` : entityName
}

/** Returns the internal key of a parsed entity. */
function getAdminEntityKey(entity: ParsedEntity): string {
  return entity.key ?? adminEntityKey(entity.service, entity.entityName)
}

/** Adds the owning spec metadata to a parsed entity. */
function annotateEntity(
  entity: ParsedEntity,
  spec: AdminRegisteredSpec,
): ParsedEntity {
  return {
    ...entity,
    baseUrl: spec.baseUrl,
    key: adminEntityKey(spec.id, entity.entityName),
    label: spec.label,
    service: spec.id,
  }
}

/** Parses every registered spec, merges entities and keeps spec groups. */
function mergeAdminSpecs(
  specs: readonly AdminOpenApiSpec[],
): AdminSpecMergeResult {
  const registered = normalizeAdminSpecs(specs)
  const entities: ParsedEntity[] = []
  const namespaces = new Set<string>()
  const groups = registered.map((spec) => {
    const parsed = spec.schema ? parseEntities(spec.schema) : undefined
    for (const namespace of parsed?.namespaces ?? []) {
      namespaces.add(namespace)
    }
    const specEntities = (parsed?.entities ?? []).map((entity) =>
      annotateEntity(entity, spec),
    )
    entities.push(...specEntities)
    return {
      entities: specEntities,
      namespace: spec.id,
      service: spec.id,
      title: spec.label,
    }
  })

  return {
    entities,
    groups,
    // eslint-disable-next-line unicorn/no-array-sort -- the build targets ES2022
    namespaces: [...namespaces].sort(),
    specs: registered,
  }
}

/** True when the value looks like an OpenAPI document. */
function isOpenApiDocument(value: unknown): value is MyOpenAPIDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    "paths" in value &&
    typeof (value as MyOpenAPIDocument).paths === "object"
  )
}

export {
  adminEntityKey,
  DEFAULT_ADMIN_SPEC_ID,
  getAdminEntityKey,
  isOpenApiDocument,
  mergeAdminSpecs,
  normalizeAdminSpecs,
}
