// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest"
import { defineComponent, h, ref } from "vue"

import {
  EntityRecordDetail,
  EntityRecordList,
  getAdminPanelDetailStore,
  getAdminPanelFormStore,
  getAdminPanelListStore,
  useAdminPanelDetailStore,
  useAdminPanelFormStore,
  useAdminPanelListStore,
  useAdminPanelStore,
} from "../../src/index"

import { createEntity, RECORDS, stubAdminFetch } from "./helpers/adminFixtures"
import {
  createTestPinia,
  flush,
  mountComponent,
  waitFor,
} from "./helpers/mount"

import type {
  AdminInstanceParameters,
  AdminPanelConfig,
  ParsedEntity,
} from "../../src/index"

// eslint-disable-next-line init-declarations
let unmountCurrent: (() => void) | undefined

afterEach(() => {
  unmountCurrent?.()
  unmountCurrent = undefined
  document.body.innerHTML = ""
  vi.unstubAllGlobals()
})

function nestedRecord(entityName: string, fullBasePath: string): ParsedEntity {
  return createEntity(entityName, fullBasePath)
}

function createInstanceParameters(parameters: {
  baseUrl: string
  entity: ParsedEntity
  instanceKey: string
}): AdminInstanceParameters {
  return {
    baseUrl: parameters.baseUrl,
    entity: () => parameters.entity,
    instanceKey: parameters.instanceKey,
  }
}

describe("keyed admin stores", () => {
  it("creates one dictionary entry per area and keeps the shared config", () => {
    createTestPinia()
    const config: AdminPanelConfig = { gridColumns: 2 }
    const adminPanel = useAdminPanelStore()
    adminPanel.setConfig(config)

    const listA = useAdminPanelListStore(
      createInstanceParameters({
        baseUrl: "https://api.test",
        entity: nestedRecord("records", "/api/records/"),
        instanceKey: "list-a",
      }),
    )
    expect(getAdminPanelListStore("list-a")).toBe(listA)
    expect(getAdminPanelDetailStore("list-a")).toBeUndefined()
    expect(getAdminPanelFormStore("list-a")).toBeUndefined()

    const detailB = useAdminPanelDetailStore(
      createInstanceParameters({
        baseUrl: "https://api.test",
        entity: nestedRecord("logs", "/api/logs/"),
        instanceKey: "detail-b",
      }),
    )
    const formC = useAdminPanelFormStore(
      createInstanceParameters({
        baseUrl: "https://api.test",
        entity: nestedRecord("logs", "/api/logs/"),
        instanceKey: "form-c",
      }),
    )

    expect(getAdminPanelDetailStore("detail-b")).toBe(detailB)
    expect(getAdminPanelFormStore("form-c")).toBe(formC)
    expect(getAdminPanelListStore("detail-b")).toBeUndefined()
    expect(getAdminPanelListStore("list-a")).toBe(listA)
    expect(adminPanel.config).toBe(config)
  })

  it("keeps data of two list keys independent", async () => {
    createTestPinia()
    useAdminPanelStore().setSchema({
      components: { schemas: {} },
      info: { title: "test", version: "1.0.0" },
      openapi: "3.0.0",
      paths: {},
    })

    const calls: string[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn((input: unknown) => {
        const url = new URL(String(input))
        calls.push(url.toString())
        const body = url.pathname.includes("records")
          ? [{ id: 1, name: "Alpha" }]
          : [{ id: 2, name: "Log" }]
        return Promise.resolve(
          Response.json(body, {
            headers: { "content-type": "application/json" },
            status: 200,
          }),
        )
      }),
    )

    const parametersA = createInstanceParameters({
      baseUrl: "https://api.test",
      entity: nestedRecord("records", "/api/records/"),
      instanceKey: "data-a",
    })
    const parametersB = createInstanceParameters({
      baseUrl: "https://api.test",
      entity: nestedRecord("logs", "/api/logs/"),
      instanceKey: "data-b",
    })

    const listA = useAdminPanelListStore(parametersA)
    const listB = useAdminPanelListStore(parametersB)
    await listA.reload()
    await listB.reload()

    expect(listA.entityRecords).toEqual([{ id: 1, name: "Alpha" }])
    expect(listB.entityRecords).toEqual([{ id: 2, name: "Log" }])
    expect(calls).toContain("https://api.test/api/records/")
    expect(calls).toContain("https://api.test/api/logs/")
  })
})

