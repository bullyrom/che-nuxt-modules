<template>
  <div>
    <div :class="listClass">
      <div v-for="(item, index) in items" :key="index">
        <slot :item="item" :index="index" />

        <div v-if="isTriggerItem(index)" ref="triggerElement" />
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
import { onMounted, ref, watch } from "vue"

import MainLoader from "./MainLoader.vue"

import type { PropType } from "vue"

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

// The visibility observers are attached in `onMounted` (client only) instead of
// with `v-element-visibility`: directives would make the server render a
// placeholder comment where the client renders the element, breaking hydration.
const triggerElement = ref<HTMLElement>()
const loaderElement = ref<HTMLElement>()
const triggerIsVisible = useElementVisibility(triggerElement)
const loaderIsVisible = useElementVisibility(loaderElement)

function isTriggerItem(index: number): boolean {
  if (properties.items === undefined) return false
  return (
    properties.items.length - properties.fetchVisibleItemNumber + 1 ===
    index + 1
  )
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
  watch(triggerIsVisible, onElementVisibility)
  watch(loaderIsVisible, onElementVisibility)
})
</script>
