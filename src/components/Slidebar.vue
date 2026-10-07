<template>
  <div v-if="!(unmountOnClose === true && show === false)">
    <div v-show="show" class="relative z-10">
      <div
        ref="background"
        class="bg-opacity-75 fixed top-0 right-0 bottom-0 left-0 z-11 overflow-y-scroll overscroll-none bg-gray-500 opacity-0"
        @click="close"
      />

      <div
        ref="body"
        class="fixed top-0 right-0 bottom-0 z-9 w-[320px] overflow-y-scroll overscroll-none bg-white"
        style="transform: translateX(100%)"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { animate } from "animejs"
import { computed, nextTick, ref, useTemplateRef, watch } from "vue"

import type { JSAnimation } from "animejs"

const properties = defineProps({
  open: { default: undefined, required: false, type: Boolean },
  unmountOnClose: {
    default: true,
    required: false,
    type: Boolean,
  },
})

const emit = defineEmits<(emit: "setOpen", value: boolean) => void>()

const openModel = defineModel<boolean>()
const valideOpen = computed(() =>
  properties.open === undefined ? openModel.value : properties.open,
)

const background = useTemplateRef("background")
const body = useTemplateRef("body")
const backgroundAnimation = ref<JSAnimation>()
const bodyAnimation = ref<JSAnimation>()
const backgroundShow = ref<boolean>(false)
const bodyShow = ref<boolean>(false)

const show = computed(
  () => backgroundShow.value === true || bodyShow.value === true,
)

watch(valideOpen, runAnimate)

function setValideOpen(value: boolean) {
  emit("setOpen", value)
  openModel.value = value
}

function close() {
  setValideOpen(false)
}

async function runAnimate(open: boolean | undefined) {
  if (open === undefined) {
    return
  }
  backgroundAnimation.value?.pause()
  bodyAnimation.value?.pause()
  backgroundShow.value = true
  bodyShow.value = true
  await nextTick()

  if (body.value) {
    // eslint-disable-next-line require-atomic-updates
    bodyAnimation.value = animate(body.value, {
      duration: 500,
      ease: "inOutQuad",
      onComplete() {
        if (open === false) {
          bodyShow.value = false
        }
      },
      translateX: open === true ? "0%" : "100%",
    })
  }

  if (background.value) {
    // eslint-disable-next-line require-atomic-updates
    backgroundAnimation.value = animate(background.value, {
      duration: 500,
      ease: "inOutQuad",
      onComplete() {
        if (open === false) {
          backgroundShow.value = false
        }
      },
      opacity: open === true ? 1 : 0,
    })
  }
}
</script>
