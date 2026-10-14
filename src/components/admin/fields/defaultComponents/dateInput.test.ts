import { describe, expect, it } from "vitest"

import { inputToIso, isoToInputDate, isoToInputDateTime } from "./dateInput"

describe("date input helpers", () => {
  it("round-trips a datetime through the local input value", () => {
    const iso = "2024-03-05T08:30:00.000Z"
    const inputValue = isoToInputDateTime(iso)

    expect(inputToIso(inputValue)).toBe(iso)
  })

  it("extracts the date part", () => {
    expect(isoToInputDate("2024-03-05T08:30:00.000Z")).toBe("2024-03-05")
  })

  it("handles empty and invalid values", () => {
    expect(isoToInputDateTime(undefined)).toBe("")
    expect(isoToInputDate("")).toBe("")
    expect(inputToIso("")).toBeUndefined()
    expect(isoToInputDateTime("not-a-date")).toBe("")
  })
})
