import type { ParsedEntity } from "../../stores/adminPanel/types"

/**
 * Substitutes every `{parameter}` segment of an OpenAPI path with the given
 * lookup value, e.g. `/items/{pk}/` -> `/items/42/`.
 */
function substitutePathParameters(path: string, value: string): string {
  return path
    .split("/")
    .map((segment) =>
      segment.startsWith("{") && segment.endsWith("}") ? value : segment,
    )
    .join("/")
}

/**
 * Returns true when the entity exposes a GET detail endpoint, i.e. a single
 * record can be fetched by its lookup value.
 */
function hasEntityDetailEndpoint(entity: ParsedEntity | undefined): boolean {
  return Boolean(
    entity?.details.some((detail) =>
      detail.operations.some((operation) => operation.method === "get"),
    ),
  )
}

/**
 * Builds the absolute URL of a single record. It prefers the GET detail path
 * declared in the OpenAPI schema (so the lookup parameter name, e.g. `pk` or
 * `slug`, is respected) and falls back to `${fullBasePath}${id}/`.
 */
function buildEntityDetailUrl(
  baseUrl: string,
  entity: ParsedEntity | undefined,
  id: string,
): string | undefined {
  if (!entity) return undefined

  for (const detail of entity.details) {
    const getOperation = detail.operations.find(
      (operation) => operation.method === "get",
    )
    if (getOperation) {
      return `${baseUrl}${substitutePathParameters(getOperation.fullPath, id)}`
    }
  }

  return `${baseUrl}${entity.fullBasePath}${id}/`
}

export { buildEntityDetailUrl, hasEntityDetailEndpoint }
