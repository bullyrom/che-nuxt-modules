<script setup lang="ts">
import { FetchError, ofetch } from "ofetch"
import { computed, provide, ref, watch } from "vue"

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

import type { RequestStatus } from "../../types"
import type { AdminPanelConfig } from "./fields/types"

const HTTP_STATUS_BAD_REQUEST = 400

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

const form = ref<Record<string, unknown>>({})
const sendStatus = ref<RequestStatus>("idle")
const formErrors = ref<Record<string, string[] | undefined>>()
const requestError = ref<string>()

function resetForm() {
  form.value = properties.editRecord
    ? serializeRecord(properties.editRecord, schemaFields.value)
    : buildBlankRecord(schemaFields.value)
  sendStatus.value = "idle"
  formErrors.value = undefined
  requestError.value = undefined
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

const submitMethod = computed(() => (isEditMode.value ? "patch" : "post"))

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
  sendStatus.value = "pending"
  formErrors.value = undefined
  requestError.value = undefined

  try {
    const body = await applyBeforeHook(form.value)
    const record = await ofetch<unknown>(submitUrl.value, {
      body,
      method: submitMethod.value,
    })
    await applyAfterHook(record)
    sendStatus.value = "success"
    emit("saved")
  } catch (catchError) {
    if (
      catchError instanceof FetchError &&
      catchError.statusCode === HTTP_STATUS_BAD_REQUEST
    ) {
      formErrors.value = catchError.data as Record<
        string,
        string[] | undefined
      >
    } else {
      requestError.value = "Failed to save record"
    }
    sendStatus.value = "error"
  }
}

function handleClose() {
  emit("close")
}
</script>

<template>
  <div
    v-if="properties.show"
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-[10vh]"
    @click.self="handleClose()"
  >
    <div class="w-full max-w-lg rounded-xl bg-white shadow-xl">
      <div
        class="flex items-center justify-between border-b border-gray-200 px-6 py-4"
      >
        <h2 class="text-lg font-semibold text-gray-800">
          {{ isEditMode ? "Edit" : "Create" }}
          {{ adminPanelStore.activeEntity?.entityName ?? "record" }}
        </h2>
        <button
          class="text-gray-400 transition-colors hover:text-gray-600"
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
        </div>

        <FormErrors :errors="formErrors" class="mt-4" />

        <div v-if="requestError" class="mt-2 text-sm text-red-500">
          {{ requestError }}
        </div>

        <div class="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            class="rounded border border-gray-300 px-5 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            type="button"
            @click="handleClose()"
          >
            Cancel
          </button>
          <button
            class="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            :disabled="sendStatus === 'pending'"
            type="submit"
          >
            {{
              sendStatus === "pending"
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
