<template>
  <div ref="droppingElement" as="div" class="relative">
    <!-- <div v-element-hover="setTooltipIsHovered" @click="() => open"> -->
    <!--   <slot name="trigger" /> -->
    <!-- </div> -->

    <DroppingBody
      v-model="dropdownIsHovered"
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
import { useElementHover, useElementSize } from "@vueuse/core"
import { useTemplateRef } from "vue"

import DroppingBody from "./DroppingBody.vue"

import type { PropType } from "vue"

defineProps({
  distance: {
    default: 0,
    required: false,
    type: Number,
  },
  position: {
    default: "bottom-start",
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

const droppingElement = useTemplateRef<HTMLDivElement>("droppingElement")
const dropdownIsHovered = useElementHover(droppingElement)
const { height: triggerHeight } = useElementSize(droppingElement)

// const open = defineModel<boolean>()
</script>
