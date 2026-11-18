import { describe, expect, expectTypeOf, it } from "vitest"

import {
  getAdminListFieldSlotKeys,
  isAdminListFieldOverridden,
} from "./entityList"

import type { AdminListCompatible } from "./entityList"

interface BaseRecord {
  id: number
  name: string
  status: string
}

interface ExtendedRecord extends BaseRecord {
  meta: { tags: string[] }
}

describe("admin list custom-record compatibility", () => {
  it("accepts an item with all base fields plus custom fields", () => {
    expectTypeOf<
      AdminListCompatible<BaseRecord, ExtendedRecord>
    >().toEqualTypeOf<ExtendedRecord>()
  })

  it("rejects an item with an incompatible field", () => {
    expectTypeOf<
      AdminListCompatible<
        BaseRecord,
        { id: number; name: number; status: string }
      >
    >().toBeNever()
  })

  it("rejects an item missing a base field", () => {
    expectTypeOf<
      AdminListCompatible<BaseRecord, { id: number; status: string }>
    >().toBeNever()
  })

  it("skips fields rendered by their own slot", () => {
    expectTypeOf<
      AdminListCompatible<
        BaseRecord,
        { id: number; name: number; status: string },
        "name"
      >
    >().toEqualTypeOf<{ id: number; name: number; status: string }>()

    expectTypeOf<
      AdminListCompatible<BaseRecord, { id: number; status: string }, "name">
    >().toEqualTypeOf<{ id: number; status: string }>()
  })

  it("keeps the default slot out of the overridden field keys", () => {
    const slotNames = ["default", "name", "meta", "status"]
    const fieldSlotKeys = getAdminListFieldSlotKeys(slotNames)

    expect(fieldSlotKeys).toEqual(["name", "meta", "status"])
    expect(isAdminListFieldOverridden("name", fieldSlotKeys)).toBe(true)
    expect(isAdminListFieldOverridden("id", fieldSlotKeys)).toBe(false)
  })
})
