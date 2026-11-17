import { describe, expect, it } from "vitest"

import { findAdminEntity } from "./findEntity"

import type { ParsedEntity } from "./types"

function makeEntity(entityName: string, namespace: string): ParsedEntity {
  return {
    basePath: `/${namespace}/${entityName}/`,
    details: [],
    entityName,
    fullBasePath: `/api/v1/${namespace}/${entityName}/`,
    methods: [],
    namespace,
  }
}

const entities = [
  makeEntity("projects", "record"),
  makeEntity("tasks", "record"),
  makeEntity("tasks", "shop"),
]

describe("findAdminEntity", () => {
  it("returns undefined without an entity name", () => {
    expect(findAdminEntity(entities, undefined)).toBeUndefined()
  })

  it("finds an entity by name", () => {
    expect(findAdminEntity(entities, "projects")).toBe(entities[0])
  })

  it("narrows the lookup by namespace", () => {
    expect(findAdminEntity(entities, "tasks", "shop")).toBe(entities[2])
    expect(findAdminEntity(entities, "tasks", "missing")).toBeUndefined()
  })
})
