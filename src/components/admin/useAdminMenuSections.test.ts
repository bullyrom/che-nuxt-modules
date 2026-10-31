import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"

import { useAdminPanelStore } from "../../stores/adminPanel/index"

import { useAdminMenuSections } from "./useAdminMenuSections"

import type { MyOpenAPIDocument } from "../../stores/adminPanel/types"

const listOperation = { responses: { "200": { description: "ok" } } }

const schema: MyOpenAPIDocument = {
  info: { title: "test", version: "1.0.0" },
  openapi: "3.0.0",
  paths: {
    "/api/v1/blog/articles/": { get: listOperation },
    "/api/v1/internal/logs/": { get: listOperation },
    "/api/v1/shop/products/": { get: listOperation },
  },
}

describe("useAdminMenuSections", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("returns the same grouped endpoint sections the sidebar renders", () => {
    const store = useAdminPanelStore()
    store.setSchema(schema)

    const { sections } = useAdminMenuSections({
      config: {
        menu: {
          extraLinks: [{ href: "/docs", label: "Docs" }],
          hiddenEntities: ["logs"],
        },
      },
      showGroups: true,
    })

    expect(sections.value.map((section) => section.title)).toEqual([
      "api/v1/blog",
      "api/v1/shop",
      "Links",
    ])
    const [blogSection] = sections.value
    const linksSection = sections.value.find(
      (section) => section.id === "links",
    )

    expect(blogSection?.items.map((item) => item.label)).toEqual(["articles"])
    expect(linksSection?.items.map((item) => item.href)).toEqual(["/docs"])
  })

  it("exposes the parsed entity behind each endpoint link", () => {
    const store = useAdminPanelStore()
    store.setSchema(schema)

    const { sections } = useAdminMenuSections({ showGroups: false })

    const [flatSection] = sections.value
    const labels = flatSection?.items.map((item) => item.entity?.entityName)
    const firstEntity = flatSection?.items.find(
      (item) => item.id === "/api/v1/blog/articles/",
    )?.entity

    expect(labels).toEqual(["articles", "logs", "products"])
    expect(firstEntity?.fullBasePath).toBe("/api/v1/blog/articles/")
  })

  it("marks the active entity and nests custom links", () => {
    const store = useAdminPanelStore()
    store.setSchema(schema)

    const articles = store.parsedEntities.find(
      (entity) => entity.entityName === "articles",
    )
    store.activeEntity = articles

    const { sections } = useAdminMenuSections({
      config: { menu: { extraLinks: [] } },
      extraLinks: [
        { href: "/", id: "site", label: "Site" },
        { href: "/docs", label: "Docs", parent: "site" },
      ],
      showGroups: true,
    })

    const articlesItem = sections.value
      .flatMap((section) => section.items)
      .find((item) => item.id === "/api/v1/blog/articles/")
    const linksSection = sections.value.find(
      (section) => section.id === "links",
    )
    const [site] = linksSection?.items ?? []

    expect(articlesItem?.isActive).toBe(true)
    expect(site?.children.map((child) => child.label)).toEqual(["Docs"])
  })
})
