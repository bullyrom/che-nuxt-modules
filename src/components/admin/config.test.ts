import { describe, expect, it, vi } from "vitest"

import {
  detailConfigToPanelConfig,
  formConfigToPanelConfig,
  listConfigToPanelConfig,
} from "./config"

import type { Component } from "vue"

const Custom = vi.fn() as unknown as Component

describe("config fragments", () => {
  it("maps a list fragment to the panel config", () => {
    const config = listConfigToPanelConfig(
      { detailHref: () => "/x", gridColumns: 2, list: Custom },
      "records",
    )

    expect(config.gridColumns).toBe(2)
    expect(config.views?.list).toBe(Custom)
    expect(config.entities?.records?.gridColumns).toBe(2)
  })

  it("keeps a list fragment without an entity name", () => {
    const config = listConfigToPanelConfig({ gridColumns: 3 }, undefined)

    expect(config.entities).toBeUndefined()
    expect(config.gridColumns).toBe(3)
  })

  it("maps detail and form fragments", () => {
    const detail = detailConfigToPanelConfig({ detail: Custom }, "records")
    const form = formConfigToPanelConfig(
      { defaultComponents: {}, overrides: {} },
      "records",
    )

    expect(detail.views?.detail).toBe(Custom)
    expect(form.fields?.overrides).toEqual({})
    expect(form.entities?.records).toBeDefined()
  })
})
