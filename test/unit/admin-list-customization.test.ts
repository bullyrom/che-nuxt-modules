// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  EntityRecordList,
  getAdminPanelDetailStore,
  getAdminPanelFormStore,
  getAdminPanelListStore,
  useAdminPanelStore,
} from "../../src/index"

import { createEntity, stubAdminFetch } from "./helpers/adminFixtures"
import {
  CustomHeader,
  CustomList,
  ListChrome,
  ListGroup,
} from "./helpers/customComponents"
import {
  click,
  createTestPinia,
  mountComponent,
  waitFor,
} from "./helpers/mount"

import type { MountedComponent } from "./helpers/mount"
import type { AdminPanelConfig } from "../../src/index"

// eslint-disable-next-line init-declarations
let mounted: MountedComponent | undefined

afterEach(() => {
  mounted?.unmount()
  mounted = undefined
  document.body.innerHTML = ""
  vi.unstubAllGlobals()
})

function current(): MountedComponent {
  if (mounted === undefined) throw new Error("Component was not mounted")
  return mounted
}

function text(): string {
  return current().container.textContent ?? ""
}

async function renderList(
  config: AdminPanelConfig,
  instanceKey: string,
): Promise<void> {
  stubAdminFetch()
  mounted = await mountComponent(EntityRecordList, {
    baseUrl: "https://api.test",
    config,
    entity: createEntity(),
    instanceKey,
  })
  await waitFor(() => text().includes("Alpha"))
}

describe("admin list customization", () => {
  it("hides list item fields, renders the group and patches the record", async () => {
    await renderList(
      {
        entities: {
          records: {
            listItemOverride: {
              component: ListGroup,
              hiddenFields: ["meta"],
            },
          },
        },
      },
      "customization-list-item",
    )

    expect(text()).not.toContain("first-meta")
    expect(
      current().container.querySelector('[data-list-group="1"]'),
    ).not.toBeNull()

    await click(current().container.querySelector('[data-list-group="1"]'))
    await waitFor(() => text().includes("Patched title"))
  })

  it("replaces the list with the list override", async () => {
    stubAdminFetch()
    mounted = await mountComponent(EntityRecordList, {
      baseUrl: "https://api.test",
      config: { views: { list: CustomList } },
      entity: createEntity(),
      instanceKey: "customization-list-full",
    })
    await waitFor(() => text().includes("custom-list:2"))

    expect(
      current().container.querySelector("[data-custom-list]"),
    ).not.toBeNull()
    expect(text()).not.toContain("Alpha")
  })

  it("wraps the default list with listHeader and listFooter", async () => {
    await renderList(
      { views: { listFooter: ListChrome, listHeader: ListChrome } },
      "customization-list-parts",
    )

    expect(
      current().container.querySelectorAll("[data-list-chrome]"),
    ).toHaveLength(2)
  })

  it("applies the global grid when the entity has no override", async () => {
    await renderList({ gridColumns: 2 }, "customization-list-grid-global")

    expect(current().container.querySelector(".grid-cols-2")).not.toBeNull()
  })

  it("applies the per-entity grid over the global grid", async () => {
    await renderList(
      { entities: { records: { gridColumns: 3 } }, gridColumns: 4 },
      "customization-list-grid",
    )

    expect(current().container.querySelector(".grid-cols-3")).not.toBeNull()
    expect(current().container.querySelector(".grid-cols-4")).toBeNull()
  })

  it("creates only its own entry for an embedded list and keeps the shared config", async () => {
    stubAdminFetch()
    const globalConfig: AdminPanelConfig = { gridColumns: 5 }
    const pinia = createTestPinia()
    useAdminPanelStore().setConfig(globalConfig)

    mounted = await mountComponent(
      EntityRecordList,
      {
        baseUrl: "https://api.test",
        entity: createEntity(),
        instanceKey: "embedded-only",
        listConfig: { gridColumns: 1 },
      },
      pinia,
    )
    await waitFor(() => text().includes("Alpha"))

    expect(getAdminPanelListStore("embedded-only")).toBeDefined()
    expect(getAdminPanelDetailStore("embedded-only")).toBeUndefined()
    expect(getAdminPanelFormStore("embedded-only")).toBeUndefined()
    expect(useAdminPanelStore().config).toBe(globalConfig)
    expect(current().container.querySelector(".grid-cols-1")).not.toBeNull()
  })

  it("replaces the default header", async () => {
    stubAdminFetch()
    mounted = await mountComponent(EntityRecordList, {
      baseUrl: "https://api.test",
      config: { views: { header: CustomHeader } },
      entity: createEntity(),
      instanceKey: "customization-list-header",
    })

    expect(text()).toContain("custom-header:records")
    expect(text()).not.toContain("+ New")
  })
})
