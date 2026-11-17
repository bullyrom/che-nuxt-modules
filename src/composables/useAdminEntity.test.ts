import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, expectTypeOf, it } from "vitest"

import { useAdminPanelStore } from "../stores/adminPanel/index"

import { useAdminEntity } from "./useAdminEntity"

import type { MyOpenAPIDocument } from "../stores/adminPanel/types"
import type { ComputedRef, Ref } from "vue"

interface Book {
  id: number
  name: string
}

interface Entities {
  books: Book
}

const schema: MyOpenAPIDocument = {
  info: { title: "test", version: "1.0.0" },
  openapi: "3.0.0",
  paths: {
    "/api/v1/catalog/books/": {
      get: {
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  properties: {
                    count: { type: "integer" },
                    next: { type: "string" },
                    previous: { type: "string" },
                    results: {
                      items: { $ref: "#/components/schemas/Book" },
                      type: "array",
                    },
                  },
                  type: "object",
                },
              },
            },
            description: "ok",
          },
        },
      },
    },
  },
}

describe("useAdminEntity", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const adminPanelStore = useAdminPanelStore()
    adminPanelStore.setSchema(schema)
    adminPanelStore.setBaseUrl("https://api.example.test")
  })

  it("resolves the entity and exposes typed slices", () => {
    const access = useAdminEntity<Entities, "books">({
      entityName: "books",
      instanceKey: "custom-books",
    })

    expect(access.entity.value?.entityName).toBe("books")
    expect(access.list.isPaginated.value).toBe(true)
    expectTypeOf(access.list.records).toEqualTypeOf<Ref<Book[] | undefined>>()
    expectTypeOf(access.detail.record).toEqualTypeOf<
      ComputedRef<Book | undefined>
    >()
  })

  it("keeps different instance keys independent", () => {
    const first = useAdminEntity<Entities, "books">({
      entityName: "books",
      instanceKey: "first",
    })
    const second = useAdminEntity<Entities, "books">({
      entityName: "books",
      instanceKey: "second",
    })

    expect(first.list.records).not.toBe(second.list.records)
  })
})
