<script setup lang="ts">
import { computed } from "vue"

import AudioValue from "../../../AudioValue.vue"

import FileField from "./FileField.vue"

import type { FieldDescriptor } from "../types"

interface Properties {
  accept?: string
  field?: FieldDescriptor
}

const properties = defineProps<Properties>()
const model = defineModel<unknown>()

const currentUrl = computed(() =>
  typeof model.value === "string" && model.value !== ""
    ? model.value
    : undefined,
)
</script>

<template>
  <div class="space-y-2">
    <AudioValue v-if="currentUrl" :src="currentUrl" />
    <FileField
      v-model="model"
      :accept="properties.accept ?? 'audio/*'"
      :field="properties.field"
      :multiple="false"
    />
  </div>
</template>
