<script setup lang="ts">
import { computed } from "vue"

import VideoValue from "../../../VideoValue.vue"

import FileField from "./FileField.vue"

import type { FieldDescriptor } from "../types"

interface Properties {
  accept?: string
  field?: FieldDescriptor
  /** Optional field heading rendered above the current media. */
  heading?: string
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
    <VideoValue
      v-if="currentUrl"
      :heading="properties.heading"
      :src="currentUrl"
    />
    <FileField
      v-model="model"
      :accept="properties.accept ?? 'video/*'"
      :field="properties.field"
      :multiple="false"
    />
  </div>
</template>
