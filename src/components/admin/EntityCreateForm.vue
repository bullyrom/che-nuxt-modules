<script setup lang="ts">
import { computed, provide, watch } from "vue"

import { useFormApi } from "../../composables/api"
import { getSchemaNameFromRef as getSchemaNameFromReference } from "../../stores/adminPanel/apiTypes"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import FieldRenderer from "./fields/FieldRenderer.vue"
import {
  buildBlankRecord,
  buildFieldDescriptors,
  FIELD_RENDER_CONTEXT,
  isRecord,
  serializeRecord,
} from "./fields/registry"
import FormErrors from "./FormErrors.vue"
import RawValue from "./RawValue.vue"

import type { AdminPanelConfig } from "./fields/types"

interface Properties {
  baseUrl: string
  config?: AdminPanelConfig
  editRecord?: Record<string, unknown> | undefined
  show: boolean
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "close" | "saved") => void>()

const adminPanelStore = useAdminPanelStore()

const isEditMode = computed(() => properties.editRecord !== undefined)

const schemaFields = computed(() =>
  buildFieldDescriptors(
    adminPanelStore.activeEntityCreateSchema,
    adminPanelStore.schema?.components?.schemas,
  ),
)

const createSchemaName = computed(() => {
  const { requestBody } = adminPanelStore.activeEntity?.createOperation ?? {}
  if (requestBody && "$ref" in requestBody) {
    return getSchemaNameFromReference(requestBody)
  }
  return undefined
})

const fieldOverrides = computed(() => {
  const schemaName = createSchemaName.value
  if (!schemaName) return undefined
  return properties.config?.fields?.overrides?.[schemaName]
})

provide(FIELD_RENDER_CONTEXT, {
  get components() {
    return properties.config?.fields?.defaultComponents
  },
})

const { form, formErrors, sendForm, sendFormRequestErrors, sendFormStatus } =
  useFormApi<Record<string, unknown>>({
    blankForm: {},
    method: "post",
    url: "",
  })

const REQUEST_ERROR_MESSAGE = "Failed to save record"

function resetForm() {
  form.value = properties.editRecord
    ? serializeRecord(properties.editRecord, schemaFields.value)
    : buildBlankRecord(schemaFields.value)
  sendFormStatus.value = "idle"
  formErrors.value = undefined
  sendFormRequestErrors.value = undefined
}

watch(
  () => properties.show,
  (isShown) => {
    if (isShown) resetForm()
  },
)

const submitUrl = computed(() => {
  const entity = adminPanelStore.activeEntity
  if (!entity?.fullBasePath) return ""

  if (isEditMode.value && properties.editRecord) {
    const recordId = properties.editRecord.id ?? properties.editRecord.pk
    if (recordId !== undefined) {
      return `${properties.baseUrl}${entity.fullBasePath}${String(recordId)}/`
    }
  }

  return `${properties.baseUrl}${entity.fullBasePath}`
})

async function applyBeforeHook(payload: Record<string, unknown>) {
  const { hooks } = properties.config ?? {}
  const hook = isEditMode.value ? hooks?.beforeUpdate : hooks?.beforeCreate
  const result = await hook?.(payload)
  return isRecord(result) ? result : payload
}

async function applyAfterHook(record: unknown) {
  const { hooks } = properties.config ?? {}
  await (isEditMode.value
    ? hooks?.afterUpdate?.(record)
    : hooks?.afterCreate?.(record))
}

async function handleSubmit(submitEvent: SubmitEvent) {
  submitEvent.preventDefault()

  try {
    const body = await applyBeforeHook(form.value)
    const record = await sendForm({
      form: body,
      method: isEditMode.value ? "patch" : "post",
      url: submitUrl.value,
    })

    if (sendFormStatus.value === "success") {
      await applyAfterHook(record)
      emit("saved")
      return
    }

    if (sendFormStatus.value === "error" && formErrors.value === undefined) {
      sendFormRequestErrors.value = REQUEST_ERROR_MESSAGE
    }
  } catch {
    sendFormRequestErrors.value = REQUEST_ERROR_MESSAGE
    sendFormStatus.value = "error"
  }
}

function handleClose() {
  emit("close")
}
</script>

<template>
  <div
    v-if="properties.show"
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--ch-admin-overlay)] p-4 pt-[10vh]"
    @click.self="handleClose()"
  >
    <div
      class="w-full max-w-lg rounded-[var(--ch-admin-radius-lg)] bg-[var(--ch-admin-surface)] text-[var(--ch-admin-text)] shadow-xl"
    >
      <div
        class="flex items-center justify-between border-b border-[var(--ch-admin-border)] px-6 py-4"
      >
        <h2 class="text-lg font-semibold text-[var(--ch-admin-text)]">
          {{ isEditMode ? "Edit" : "Create" }}
          {{ adminPanelStore.activeEntity?.entityName ?? "record" }}
        </h2>
        <button
          class="text-[var(--ch-admin-text-muted)] transition-colors hover:text-[var(--ch-admin-text)]"
          @click="handleClose()"
        >
          ✕
        </button>
      </div>

      <form class="px-6 py-4" @submit="handleSubmit">
        <div class="space-y-4">
          <FieldRenderer
            v-for="field in schemaFields"
            :key="field.key"
            v-model="form[field.key]"
            :field="field"
            :override="fieldOverrides?.[field.key]"
          />

          <div v-if="schemaFields.length === 0" class="space-y-2">
            <p class="text-xs text-[var(--ch-admin-text-muted)]">
              This schema cannot be rendered as a form. Raw schema:
            </p>
            <RawValue :value="adminPanelStore.activeEntityCreateSchema" />
          </div>
        </div>

        <FormErrors :errors="formErrors" class="mt-4" />

        <div
          v-if="sendFormRequestErrors"
          class="mt-2 text-sm text-[var(--ch-admin-danger-text)]"
        >
          {{ sendFormRequestErrors }}
        </div>

        <div
          class="mt-6 flex justify-end gap-3 border-t border-[var(--ch-admin-border)] pt-4"
        >
          <button
            class="rounded-[var(--ch-admin-radius-sm)] border border-[var(--ch-admin-border)] px-5 py-2 text-sm text-[var(--ch-admin-text-muted)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
            type="button"
            @click="handleClose()"
          >
            Cancel
          </button>
          <button
            class="rounded-[var(--ch-admin-radius-sm)] bg-[var(--ch-admin-accent)] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--ch-admin-accent-hover)] disabled:opacity-50"
            :disabled="sendFormStatus === 'pending'"
            type="submit"
          >
            {{
              sendFormStatus === "pending"
                ? "Saving..."
                : isEditMode
                  ? "Save"
                  : "Create"
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
