<script setup lang="ts">
import FieldLabel from "./FieldLabel.vue"

interface Properties {
  /** Optional field heading rendered above the link. */
  heading?: string
  /** Visible file name; falls back to the file name from `src`. */
  label?: string
  src?: string
}

const properties = defineProps<Properties>()

const LAST_SEGMENT_INDEX = -1
const URL_BASE = "http://localhost"

/** Uses the last URL segment as the file name when no label is supplied. */
function fileNameFromSource(source: string | undefined): string | undefined {
  if (source === undefined || source === "") return undefined
  try {
    const url = new URL(source, URL_BASE)
    const segments = url.pathname
      .split("/")
      .filter((segment) => segment !== "")
    const fileName = segments.at(LAST_SEGMENT_INDEX)
    return fileName === undefined ? source : decodeURIComponent(fileName)
  } catch {
    return source
  }
}
</script>

<template>
  <div v-if="properties.src" class="space-y-1">
    <FieldLabel v-if="properties.heading" :label="properties.heading" />
    <a
      class="inline-block text-[var(--ch-admin-accent,#3b5cf6)] underline"
      download
      :href="properties.src"
    >
      {{ properties.label ?? fileNameFromSource(properties.src) }}
    </a>
  </div>
</template>
