<template>
  <UseElementBounding v-if="show" v-slot="{ left, bottom, width }">
    <div
      ref="openElement"
      class="absolute z-10 origin-top-right opacity-0 focus:outline-none"
      style="transform: scale(0.95)"
      :style="getPositionStyles(left, bottom, width)"
    >
      <slot />
    </div>
  </UseElementBounding>

  <div v-else-if="unmountOnClose === false" class="hidden">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { UseElementBounding } from "@vueuse/components"
import { useWindowSize } from "@vueuse/core"
import { animate } from "animejs"
import { computed, nextTick, ref, watch } from "vue"

import type { JSAnimation } from "animejs"
import type { PropType } from "vue"

/** Scale the element shrinks to while closed. */
const closedScale = 0.95

/** Axis dimensions used to position the dropping element. */
interface PositionDimensions {
  height: number
  triggerHeight: number
  triggerWidth: number
  width: number
}

/** Resolved inline styles of the dropping element. */
interface PositionStyles {
  bottom?: number
  left?: number
  paddingBottom?: number
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  right?: number
  top?: number
}

// as PropType<"bottom-start" | "bottom-end">
const properties = defineProps({
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
  triggerHeight: {
    required: true,
    type: Number,
  },
  unmountOnClose: {
    default: false,
    required: false,
    type: Boolean,
  },
})

const animation = ref<JSAnimation>()
const { height: windowHeight, width: windowWidth } = useWindowSize()

const needShow = defineModel<boolean>()
const openElement = ref()
const show = ref<boolean>(false)

const positionParameters = computed(() => properties.position.split("-"))

/**
 * Fixes a cross-axis position so the element stays inside the viewport.
 */
function fixedOutsidePosition(
  oldPosition: number,
  toStart: number,
  toEnd: number,
) {
  // Indentations taking into account the old position.
  const currentToStart = toStart + oldPosition
  const currentToEnd = toEnd - oldPosition

  if (currentToStart < 0) {
    return toStart * -1
  }
  if (currentToEnd > 0) {
    return oldPosition
  }

  // Need fix outsite end.
  const needFixPostionValue = oldPosition - currentToEnd * -1
  return currentToStart - oldPosition < needFixPostionValue * -1
    ? currentToStart * -1 + oldPosition
    : needFixPostionValue
}

/** Positions a `top`/`bottom` element on the horizontal cross axis. */
function applyBottomOrTopPosition(
  styles: PositionStyles,
  parameters: string[],
  dimensions: PositionDimensions,
) {
  const { triggerWidth, width } = dimensions

  if (parameters.includes("start")) styles.left = 0
  if (parameters.includes("center")) {
    styles.left = (width / 2) * -1 + triggerWidth / 2
  }
  if (parameters.includes("end")) styles.left = (width - triggerWidth) * -1
}

/** Positions a `left`/`right` element on the vertical cross axis. */
function applyLeftOrRightPosition(
  styles: PositionStyles,
  parameters: string[],
  dimensions: PositionDimensions,
) {
  const { height, triggerHeight } = dimensions

  if (parameters.includes("start")) styles.top = triggerHeight * -1
  if (parameters.includes("center")) styles.bottom = (height / 2) * -1
  if (parameters.includes("end")) styles.bottom = triggerHeight
}

/**
 * Positions the element on the cross axis (start/center/end) for the given
 * vertical (`top`/`bottom`) or horizontal (`left`/`right`) placement.
 */
function applyCrossAxisPosition(
  styles: PositionStyles,
  parameters: string[],
  dimensions: PositionDimensions,
) {
  const isVertical =
    parameters.includes("top") || parameters.includes("bottom")

  if (isVertical) applyBottomOrTopPosition(styles, parameters, dimensions)
  else applyLeftOrRightPosition(styles, parameters, dimensions)

  if (parameters.includes("left")) styles.left = dimensions.width * -1
  if (parameters.includes("right")) styles.left = dimensions.triggerWidth
}

/**
 * Flips the element to the opposite side when there is no room on the
 * requested top/bottom side.
 */
function applyMainAxisFallback(
  styles: PositionStyles,
  parameters: string[],
  context: {
    bottomSpace: number
    distance: number
    height: number
    toTop: number
    triggerHeight: number
  },
) {
  const { bottomSpace, distance, height, toTop, triggerHeight } = context

  function bodyToBottom() {
    styles.paddingTop = distance
  }

  function bodyToTop() {
    styles.bottom = triggerHeight
    styles.paddingBottom = distance
  }

  if (parameters.includes("bottom")) {
    const noSpaceInBottom = bottomSpace < height
    if (noSpaceInBottom && toTop > bottomSpace) {
      bodyToTop()
    } else {
      bodyToBottom()
    }
  }
  if (parameters.includes("top")) {
    if (toTop < height + triggerHeight && toTop < bottomSpace) {
      bodyToBottom()
    } else {
      bodyToTop()
    }
  }
}

function getPositionStyles(
  toLeft: number,
  toTop: number,
  triggerWidth: number,
) {
  const width = openElement.value?.offsetWidth
  const height = openElement.value?.clientHeight
  const rightPosition = toLeft + width

  const toRight = windowWidth.value - rightPosition

  const parameters = positionParameters.value
  const styles: PositionStyles = {}

  applyCrossAxisPosition(styles, parameters, {
    height,
    triggerHeight: properties.triggerHeight,
    triggerWidth,
    width,
  })

  // Fix start or end is outside.
  if (styles.left !== undefined) {
    styles.left = fixedOutsidePosition(styles.left, toLeft, toRight)
  }

  const bottomSpace =
    toTop > 0 ? windowHeight.value - toTop : windowHeight.value
  applyMainAxisFallback(styles, parameters, {
    bottomSpace,
    distance: properties.distance,
    height,
    toTop,
    triggerHeight: properties.triggerHeight,
  })

  return {
    bottom: styles.bottom && `${styles.bottom}px`,
    left: styles.left && `${styles.left}px`,
    paddingBottom: styles.paddingBottom && `${styles.paddingBottom}px`,
    paddingLeft: styles.paddingLeft && `${styles.paddingLeft}px`,

    paddingRight: styles.paddingRight && `${styles.paddingRight}px`,
    paddingTop: styles.paddingTop && `${styles.paddingTop}px`,
    right: styles.right && `${styles.right}px`,
    top: styles.top && `${styles.top}px`,
  }
}

async function runAnimate(open: boolean | undefined) {
  if (open === undefined) {
    return
  }
  animation.value?.pause()
  show.value = true
  await nextTick()
  // eslint-disable-next-line require-atomic-updates
  animation.value = animate(openElement.value, {
    duration: 100,
    ease: "outQuad",
    onComplete() {
      if (open === false) {
        show.value = false
      }
    },
    opacity: open === true ? 1 : 0,
    scale: open === true ? 1 : closedScale,
  })
}

watch(needShow, runAnimate)
</script>
