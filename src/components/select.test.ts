import { describe, expect, it } from "vitest"

import { toSelectOptions } from "./select"

interface TestRecord {
  id: number
  name: string
}

describe("toSelectOptions", () => {
  it("maps records using the label/value keys", () => {
    const records: TestRecord[] = [
      { id: 1, name: "Alpha" },
      { id: 2, name: "Beta" },
    ]

    expect(toSelectOptions(records, "name", "id")).toEqual([
      { label: "Alpha", value: 1 },
      { label: "Beta", value: 2 },
    ])
  })

  it("returns an empty list for undefined records", () => {
    expect(toSelectOptions<TestRecord>(undefined, "name", "id")).toEqual([])
  })
})
