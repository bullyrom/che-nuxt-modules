// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest"

import { Crud, EntityRecordDetail, useAdminPanelStore } from "../../src/index"

import {
  createAdminSchema,
  createEntity,
  RECORDS,
  stubAdminFetch,
} from "./helpers/adminFixtures"
import {
  CustomDetail,
  CustomSidebar,
  DetailGroup,
} from "./helpers/customComponents"
import { click, flush, mountComponent, waitFor } from "./helpers/mount"

import type { MountedComponent } from "./helpers/mount"

const FIRST_RECORD = RECORDS[0] ?? {}
const ALL_RECORD_KEYS = Object.keys(FIRST_RECORD)

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

function freshRecord(): Record<string, unknown> {
  return structuredClone(FIRST_RECORD)
}

describe("admin detail customization", () => {
  it("renders the group when every detail field is owned", async () => {
    stubAdminFetch()
    mounted = await mountComponent(EntityRecordDetail, {
      baseUrl: "https://api.test",
      config: {
        entities: {
          records: {
            detailOverride: {
              component: DetailGroup,
              hiddenFields: ALL_RECORD_KEYS,
            },
          },
        },
      },
      entity: createEntity(),
      instanceKey: "customization-detail",
      record: freshRecord(),
    })
    await flush()

    expect(
      current().container.querySelector("[data-detail-group]"),
    ).not.toBeNull()
    expect(text()).toContain("detail-group:Alpha")
    expect(text()).not.toContain("first-meta")

    await click(current().container.querySelector("[data-detail-group]"))
    await waitFor(() => text().includes("detail-group:Renamed"))
  })

  it("replaces the whole detail view", async () => {
    stubAdminFetch()
    mounted = await mountComponent(EntityRecordDetail, {
      baseUrl: "https://api.test",
      config: { views: { detail: CustomDetail } },
      entity: createEntity(),
      instanceKey: "customization-detail-full",
      record: freshRecord(),
    })
    await flush()

    expect(text()).toContain("custom-detail:Alpha")
    expect(text()).not.toContain("Back to list")
  })
})

describe("admin menu and sidebar customization", () => {
  it("filters hidden entities and appends extra links", async () => {
    stubAdminFetch()
    mounted = await mountComponent(Crud, {
      apiSchema: createAdminSchema(),
      baseUrl: "https://api.test",
      config: {
        menu: {
          extraLinks: [{ href: "/dashboard", label: "Dashboard" }],
          hiddenEntities: ["logs"],
        },
      },
      instanceKey: "customization-menu",
      isMobile: true,
    })

    expect(text()).toContain("records")
    expect(text()).not.toContain("logs")
    expect(
      current().container.querySelector('a[href="/dashboard"]')?.textContent,
    ).toContain("Dashboard")
  })

  it("replaces the sidebar and lets it select an entity", async () => {
    stubAdminFetch()
    mounted = await mountComponent(Crud, {
      apiSchema: createAdminSchema(),
      baseUrl: "https://api.test",
      config: {
        menu: { extraLinks: [{ href: "/dashboard", label: "Dashboard" }] },
        views: { sidebar: CustomSidebar },
      },
      instanceKey: "customization-sidebar",
      isMobile: true,
    })

    expect(
      current().container.querySelector("[data-custom-sidebar]"),
    ).not.toBeNull()
    expect(
      current().container.querySelector('[data-sidebar-entity="records"]'),
    ).not.toBeNull()
    expect(
      current().container.querySelector('[data-sidebar-link="Dashboard"]'),
    ).not.toBeNull()

    await click(
      current().container.querySelector('[data-sidebar-entity="records"]'),
    )
    expect(useAdminPanelStore().activeEntity?.entityName).toBe("records")
  })
})
