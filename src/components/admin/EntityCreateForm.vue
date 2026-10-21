<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed, provide, watch } from "vue"

import {
  getRequestSchema,
  getSchemaNameFromRef as getSchemaNameFromReference,
} from "../../stores/adminPanel/apiTypes"
import { useAdminPanelFormStore } from "../../stores/adminPanel/form"
import { useAdminPanelStore } from "../../stores/adminPanel/index"
import { resolveEntityConfig } from "../../stores/adminPanel/instance"

import { formConfigToPanelConfig } from "./config"
import FieldGroupRenderer from "./FieldGroupRenderer.vue"
import FieldRenderer from "./fields/FieldRenderer.vue"
import {
  buildBlankRecord,
  buildFieldDescriptors,
  FIELD_RENDER_CONTEXT,
  serializeRecord,
} from "./fields/registry"
import FormErrors from "./FormErrors.vue"

import type { AdminFormConfig, AdminPanelConfig } from "./fields/types"
import type { ParsedEntity } from "../../stores/adminPanel/types"

interface Properties {
  baseUrl: string
  config?: AdminPanelConfig
  entity?: ParsedEntity
  /** Embedded-form config fragment (used when `config` is not passed). */
  formConfig?: AdminFormConfig
  instanceKey?: string
}

const properties = defineProps<Properties>()
const emit = defineEmits<(event: "saved") => void>()

const adminPanelStore = useAdminPanelStore()

const store = useAdminPanelFormStore({
  baseUrl: properties.baseUrl,
  config: properties.config,
  entity: () => properties.entity,
  instanceKey: properties.instanceKey ?? "admin-1",
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

const currentEntity = computed(
  () => properties.entity ?? adminPanelStore.activeEntity,
)
const instanceConfig = computed(
  () =>
    properties.config ??
    (properties.formConfig === undefined
      ? undefined
      : formConfigToPanelConfig(
          properties.formConfig,
          currentEntity.value?.entityName,
        )) ??
    adminPanelStore.config,
)

const createRequestSchema = computed(() =>
  getRequestSchema(currentEntity.value?.createOperation),
)

const schemaFields = computed(() =>
  buildFieldDescriptors(
    adminPanelStore.resolveSchema(createRequestSchema.value),
    adminPanelStore.schema?.components?.schemas,
  ),
)

const createSchemaName = computed(() => {
  const schema = createRequestSchema.value
  if (schema && "$ref" in schema) {
    return getSchemaNameFromReference(schema)
  }
  return undefined
})

const fieldOverrides = computed(() => {
  const schemaName = createSchemaName.value
  if (!schemaName) return undefined
  return instanceConfig.value?.fields?.overrides?.[schemaName]
})

const formOverride = computed(
  () =>
    resolveEntityConfig(instanceConfig.value, currentEntity.value)
      ?.formOverride,
)

const hiddenKeys = computed(
  () => new Set<string>(formOverride.value?.hiddenFields),
)

const visibleFields = computed(() =>
  schemaFields.value.filter((field) => !hiddenKeys.value.has(field.key)),
)

provide(FIELD_RENDER_CONTEXT, {
  get components() {
    return instanceConfig.value?.fields?.defaultComponents
  },
  get formats() {
    return instanceConfig.value?.fields?.formats
  },
})

watch(formIsOpen, (isOpen) => {
  if (!isOpen) return
  form.value = editingRecord.value
    ? serializeRecord(editingRecord.value, schemaFields.value)
    : buildBlankRecord(schemaFields.value)
})

function handleFormGroupChange(changed: Record<string, unknown>) {
  Object.assign(form.value, changed)
}

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
          {{ currentEntity?.entityName ?? "record" }}
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
            v-for="field in visibleFields"
            :key="field.key"
            v-model="form[field.key]"
            :field="field"
            :override="fieldOverrides?.[field.key]"
          />

          <FieldGroupRenderer
            v-if="formOverride"
            :override="formOverride"
            :value="form"
            :on-change="handleFormGroupChange"
          />
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
