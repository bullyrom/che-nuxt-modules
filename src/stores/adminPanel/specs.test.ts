import { describe, expect, it } from "vitest"

import {
  entityDisplayLabel,
  hasEntityNameConflict,
  resolveAdminEntity,
} from "./entityKey"
import { mergeOpenApiDocuments } from "./schemaMerge"
import {
  DEFAULT_ADMIN_SPEC_ID,
  mergeAdminSpecs,
  normalizeAdminSpecs,
} from "./specs"

import type { MyOpenAPIDocument } from "./types"

const listOperation = { responses: { "200": { description: "ok" } } }

function makeSchema(paths: Record<string, unknown>): MyOpenAPIDocument {
  return {
    info: { title: "test", version: "1.0.0" },
    openapi: "3.0.0",
    paths: paths as MyOpenAPIDocument["paths"],
  }
}

const catalogSchema = makeSchema({
  "/api/v1/catalog/books/": { get: listOperation },
  "/api/v1/catalog/tasks/": { get: listOperation },
})
const supportSchema = makeSchema({
  "/api/v1/support/tasks/": { get: listOperation },
})

describe("admin spec registry", () => {
  it("keeps the single-spec default id and service metadata", () => {
    const [spec] = normalizeAdminSpecs([{ id: "", schema: catalogSchema }])

    expect(spec?.id).toBe(DEFAULT_ADMIN_SPEC_ID)
    expect(spec?.label).toBe(DEFAULT_ADMIN_SPEC_ID)
  })

  it("rejects duplicate service ids", () => {
    expect(() =>
      normalizeAdminSpecs([
        { id: "crm", schema: catalogSchema },
        { id: "crm", schema: supportSchema },
      ]),
    ).toThrow("Duplicate admin OpenAPI spec id: crm")
  })

  it("merges entities with service:entity keys and per-spec base URLs", () => {
    const merged = mergeAdminSpecs([
      {
        baseUrl: "https://catalog.example.test",
        id: "catalog",
        label: "Catalog",
        schema: catalogSchema,
      },
      {
        baseUrl: "https://support.example.test",
        id: "support",
        label: "Support",
        schema: supportSchema,
      },
    ])

    expect(merged.entities.map((entity) => entity.key)).toEqual([
      "catalog:books",
      "catalog:tasks",
      "support:tasks",
    ])
    expect(merged.entities.map((entity) => entity.baseUrl)).toEqual([
      "https://catalog.example.test",
      "https://catalog.example.test",
      "https://support.example.test",
    ])
    expect(merged.groups.map((group) => group.title)).toEqual([
      "Catalog",
      "Support",
    ])
  })

  it("merges loaded documents into one schema view", () => {
    const merged = mergeOpenApiDocuments([catalogSchema, supportSchema])

    expect(Object.keys(merged?.paths ?? {})).toEqual([
      "/api/v1/catalog/books/",
      "/api/v1/catalog/tasks/",
      "/api/v1/support/tasks/",
    ])
  })
})

describe("entity references", () => {
  const { entities } = mergeAdminSpecs([
    { id: "catalog", schema: catalogSchema },
    { id: "support", schema: supportSchema },
  ])

  it("accepts a full service:entity key", () => {
    expect(resolveAdminEntity(entities, "support:tasks").service).toBe(
      "support",
    )
  })

  it("accepts a short name only when it is unique", () => {
    expect(resolveAdminEntity(entities, "books").key).toBe("catalog:books")
  })

  it("lists variants for an ambiguous short name", () => {
    expect(() => resolveAdminEntity(entities, "tasks")).toThrow(
      "catalog:tasks, support:tasks",
    )
  })

  it("lists available entities for an unknown reference", () => {
    expect(() => resolveAdminEntity(entities, "missing")).toThrow(
      "catalog:books, catalog:tasks, support:tasks",
    )
  })
})

describe("entity labels", () => {
  const { entities } = mergeAdminSpecs([
    { id: "catalog", schema: catalogSchema },
    { id: "support", schema: supportSchema },
  ])
  const books = resolveAdminEntity(entities, "catalog:books")
  const tasks = resolveAdminEntity(entities, "catalog:tasks")

  it("prefixes only conflicting short names in auto mode", () => {
    expect(hasEntityNameConflict(tasks, entities)).toBe(true)
    expect(hasEntityNameConflict(books, entities)).toBe(false)
    expect(entityDisplayLabel(books, entities, "auto")).toBe("books")
    expect(entityDisplayLabel(tasks, entities, "auto")).toBe("catalog:tasks")
  })

  it("supports explicit prefix and name modes", () => {
    expect(entityDisplayLabel(books, entities, "prefix")).toBe("catalog:books")
    expect(entityDisplayLabel(tasks, entities, "name")).toBe("tasks")
  })
})
