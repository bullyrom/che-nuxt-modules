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

const projects = makeEntity("projects")
const tasks = makeEntity("tasks")
const logs = makeEntity("logs")

describe("hidden entity pages", () => {
  it("merges hidden entities and hidden pages", () => {
    expect(
      resolveHiddenEntityKeys({
        hiddenEntities: ["logs"],
        hiddenPages: ["tasks", "/api/v1/record/logs/"],
      }),
    ).toEqual(["logs", "tasks", "/api/v1/record/logs/"])
  })

  it("hides a page-only entity from the menu as well", () => {
    const groups = visibleMenuGroups(
      [{ entities: [projects, tasks], namespace: "record" }],
      resolveHiddenEntityKeys({ hiddenPages: ["tasks"] }),
    )

    expect(groups.flatMap((group) => group.entities)).toEqual([projects])
  })

  it("detects hidden pages by name or full path", () => {
    expect(isAdminEntityPageHidden(tasks, { hiddenPages: ["tasks"] })).toBe(
      true,
    )
    expect(
      isAdminEntityPageHidden(tasks, {
        hiddenPages: ["/api/v1/record/tasks/"],
      }),
    ).toBe(true)
    expect(isAdminEntityPageHidden(projects, { hiddenPages: ["tasks"] })).toBe(
      false,
    )
    expect(isAdminEntityPageHidden(logs, { hiddenEntities: ["logs"] })).toBe(
      true,
    )
  })
})
