import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"

import { createInstanceRegistry } from "./instanceRegistry"

interface Parameters {
  instanceKey: string
  scope?: string
  value: string
}

describe("createInstanceRegistry", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("isolates the same instance key per service scope", () => {
    const registry = createInstanceRegistry<Parameters, { value: string }>({
      idPrefix: "test",
      setup: (parameters) => ({ value: parameters.value }),
    })

    const catalog = registry.use({
      instanceKey: "admin-1",
      scope: "catalog",
      value: "catalog",
    })
    const support = registry.use({
      instanceKey: "admin-1",
      scope: "support",
      value: "support",
    })
    const catalogAgain = registry.use({
      instanceKey: "admin-1",
      scope: "catalog",
      value: "ignored",
    })

    expect(catalog.value).toBe("catalog")
    expect(support.value).toBe("support")
    expect(catalogAgain).toBe(catalog)
    expect(registry.get("admin-1", "support")).toBe(support)
  })
})
