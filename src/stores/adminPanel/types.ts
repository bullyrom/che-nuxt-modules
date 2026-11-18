import type { OpenAPIV3 } from "openapi-types"

export interface MySecurityRequirement {
  basicAuth?: string[]
  cookieAuth?: string[]
}

export type MyOpenAPIDocument = Omit<OpenAPIV3.Document, "security"> & {
  security?: MySecurityRequirement[]
}

/**
 * Descriptor of one connected OpenAPI spec. `id` is the service namespace used
 * in every internal `service:entity` key; `url` is where the schema is loaded
 * from when `schema` is not inlined; `baseUrl` is the API origin used for the
 * spec's requests; `label` is the human-readable name shown in the menu.
 */
export interface AdminOpenApiSpec {
  baseUrl?: string
  id: string
  label?: string
  schema?: MyOpenAPIDocument
  url?: string
}

/** A spec descriptor after normalization (id/label are always present). */
export interface AdminRegisteredSpec {
  baseUrl?: string
  id: string
  label: string
  schema?: MyOpenAPIDocument
  url?: string
}

/** A menu group of entities belonging to one service/spec. */
export interface AdminSpecGroup {
  entities: ParsedEntity[]
  namespace: string
  service: string
  title: string
}

/** Result of merging every registered spec into one entity list. */
export interface AdminSpecMergeResult {
  entities: ParsedEntity[]
  groups: AdminSpecGroup[]
  namespaces: string[]
  specs: AdminRegisteredSpec[]
}

// Entity parsing types
export interface EntityOperation {
  fullPath: string
  method: string
  operation: OpenAPIV3.OperationObject
}

export interface EntityDetail {
  operations: EntityOperation[]
  paramName: string
  paramType: string
}

export interface EntityMethod {
  methodName: string
  operations: EntityOperation[]
}

export interface ParsedEntity {
  /** Entity base path inside its namespace (e.g. `/blog/categories/`). */
  basePath: string
  /** Base API origin of the spec that owns the entity. */
  baseUrl?: string
  /** Create operation (POST, when the entity supports it). */
  createOperation?: OpenAPIV3.OperationObject
  /** Detail operations (paths with a lookup parameter). */
  details: EntityDetail[]
  /** Entity name (e.g. `categories`). */
  entityName: string
  /** Full path including the namespace (e.g. `/api/v1/blog/categories/`). */
  fullBasePath: string
  /** Internal entity key, `service:entity` for registered specs. */
  key?: string
  /** Human-readable spec label used by menus. */
  label?: string
  /** List operation (GET). */
  listOperation?: OpenAPIV3.OperationObject
  /** Extra methods nested under a detail path. */
  methods: EntityMethod[]
  /** Namespace inside the spec (e.g. `blog`). */
  namespace: string
  /** Registered spec id (the service part of the internal key). */
  service?: string
}

// Parsing helper types
export interface EntityPathOperation {
  method: string
  operation: OpenAPIV3.OperationObject
}

export interface EntityDetailPath {
  operations: EntityPathOperation[]
  paramName: string
  path: string
}

export interface EntityMethodPath {
  methodName: string
  operations: EntityPathOperation[]
  paramName: string
  path: string
}

export interface EntityMapData {
  basePath: string
  createOperation?: OpenAPIV3.OperationObject
  createResponse?: OpenAPIV3.ResponseObject
  detailPaths: EntityDetailPath[]
  entityName: string
  fullBasePath: string
  listOperation?: OpenAPIV3.OperationObject
  listResponse?: OpenAPIV3.ResponseObject
  methodPaths: EntityMethodPath[]
  namespace: string
  version?: string
}
/** A parsed OpenAPI path. */
export interface ParsedPath {
  entityName: string
  methodName: null | string
  namespace: string
  paramName: null | string
  path: string
  pathType: "detail" | "list" | "method"
  segments: string[]
}
