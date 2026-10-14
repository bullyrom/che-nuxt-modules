<script setup lang="ts">
import { computed } from "vue"

import FileInput from "../../../FileInput.vue"

import type { FieldDescriptor } from "../types"

interface Properties {
  accept?: string
  field?: FieldDescriptor
  multiple?: boolean
}

const properties = defineProps<Properties>()
const model = defineModel<unknown>()

const fileList = computed<File[]>(() => {
  const { value } = model
  if (Array.isArray(value)) {
    return value.filter((item): item is File => item instanceof File)
  }
  if (value instanceof File) return [value]
  return []
})

const fileNames = computed(() =>
  fileList.value.map((file) => file.name).join(", "),
)

function handleChange(files: File[]) {
  model.value = properties.multiple === false ? files[0] : files
}
</script>

<template>
  <div class="space-y-1">
    <FileInput
      :accept="properties.accept"
      :multiple="properties.multiple"
      :model-value="fileList"
      @change="handleChange"
    >
      <template #default="{ isOver }">
        <span
          class="inline-block rounded border border-dashed border-[var(--ch-admin-border,#d1d5db)] px-3 py-2 text-xs text-[var(--ch-admin-text-muted,#6b7280)]"
        >
          {{ isOver ? "Drop file here" : "Choose file" }}
        </span>
      </template>
    </FileInput>

    <p
      v-if="fileNames"
      class="text-xs text-[var(--ch-admin-text-muted,#6b7280)]"
    >
      {{ fileNames }}
    </p>
  </div>
</template>
