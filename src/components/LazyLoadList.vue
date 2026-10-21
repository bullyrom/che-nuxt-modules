<template>
  <div>
    <div :class="listClass">
      <div
        v-for="(item, index) in items"
        :key="index"
        :ref="(element) => registerTrigger(element, index)"
      >
        <slot :item="item" :index="index" />
      </div>
    </div>

    <div
      v-if="showLoader"
      ref="loaderElement"
      :class="items && items.length > 0 ? 'h-[250px]' : 'h-[60vh]'"
    >
      <MainLoader :wh="60" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="ElementType">
import { useElementVisibility } from "@vueuse/core"
import { computed, onMounted, ref, watch } from "vue"

import MainLoader from "./MainLoader.vue"

import type { ComponentPublicInstance, PropType } from "vue"

const properties = defineProps({
  fetchVisibleItemNumber: { required: true, type: Number },
  items: {
    required: false,
    type: Array as PropType<ElementType[]>,
  },
  listClass: { required: false, type: String },
  showLoader: { required: true, type: Boolean },
})

const emit = defineEmits<(event: "fetchNextPage") => Promise<void>>()

const isFetchingNext = ref(false)

// The visibility observers are attached in `onMounted` (client only). The
// trigger is bound to the wrapper of the trigger item via a function ref — no
// extra `v-if` node and, crucially, no `v-if` comment anchors inside the
// `v-for`, which were the source of the server/client hydration difference.
const triggerElement = ref<HTMLElement>()
const loaderElement = ref<HTMLElement>()
const triggerIsVisible = useElementVisibility(triggerElement)
const loaderIsVisible = useElementVisibility(loaderElement)

const triggerIndex = computed(() =>
  properties.items === undefined
    ? -1
    : properties.items.length - properties.fetchVisibleItemNumber,
)

function registerTrigger(
  element: ComponentPublicInstance | Element | null,
  index: number,
) {
  if (element instanceof HTMLElement && index === triggerIndex.value) {
    triggerElement.value = element
  }
}

async function onElementVisibility(state: boolean) {
  const isFetching = isFetchingNext.value
  if (
    state === true &&
    properties.items !== undefined &&
    properties.items.length > 0 &&
    !isFetching
  ) {
    isFetchingNext.value = true
    try {
      await emit("fetchNextPage")
    } finally {
      // eslint-disable-next-line require-atomic-updates
      isFetchingNext.value = false
    }
  }
}

onMounted(() => {
  // React to visibility changes and to appended records. A trigger that is
  // already visible when the list mounts must load the next page too, and the
  // next trigger may still be visible after a page is appended.
  watch(
    [triggerIsVisible, loaderIsVisible, () => properties.items?.length],
    () => {
      if (triggerIsVisible.value || loaderIsVisible.value) {
        onElementVisibility(true).catch(() => undefined)
      }
    },
    { immediate: true },
  )
})
</script>
