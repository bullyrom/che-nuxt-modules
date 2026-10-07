<template>
  <div
    ref="tooltip"
    v-on-click-outside="() => setOpen(false)"
    class="relative"
  >
    <div v-element-hover="setOpen" @click="onTriggerClick">
      <slot name="trigger" />
    </div>

    <DroppingBody
      v-model="open"
      :trigger-height="triggerHeight"
      :distance="distance"
      :position="position"
      :unmount-on-close="unmountOnClose"
    >
      <slot />
    </DroppingBody>
  </div>
</template>

<script setup lang="ts">
import { vElementHover, vOnClickOutside } from "@vueuse/components"
import { useElementSize } from "@vueuse/core"
import { ref, useTemplateRef } from "vue"

import DroppingBody from "./DroppingBody.vue"

import type { PropType } from "vue"

const properties = defineProps({
  distance: {
    default: 0,
    required: false,
    type: Number,
  },
  openOnClick: {
    default: false,
    required: false,
    type: Boolean,
  },
  position: {
    default: "bottom-center",
    required: false,
    type: String as PropType<
      | "bottom-center"
      | "bottom-end"
      | "bottom-start"
      | "top-center"
      | "top-end"
      | "top-start"
    >,
  },
  unmountOnClose: {
    default: false,
    required: false,
    type: Boolean,
  },
})

const tooltip = useTemplateRef<HTMLDivElement>("tooltip")
const { height: triggerHeight } = useElementSize(tooltip)

const open = ref<boolean>(false)

function setOpen(value: boolean) {
  open.value = value
}

function onTriggerClick() {
  if (properties.openOnClick) {
    setOpen(true)
  }
}
</script>
