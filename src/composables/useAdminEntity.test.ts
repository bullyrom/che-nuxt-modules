import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, expectTypeOf, it } from "vitest"

import { useAdminPanelStore } from "../stores/adminPanel/index"

import { useAdminEntity } from "./useAdminEntity"

import type { MyOpenAPIDocument } from "../stores/adminPanel/types"
import type { ComputedRef, Ref } from "vue"

interface Project {
  id: number
  name: string
}

interface Entities {
  projects: Project
}

const schema: MyOpenAPIDocument = {
  info: { title: "test", version: "1.0.0" },
  openapi: "3.0.0",
  paths: {
    "/api/v1/record/projects/": {
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
                      items: { $ref: "#/components/schemas/Project" },
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
    const access = useAdminEntity<Entities, "projects">({
      entityName: "projects",
      instanceKey: "custom-projects",
    })

    expect(access.entity.value?.entityName).toBe("projects")
    expect(access.list.isPaginated.value).toBe(true)
    expectTypeOf(access.list.records).toEqualTypeOf<
      Ref<Project[] | undefined>
    >()
    expectTypeOf(access.detail.record).toEqualTypeOf<
      ComputedRef<Project | undefined>
    >()
  })

  it("keeps different instance keys independent", () => {
    const first = useAdminEntity<Entities, "projects">({
      entityName: "projects",
      instanceKey: "first",
    })
    const second = useAdminEntity<Entities, "projects">({
      entityName: "projects",
      instanceKey: "second",
    })

    expect(first.list.records).not.toBe(second.list.records)
  })
})
