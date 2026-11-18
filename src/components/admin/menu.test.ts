import { describe, expect, it } from "vitest"

import {
  isAdminEntityPageHidden,
  resolveHiddenEntityKeys,
  visibleMenuGroups,
} from "./menu"

import type { ParsedEntity } from "../../stores/adminPanel/types"

function makeEntity(entityName: string): ParsedEntity {
  return {
    basePath: `/record/${entityName}/`,
    details: [],
    entityName,
    fullBasePath: `/api/v1/record/${entityName}/`,
    methods: [],
    namespace: "record",
  }
}

const books = makeEntity("books")
const chapters = makeEntity("chapters")
const logs = makeEntity("logs")

describe("hidden entity pages", () => {
  it("merges hidden entities and hidden pages", () => {
    expect(
      resolveHiddenEntityKeys({
        hiddenEntities: ["logs"],
        hiddenPages: ["chapters", "/api/v1/record/logs/"],
      }),
    ).toEqual(["logs", "chapters", "/api/v1/record/logs/"])
  })

  it("hides a page-only entity from the menu as well", () => {
    const groups = visibleMenuGroups(
      [{ entities: [books, chapters], namespace: "record" }],
      resolveHiddenEntityKeys({ hiddenPages: ["chapters"] }),
    )

    expect(groups.flatMap((group) => group.entities)).toEqual([books])
  })

  it("detects hidden pages by name or full path", () => {
    expect(
      isAdminEntityPageHidden(chapters, { hiddenPages: ["chapters"] }),
    ).toBe(true)
    expect(
      isAdminEntityPageHidden(chapters, {
        hiddenPages: ["/api/v1/record/chapters/"],
      }),
    ).toBe(true)
    expect(isAdminEntityPageHidden(books, { hiddenPages: ["chapters"] })).toBe(
      false,
    )
    expect(isAdminEntityPageHidden(logs, { hiddenEntities: ["logs"] })).toBe(
      true,
    )
  })
})
