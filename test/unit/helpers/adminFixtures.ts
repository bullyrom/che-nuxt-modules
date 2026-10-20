/* eslint-disable perfectionist/sort-objects, perfectionist/sort-union-types */
import { vi } from "vitest"

import type { MyOpenAPIDocument, ParsedEntity } from "../../../src/index"
import type { OpenAPIV3 } from "openapi-types"

const CREATED_AT = "2024-03-05T08:30:00.000Z"
const ID_PATH_OFFSET = 2

const RECORDS: Record<string, unknown>[] = [
  {
    cover: "https://cdn.test/one.png",
    created_at: CREATED_AT,
    id: 1,
    meta: { note: "first-meta" },
    name: "Alpha",
    published: "2024-03-05",
    status: "active",
    tags: ["one"],
    title: "First record",
  },
  {
    cover: "https://cdn.test/two.png",
    created_at: "2024-04-06T09:45:00.000Z",
    id: 2,
    meta: { note: "second-meta" },
    name: "Beta",
    published: "2024-04-06",
    status: "inactive",
    tags: ["two"],
    title: "Second record",
  },
]

function recordSchema(withId: boolean): OpenAPIV3.SchemaObject {
  return {
    properties: {
      ...(withId ? { id: { readOnly: true, type: "integer" } } : {}),
      name: { type: "string" },
      title: { type: "string" },
      meta: {
        properties: { note: { type: "string" } },
        type: "object",
      },
      tags: { items: { type: "string" }, type: "array" },
      cover: { format: "image", type: "string" },
      published: { format: "date", type: "string" },
      created_at: { format: "date-time", type: "string" },
      status: { enum: ["active", "inactive"], type: "string" },
    },
    required: ["name"],
    type: "object",
  }
}

function jsonResponse(
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
): OpenAPIV3.ResponseObject {
  return {
    content: { "application/json": { schema } },
    description: "ok",
  }
}

function listOperation(): OpenAPIV3.OperationObject {
  return {
    parameters: [
      { in: "query", name: "search", schema: { type: "string" } },
      { in: "query", name: "status", schema: { type: "string" } },
    ],
    responses: {
      "200": jsonResponse({
        properties: {
          count: { type: "integer" },
          next: { nullable: true, type: "string" },
          previous: { nullable: true, type: "string" },
          results: {
            items: { $ref: "#/components/schemas/Record" },
            type: "array",
          },
        },
        type: "object",
      }),
    },
  }
}

interface DetailOperation {
  method: string
  operation: OpenAPIV3.OperationObject
}

function detailOperations(): DetailOperation[] {
  return [
    {
      method: "get",
      operation: {
        responses: {
          "200": jsonResponse({ $ref: "#/components/schemas/Record" }),
        },
      },
    },
    {
      method: "patch",
      operation: {
        responses: {
          "200": jsonResponse({ $ref: "#/components/schemas/Record" }),
        },
      },
    },
    {
      method: "delete",
      operation: { responses: { "204": { description: "deleted" } } },
    },
  ]
}

function detailPath(methods: DetailOperation[]): OpenAPIV3.PathItemObject {
  const item: OpenAPIV3.PathItemObject = {}
  for (const entry of methods) {
    ;(item as Record<string, unknown>)[entry.method] = entry.operation
  }
  return item
}

/** Builds a small OpenAPI document with two listable entities. */
function createAdminSchema(): MyOpenAPIDocument {
  return {
    components: {
      schemas: {
        Record: recordSchema(true),
        RecordWrite: recordSchema(false),
      },
    },
    info: { title: "admin-test", version: "1.0.0" },
    openapi: "3.0.0",
    paths: {
      "/api/logs/": { get: listOperation() },
      "/api/records/": {
        get: listOperation(),
        post: {
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordWrite" },
              },
            },
          },
          responses: {
            "201": jsonResponse({ $ref: "#/components/schemas/Record" }),
          },
        },
      },
      "/api/records/{id}/": detailPath(detailOperations()),
    },
  }
}

/** Parsed entity used by the standalone admin pieces. */
function createEntity(
  entityName = "records",
  fullBasePath = "/api/records/",
): ParsedEntity {
  const operations = detailOperations().map((entry) => ({
    fullPath: `${fullBasePath}{id}/`,
    method: entry.method,
    operation: entry.operation,
  }))

  return {
    basePath: `/${entityName}/`,
    createOperation: {
      requestBody: {
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RecordWrite" },
          },
        },
      },
      responses: {
        "201": jsonResponse({ $ref: "#/components/schemas/Record" }),
      },
    },
    details: [{ operations, paramName: "id", paramType: "integer" }],
    entityName,
    fullBasePath,
    listOperation: listOperation(),
    methods: [],
    namespace: "api",
  }
}

interface StubFetchOptions {
  records?: Record<string, unknown>[]
}

interface StubFetchResult {
  calls: string[]
  fetchMock: ReturnType<typeof vi.fn>
}

function paginated(records: Record<string, unknown>[]) {
  return {
    count: records.length,
    next: undefined,
    previous: undefined,
    results: records,
  }
}

/** Stubs the global fetch with list/detail/create responses. */
function stubAdminFetch(options: StubFetchOptions = {}): StubFetchResult {
  const records = options.records ?? RECORDS
  const calls: string[] = []

  const fetchMock = vi.fn((input: unknown) => {
    const url = new URL(String(input))
    calls.push(url.toString())

    const pathParts = url.pathname.split("/")
    const recordId = pathParts.at(-ID_PATH_OFFSET)
    const body = url.pathname.endsWith("/api/records/")
      ? paginated(records)
      : (records.find((record) => String(record.id) === recordId) ?? {})

    return Promise.resolve(Response.json(body))
  })

  vi.stubGlobal("fetch", fetchMock)
  return { calls, fetchMock }
}

export { createAdminSchema, createEntity, RECORDS, stubAdminFetch }
