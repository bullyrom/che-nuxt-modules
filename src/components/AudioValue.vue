<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"

import FieldLabel from "./FieldLabel.vue"

interface Properties {
  /** Optional field heading rendered above the player. */
  heading?: string
  /** Visible track name; falls back to the file name from `src`. */
  label?: string
  src?: string
}

const properties = defineProps<Properties>()

const FALLBACK_LABEL = "Audio"
const LAST_SEGMENT_INDEX = -1
const URL_BASE = "http://localhost"

const isPlayerVisible = ref(false)
const audioElement = ref<HTMLAudioElement>()

/** Uses the last URL segment as the track name when no label is supplied. */
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

const trackLabel = computed(() => {
  if (properties.label !== undefined && properties.label !== "") {
    return properties.label
  }
  return fileNameFromSource(properties.src) ?? FALLBACK_LABEL
})

async function startPlayback() {
  isPlayerVisible.value = true
  await nextTick()
  await audioElement.value?.play().catch(() => undefined)
}

watch(
  () => properties.src,
  () => {
    isPlayerVisible.value = false
  },
)
</script>

<template>
  <div v-if="properties.src" class="space-y-2">
    <FieldLabel v-if="properties.heading" :label="properties.heading" />
    <div class="flex items-center gap-2">
      <button
        :aria-label="`Play ${trackLabel}`"
        class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ch-admin-border,#d1d5db)] bg-[var(--ch-admin-surface,#fff)] text-sm text-[var(--ch-admin-text,#111827)] transition-colors hover:bg-[var(--ch-admin-surface-hover,#f3f4f6)]"
        type="button"
        @click="startPlayback"
      >
        ▶
      </button>
      <span class="truncate text-sm text-[var(--ch-admin-text,#111827)]">
        {{ trackLabel }}
      </span>
    </div>

    <audio
      v-if="isPlayerVisible"
      ref="audioElement"
      :src="properties.src"
      class="w-full"
      controls
      preload="none"
    />
  </div>
</template>
