// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  EntityCreateForm,
  getAdminPanelFormStore,
  useAdminPanelStore,
} from "../../src/index"

import {
  createAdminSchema,
  createEntity,
  RECORDS,
  stubAdminFetch,
} from "./helpers/adminFixtures"
import {
  captured,
  CapturedGroup,
  DefaultStringField,
  FormatField,
  OverrideTitleField,
} from "./helpers/customComponents"
import { createTestPinia, flush, mountComponent } from "./helpers/mount"

import type { MountedComponent } from "./helpers/mount"
import type { AdminPanelConfig } from "../../src/index"

const INSTANCE_KEY = "customization-form"
const FIRST_RECORD = RECORDS[0] ?? {}

// eslint-disable-next-line init-declarations
let mounted: MountedComponent | undefined

afterEach(() => {
  mounted?.unmount()
  mounted = undefined
  document.body.innerHTML = ""
  vi.unstubAllGlobals()
})

function formConfig(): AdminPanelConfig {
  return {
    entities: {
      records: {
        formOverride: {
          component: CapturedGroup,
          hiddenFields: ["meta", "tags"],
        },
      },
    },
    fields: {
      defaultComponents: { string: DefaultStringField },
      formats: { image: FormatField },
      overrides: {
        RecordWrite: {
          title: { component: OverrideTitleField, kind: "string" },
        },
      },
    },
  }
}

async function renderForm(instanceKey: string): Promise<MountedComponent> {
  const pinia = createTestPinia()
  useAdminPanelStore().setSchema(createAdminSchema())
  const result = await mountComponent(
    EntityCreateForm,
    {
      baseUrl: "https://api.test",
      config: formConfig(),
      entity: createEntity(),
      instanceKey,
    },
    pinia,
  )
  getAdminPanelFormStore(instanceKey)?.startEdit(FIRST_RECORD)
  await flush()
  return result
}

describe("admin form customization", () => {
  it("hides owned fields, renders the whole object group and applies its changes", async () => {
    stubAdminFetch()
    mounted = await renderForm(INSTANCE_KEY)

    const labels = [...mounted.container.querySelectorAll("label")].map(
      (label) => label.textContent?.trim(),
    )
    expect(labels).toContain("name")
    expect(labels).toContain("title")
    expect(labels).not.toContain("meta")
    expect(labels).not.toContain("tags")
    expect(mounted.container.textContent).not.toContain("first-meta")

    expect(captured.value?.name).toBe(FIRST_RECORD.name)
    expect(captured.value?.meta).toEqual(FIRST_RECORD.meta)
    expect(mounted.container.querySelector(".captured-group")).not.toBeNull()

    captured.onChange?.({ name: "Changed by group" })
    await flush()
    expect(getAdminPanelFormStore(INSTANCE_KEY)?.form.name).toBe(
      "Changed by group",
    )
  })

  it("dispatches fields by format, default kind and schema override", async () => {
    stubAdminFetch()
    mounted = await renderForm(`${INSTANCE_KEY}-fields`)

    expect(
      mounted.container.querySelector('[data-format="image"]'),
    ).not.toBeNull()
    expect(
      mounted.container.querySelector('[data-default-string="true"]'),
    ).not.toBeNull()
    expect(
      mounted.container.querySelector('[data-override-title="true"]'),
    ).not.toBeNull()

    const dateInput = mounted.container.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement
    const dateTimeInput = mounted.container.querySelector(
      'input[type="datetime-local"]',
    ) as HTMLInputElement
    expect(dateInput.value).toBe("2024-03-05")
    expect(dateTimeInput.value).not.toBe("")
  })
})
