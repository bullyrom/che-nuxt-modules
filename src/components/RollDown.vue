<template>
  <div>
    <button
      v-if="!buttonDown"
      :class="buttonClasses"
      @click="switchNeedShowBody"
    >
      <slot name="button-content" :open="needShowBody">
        {{ title }}
      </slot>
    </button>

    <div ref="contentElement" class="h-0 overflow-y-hidden">
      <slot />
    </div>

    <button
      v-if="buttonDown"
      :class="buttonClasses"
      @click="switchNeedShowBody"
    >
      <slot name="button-content" :open="needShowBody">
        {{ title }}
      </slot>
    </button>
  </div>
</template>

<script setup lang="ts">
import { animate } from "animejs"
import { ref } from "vue"

import type { JSAnimation } from "animejs"

const minDuration = 250
const fallbackDuration = 200
/** Length of the `"px"` unit suffix. */
const cssPixelSuffixLength = 2

defineProps({
  buttonClasses: { required: false, type: String },
  buttonDown: { default: false, required: false, type: Boolean },
  title: { required: false, type: String },
  titleFont: { default: "Manrope", type: String },
})

const contentElement = ref<HTMLDivElement>()
const needShowBody = ref<boolean>(false)
const animation = ref<JSAnimation>()

function getFilledContendElementHeight() {
  if (contentElement.value === undefined) {
    return undefined
  }
  const currentValue = contentElement.value.style.height
  // temporarily change value
  contentElement.value.style.height = "auto"
  const tweenValue = getComputedStyle(contentElement.value).getPropertyValue(
    "height",
  )
  // reset original value
  contentElement.value.style.height = currentValue
  return tweenValue
}

function parseHeight(height: string) {
  if (
    height.length > cssPixelSuffixLength &&
    height.slice(-cssPixelSuffixLength) === "px"
  ) {
    const clearHeight = height.slice(0, -cssPixelSuffixLength)
    const parsedNumber = Number.parseInt(clearHeight, 10)
    return Number.isNaN(parsedNumber) ? undefined : parsedNumber
  }
  return undefined
}

function animationDuration(height: string | undefined) {
  if (height === undefined) {
    return undefined
  }
  const numberHeight = parseHeight(height)
  if (numberHeight === undefined) {
    return undefined
  }
  return Math.max(numberHeight, minDuration)
}

/** Resolves the anime.js `height` target for opening or closing. */
function resolveAnimationHeight(open: boolean, height: string | undefined) {
  if (open === true) {
    return height
  }

  const currentContentHeight = contentElement.value?.style.height
  if (!currentContentHeight) {
    return undefined
  }

  const startHeight =
    currentContentHeight === "auto" ? height : currentContentHeight
  return startHeight ? [startHeight, "0px"] : "0px"
}

function setShowBody(open: boolean) {
  animation.value?.pause()
  const height = getFilledContendElementHeight()
  if (open === true && height === undefined) {
    return
  }

  if (contentElement.value) {
    contentElement.value.style.overflowY = "hidden"
  }

  const duration = animationDuration(height) || fallbackDuration
  const animationHeight = resolveAnimationHeight(open, height)

  if (contentElement.value && animationHeight) {
    animation.value = animate(contentElement.value, {
      duration,
      ease: "inOutQuad",
      height: animationHeight,
      onComplete: () => {
        if (open === true && contentElement.value) {
          contentElement.value.style.overflowY = "visible"
          contentElement.value.style.height = "auto"
        }
      },
    })
  }
}

function switchNeedShowBody() {
  const oppositeValue = !needShowBody.value
  needShowBody.value = oppositeValue
  setShowBody(oppositeValue)
}
</script>