describe("embedded list detail links", () => {
  let linkCounter = 0

  async function renderList(
    properties: Record<string, unknown>,
  ): Promise<HTMLElement> {
    stubAdminFetch()
    linkCounter += 1
    const result = await mountComponent(EntityRecordList, {
      baseUrl: "https://api.test",
      entity: createEntity(),
      instanceKey: `detail-link-${linkCounter}`,
      ...properties,
    })
    unmountCurrent = result.unmount
    await waitFor(() => (result.container.textContent ?? "").includes("Alpha"))
    return result.container
  }

  it("renders the View action as a link built by detailHref", async () => {
    const container = await renderList({
      detailHref: (record: Record<string, unknown>) =>
        `/records/${String(record.id)}`,
    })

    const link = container.querySelector('a[href="/records/1"]')
    expect(link?.textContent).toContain("View")
  })

  it("hides the detail action without detailHref or showDetail", async () => {
    const container = await renderList({})

    expect(container.querySelector('a[title="View"]')).toBeNull()
    expect(container.querySelector('button[title="View"]')).toBeNull()
  })

  it("offers an in-place detail action when showDetail is set", async () => {
    const container = await renderList({ showDetail: true })

    expect(container.querySelector('button[title="View"]')).not.toBeNull()
  })
})

describe("embedded list realtime", () => {
  it("follows the realtime channel when the entity switches", async () => {
    stubAdminFetch()

    const handlers: ((change: {
      action: "created" | "deleted" | "updated"
      entity: string
      id?: number | string
    }) => void)[] = []
    const subscribe = vi.fn()
    const unsubscribe = vi.fn()
    const client = {
      onChanged: vi.fn((handler: (typeof handlers)[number]) => {
        handlers.push(handler)
      }),
      subscribe,
      unsubscribe,
    }
    const entities = ref<ParsedEntity>(createEntity())

    const Wrapper = defineComponent({
      name: "RealtimeListWrapper",
      setup() {
        return () =>
          h(EntityRecordList, {
            baseUrl: "https://api.test",
            config: { realtime: client },
            entity: entities.value,
            instanceKey: "realtime-list",
          })
      },
    })

    const result = await mountComponent(Wrapper)
    unmountCurrent = result.unmount
    await waitFor(() => (result.container.textContent ?? "").includes("Alpha"))
    expect(subscribe).toHaveBeenCalledWith(["entity:records"])

    for (const handler of handlers) {
      handler({ action: "updated", entity: "records", id: 1 })
    }
    await waitFor(() => (result.container.textContent ?? "").includes("1 new"))

    entities.value = createEntity("logs", "/api/logs/")
    await flush()
    await waitFor(() =>
      subscribe.mock.calls.some(([rooms]) =>
        (rooms as string[]).includes("entity:logs"),
      ),
    )
    expect(unsubscribe).toHaveBeenCalledWith(["entity:records"])
  })
})

describe("embedded detail realtime", () => {
  it("subscribes to the record room and closes on delete", async () => {
    stubAdminFetch()
    const handlers: ((change: {
      action: "created" | "deleted" | "updated"
      entity: string
      id?: number | string
    }) => void)[] = []
    const subscribe = vi.fn()
    const client = {
      onChanged: vi.fn((handler: (typeof handlers)[number]) => {
        handlers.push(handler)
      }),
      subscribe,
      unsubscribe: vi.fn(),
    }
    const Wrapper = defineComponent({
      name: "RealtimeDetailWrapper",
      setup() {
        return () =>
          h(EntityRecordDetail, {
            baseUrl: "https://api.test",
            config: { realtime: client },
            entity: createEntity(),
            instanceKey: "realtime-detail",
            record: RECORDS[0] ?? {},
          })
      },
    })

    const result = await mountComponent(Wrapper)
    unmountCurrent = result.unmount
    await flush()

    expect(subscribe).toHaveBeenCalledWith(["entity:records:1"])

    for (const handler of handlers) {
      handler({ action: "deleted", entity: "records", id: 1 })
    }
    expect(
      getAdminPanelDetailStore("realtime-detail")?.viewingRecord,
    ).toBeUndefined()
  })
})
