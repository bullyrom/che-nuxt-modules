<script setup lang="ts">
// eslint-disable-next-line import/no-unresolved
import { storeToRefs } from "pinia"
import { computed, inject, provide, watch } from "vue"

import { getSchemaNameFromRef as getSchemaNameFromReference } from "../../stores/adminPanel/apiTypes"
import {
  ADMIN_ENTITY_STORE,
  useAdminPanelEntityStore,
} from "../../stores/adminPanel/entity"
import { useAdminPanelStore } from "../../stores/adminPanel/index"

import FieldRenderer from "./fields/FieldRenderer.vue"
import {
  buildBlankRecord,
  buildFieldDescriptors,
  FIELD_RENDER_CONTEXT,
  serializeRecord,
} from "./fields/registry"
import FormErrors from "./FormErrors.vue"
import RawValue from "./RawValue.vue"

import type { AdminPanelConfig } from "./fields/types"

interface Properties {
  baseUrl: string
  config?: AdminPanelConfig
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "saved") => void>()

const adminPanelStore = useAdminPanelStore()

const injectedStore = inject(ADMIN_ENTITY_STORE, undefined)
const store =
  injectedStore ??
  useAdminPanelEntityStore({
    baseUrl: properties.baseUrl,
    config: properties.config,
    entityPath: adminPanelStore.activeEntity?.fullBasePath ?? "none",
  })

const {
  editingRecord,
  form,
  formErrors,
  formIsOpen,
  isEditMode,
  sendFormRequestErrors,
  sendFormStatus,
} = storeToRefs(store)

const { closeForm, submitForm } = store

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

watch(formIsOpen, (isOpen) => {
  if (!isOpen) return
  form.value = editingRecord.value
    ? serializeRecord(editingRecord.value, schemaFields.value)
    : buildBlankRecord(schemaFields.value)
})

async function handleSubmit(submitEvent: SubmitEvent) {
  submitEvent.preventDefault()
  if (await submitForm()) emit("saved")
}
</script>

<template>
  <div
    v-if="formIsOpen"
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--ch-admin-overlay)] p-4 pt-[10vh]"
    @click.self="closeForm()"
  >
    <div
      class="w-full max-w-lg rounded-xl bg-[var(--ch-admin-surface)] text-[var(--ch-admin-text)] shadow-xl"
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
          @click="closeForm()"
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
            class="rounded border border-[var(--ch-admin-border)] px-5 py-2 text-sm text-[var(--ch-admin-text-muted)] transition-colors hover:bg-[var(--ch-admin-surface-hover)]"
            type="button"
            @click="closeForm()"
          >
            Cancel
          </button>
          <button
            class="rounded border border-[var(--ch-admin-border)] bg-[var(--ch-admin-bg)] px-5 py-2 text-sm font-medium text-[var(--ch-admin-text)] transition-colors hover:bg-[var(--ch-admin-surface-hover)] disabled:opacity-50"
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
