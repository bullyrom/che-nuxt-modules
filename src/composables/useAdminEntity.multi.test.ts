import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"

import { useAdminPanelStore } from "../stores/adminPanel/index"

import { useAdminEntity } from "./useAdminEntity"

import type { MyOpenAPIDocument } from "../stores/adminPanel/types"

interface Book {
  id: number
  title: string
}

interface Ticket {
  id: number
  subject: string
}

interface Entities {
  "catalog:books": Book
  "support:tickets": Ticket
}

const listOperation = {
  responses: {
    "200": {
      content: {
        "application/json": {
          schema: {
            properties: {
              count: { type: "integer" },
              next: { type: "string" },
              previous: { type: "string" },
              results: { items: { type: "object" }, type: "array" },
            },
            type: "object",
          },
        },
      },
      description: "ok",
    },
  },
}

function makeSchema(entity: string): MyOpenAPIDocument {
  return {
    info: { title: entity, version: "1.0.0" },
    openapi: "3.0.0",
    paths: {
      [`/api/v1/${entity}/`]: { get: listOperation },
    } as MyOpenAPIDocument["paths"],
  }
}

describe("useAdminEntity with several specs", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAdminPanelStore().setSpecs([
      { id: "catalog", schema: makeSchema("books") },
      { id: "support", schema: makeSchema("tickets") },
    ])
  })

  it("resolves an entity by its full key", () => {
    const access = useAdminEntity<Entities, "catalog:books">({
      entityKey: "catalog:books",
      instanceKey: "by-key",
    })

    expect(access.entity.value?.key).toBe("catalog:books")
  })

  it("accepts a full key through the legacy entityName field", () => {
    const access = useAdminEntity<Entities, "catalog:books">({
      entityName: "catalog:books",
      instanceKey: "by-legacy-key",
    })

    expect(access.entity.value?.key).toBe("catalog:books")
  })

  it("resolves a unique short name", () => {
    const access = useAdminEntity<Entities, "tickets">({
      entityName: "tickets",
      instanceKey: "by-name",
    })

    expect(access.entity.value?.service).toBe("support")
  })
})
