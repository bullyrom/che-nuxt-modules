import { describe, expect, it } from "vitest"

import {
  buildQueryValues,
  extractListQueryParameters,
  hasQueryParameter,
} from "./queryParameters"

import type { MyOpenAPIDocument } from "./types"
import type { OpenAPIV3 } from "openapi-types"

const document: MyOpenAPIDocument = {
  components: {
    parameters: {
      PageSize: {
        in: "query",
        name: "page_size",
        schema: { type: "integer" },
      },
    },
    schemas: {
      Status: { enum: ["active", "inactive"], type: "string" },
    },
  },
  info: { title: "test", version: "1.0.0" },
  openapi: "3.0.0",
  paths: {},
}

const listOperation: OpenAPIV3.OperationObject = {
  parameters: [
    {
      description: "Free text search",
      in: "query",
      name: "search",
      schema: { type: "string" },
    },
    {
      in: "query",
      name: "status",
      schema: { $ref: "#/components/schemas/Status" },
    },
    { in: "query", name: "is_active", schema: { type: "boolean" } },
    { $ref: "#/components/parameters/PageSize" },
    { in: "query", name: "ordering", schema: { type: "string" } },
    { in: "header", name: "X-Request-Id", schema: { type: "string" } },
  ],
  responses: {},
}

describe("extractListQueryParameters", () => {
  it("splits query parameters into filters and sorting, dropping other locations", () => {
    const parameters = extractListQueryParameters(listOperation, document)

    expect(parameters.filters.map((field) => field.key)).toEqual([
      "search",
      "status",
      "is_active",
      "page_size",
    ])
    expect(parameters.sorts.map((field) => field.key)).toEqual(["ordering"])
  })

  it("types descriptors from the schema, including $refs", () => {
    const parameters = extractListQueryParameters(listOperation, document)
    const status = parameters.filters.find((field) => field.key === "status")
    const isActive = parameters.filters.find(
      (field) => field.key === "is_active",
    )
    const pageSize = parameters.filters.find(
      (field) => field.key === "page_size",
    )

    expect(status?.kind).toBe("string")
    expect(status?.schema?.enum).toEqual(["active", "inactive"])
    expect(isActive?.kind).toBe("boolean")
    expect(pageSize?.kind).toBe("integer")
  })

  it("keeps the parameter description", () => {
    const parameters = extractListQueryParameters(listOperation, document)
    const search = parameters.filters.find((field) => field.key === "search")

    expect(search?.description).toBe("Free text search")
  })
})

describe("hasQueryParameter", () => {
  it("detects both filters and sorting parameters", () => {
    const parameters = extractListQueryParameters(listOperation, document)

    expect(hasQueryParameter(parameters, "search")).toBe(true)
    expect(hasQueryParameter(parameters, "ordering")).toBe(true)
    expect(hasQueryParameter(parameters, "missing")).toBe(false)
  })
})

describe("buildQueryValues", () => {
  it("drops empty values and joins array parameters", () => {
    const query = buildQueryValues({
      active: false,
      ids: [1, 2, 3],
      name: "",
      page: 0,
      tags: [],
    })

    expect(query).toEqual({ active: false, ids: "1,2,3", page: 0 })
  })
})
