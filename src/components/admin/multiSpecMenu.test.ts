import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"

import { useAdminPanelStore } from "../../stores/adminPanel/index"

import { useAdminMenuSections } from "./useAdminMenuSections"

import type { MyOpenAPIDocument } from "../../stores/adminPanel/types"

const listOperation = { responses: { "200": { description: "ok" } } }

const catalogSchema: MyOpenAPIDocument = {
  info: { title: "catalog", version: "1.0.0" },
  openapi: "3.0.0",
  paths: {
    "/api/v1/catalog/books/": { get: listOperation },
    "/api/v1/catalog/tasks/": { get: listOperation },
  },
}

const supportSchema: MyOpenAPIDocument = {
  info: { title: "support", version: "1.0.0" },
  openapi: "3.0.0",
  paths: {
    "/api/v1/support/tasks/": { get: listOperation },
    "/api/v1/support/tickets/": { get: listOperation },
  },
}

function labelsBySection() {
  const { sections } = useAdminMenuSections({ showGroups: true })
  return Object.fromEntries(
    sections.value.map((section) => [
      section.title,
      section.items.map((item) => item.label),
    ]),
  )
}

describe("multi-spec admin menu", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const store = useAdminPanelStore()
    store.setSpecs([
      { id: "catalog", label: "Catalog", schema: catalogSchema },
      { id: "support", label: "Support", schema: supportSchema },
    ])
  })

  it("groups entities by service and prefixes conflicting short names", () => {
    expect(labelsBySection()).toEqual({
      Catalog: ["books", "catalog:tasks"],
      Support: ["support:tasks", "tickets"],
    })
  })

  it("uses full service keys as menu item ids", () => {
    const { sections } = useAdminMenuSections({ showGroups: true })
    const ids = sections.value.flatMap((section) =>
      section.items.map((item) => item.id),
    )

    expect(ids).toEqual([
      "catalog:books",
      "catalog:tasks",
      "support:tasks",
      "support:tickets",
    ])
  })

  it("hides an entity by its full service key", () => {
    const { sections } = useAdminMenuSections({
      config: { menu: { hiddenEntities: ["support:tasks"] } },
      showGroups: true,
    })

    expect(sections.value.map((section) => section.title)).toEqual([
      "Catalog",
      "Support",
    ])
    expect(sections.value.at(-1)?.items.map((item) => item.label)).toEqual([
      "tickets",
    ])
  })

  it("always prefixes when the config asks for it", () => {
    const { sections } = useAdminMenuSections({
      config: { menu: { entityLabelPrefix: true } },
      showGroups: true,
    })
    const labels = sections.value.flatMap((section) =>
      section.items.map((item) => item.label),
    )

    expect(labels).toContain("catalog:books")
    expect(labels).toContain("support:tickets")
  })
})
