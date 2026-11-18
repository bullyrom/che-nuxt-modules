import { adminEntityKey, getAdminEntityKey } from "./specs"

import type { ParsedEntity } from "./types"

/** How entity labels are rendered in menus. */
type AdminEntityLabelMode = "auto" | "name" | "prefix" | boolean

/** Why an entity reference could not be resolved. */
type AdminEntityResolutionCode = "ambiguous" | "not-found"

/**
 * Raised when a public entity reference is unknown or ambiguous across the
 * connected specs. `variants` lists the full keys the caller can use instead.
 */
class AdminEntityResolutionError extends Error {
  readonly code: AdminEntityResolutionCode

  readonly reference: string

  readonly variants: string[]

  constructor(
    reference: string,
    code: AdminEntityResolutionCode,
    variants: string[],
  ) {
    super(
      code === "ambiguous"
        ? `Entity reference "${reference}" is ambiguous across OpenAPI specs. Use one of: ${variants.join(", ")}`
        : `Entity reference "${reference}" was not found. Available entities: ${variants.join(", ")}`,
    )
    this.name = "AdminEntityResolutionError"
    this.code = code
    this.reference = reference
    this.variants = variants
  }
}

/** Returns the full `service:entity` key of a parsed entity. */
function entityReference(entity: ParsedEntity): string {
  return getAdminEntityKey(entity)
}

/** Lists every full key, used in error messages. */
function entityReferences(entities: readonly ParsedEntity[]): string[] {
  // eslint-disable-next-line unicorn/no-array-sort -- the build targets ES2022
  return [...new Set(entities.map((entity) => entityReference(entity)))].sort()
}

/** Compatibility aliases for hosts that call the key builder directly. */
const buildEntityKey = adminEntityKey
const createEntityKey = adminEntityKey
const entityKey = adminEntityKey

/**
 * Resolves a public entity reference: a full `service:entity` key always wins;
 * a bare name resolves only when it is unique across all connected specs.
 * Throws `AdminEntityResolutionError` with the available variants otherwise.
 */
function resolveAdminEntity(
  entities: readonly ParsedEntity[],
  reference: string,
): ParsedEntity {
  const exact = entities.find(
    (entity) =>
      entityReference(entity) === reference ||
      (entity.service !== undefined &&
        adminEntityKey(entity.service, entity.entityName) === reference),
  )
  if (exact !== undefined) return exact

  const matches = entities.filter((entity) => entity.entityName === reference)
  if (matches.length === 1) return matches[0] as ParsedEntity

  const variants = entityReferences(matches.length > 0 ? matches : entities)
  throw new AdminEntityResolutionError(
    reference,
    matches.length > 1 ? "ambiguous" : "not-found",
    variants,
  )
}

/** Like `resolveAdminEntity`, but returns `undefined` instead of throwing. */
function tryResolveAdminEntity(
  entities: readonly ParsedEntity[],
  reference: string | undefined,
): ParsedEntity | undefined {
  if (reference === undefined) return undefined
  try {
    return resolveAdminEntity(entities, reference)
  } catch {
    return undefined
  }
}

/** Reports whether two entities belong to the same service. */
function sameService(entity: ParsedEntity, other: ParsedEntity): boolean {
  return (entity.service ?? "") === (other.service ?? "")
}

/** True when another spec declares the same short entity name. */
function hasEntityNameConflict(
  entity: ParsedEntity,
  entities: readonly ParsedEntity[],
): boolean {
  return entities.some(
    (other) =>
      other !== entity &&
      other.entityName === entity.entityName &&
      !sameService(entity, other),
  )
}

/**
 * Resolves the label shown in menus. Short names stay unprefixed when they are
 * unique; a conflicting name or an explicit `prefix` mode gets `service:name`.
 */
function entityDisplayLabel(
  entity: ParsedEntity,
  entities: readonly ParsedEntity[],
  mode: AdminEntityLabelMode = "auto",
): string {
  if (mode === "name" || mode === false) return entity.entityName
  const prefix =
    mode === "prefix" ||
    mode === true ||
    (mode === "auto" && hasEntityNameConflict(entity, entities))
  return prefix && entity.service
    ? adminEntityKey(entity.service, entity.entityName)
    : entity.entityName
}

/** Compatibility alias: an entity label is resolved through the same helper. */
const getAdminEntityLabel = entityDisplayLabel
const adminEntityLabel = entityDisplayLabel

/**
 * Matches a config/menu reference against an entity. Supports the full key,
 * the short name, the full path, and the legacy `service:name` spelling.
 */
function entityMatchesReference(
  entity: ParsedEntity,
  reference: string,
): boolean {
  return (
    entity.entityName === reference ||
    entity.fullBasePath === reference ||
    entityReference(entity) === reference ||
    (entity.service !== undefined &&
      adminEntityKey(entity.service, entity.entityName) === reference)
  )
}

/** Compatibility alias used by menu filtering code. */
const resolveEntityReference = resolveAdminEntity

export {
  adminEntityLabel,
  AdminEntityResolutionError,
  buildEntityKey,
  createEntityKey,
  entityDisplayLabel,
  entityKey,
  entityMatchesReference,
  entityReference,
  getAdminEntityLabel,
  hasEntityNameConflict,
  resolveAdminEntity,
  resolveAdminEntity as resolveAdminEntityReference,
  resolveEntityReference,
  tryResolveAdminEntity,
}
export type { AdminEntityLabelMode, AdminEntityResolutionCode }
