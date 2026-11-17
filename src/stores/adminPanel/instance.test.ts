import { describe, expect, it } from "vitest"

import { resolveEntityBaseUrl, resolveEntityConfig } from "./instance"

import type { ParsedEntity } from "./types"

const GRID_COLUMNS = 4

function makeEntity(service: string, entityName: string): ParsedEntity {
  return {
    basePath: `/${entityName}/`,
    baseUrl: `https://${service}.example.test`,
    details: [],
    entityName,
    fullBasePath: `/api/v1/${entityName}/`,
    key: `${service}:${entityName}`,
    methods: [],
    namespace: "api/v1",
    service,
  }
}

describe("admin entity config resolution", () => {
  const entity = makeEntity("support", "tickets")

  it("prefers the full service:entity key", () => {
    const config = {
      entities: {
        "support:tickets": { gridColumns: 2 },
        tickets: { gridColumns: 4 },
      },
    }

    expect(resolveEntityConfig(config, entity)?.gridColumns).toBe(2)
  })

  it("keeps the bare entity name for single-spec configs", () => {
    const config = { entities: { tickets: { gridColumns: GRID_COLUMNS } } }

    expect(resolveEntityConfig(config, entity)?.gridColumns).toBe(GRID_COLUMNS)
  })

  it("uses the owning spec base URL before the instance fallback", () => {
    expect(resolveEntityBaseUrl(entity, "https://fallback.example.test")).toBe(
      "https://support.example.test",
    )
    expect(
      resolveEntityBaseUrl(undefined, "https://fallback.example.test"),
    ).toBe("https://fallback.example.test")
  })
})
