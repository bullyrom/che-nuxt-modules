<template>
  <div>
    <ContainerMarginRight
      :active="valideContainerMarginRightActive === true"
      class="overflow-x-auto"
    >
      <div
        :class="
          valideContainerMarginRightActive === true &&
          'pl-[15px] sm:pl-[30px] xl:pl-0'
        "
      >
        <div class="w-full overflow-auto">
          <div class="flex pb-1.5" role="tablist">
            <div v-for="(tab, index) in tabs" :key="index" class="flex">
              <div v-if="index !== 0" class="flex flex-col justify-between">
                <div />

                <div class="h-0.5 w-[45px] bg-slate-300" />
              </div>

              <h2>
                <button
                  :id="`tab-${index}`"
                  :aria-selected="selectedCardIndex === index"
                  :aria-controls="`tabpanel-${index}`"
                  role="tab"
                  :class="
                    selectedCardIndex === index
                      ? 'font-bold text-blue-700'
                      : 'font-normal text-zinc-800'
                  "
                  class="px-2.5 pb-2.5 font-['Manrope'] text-lg whitespace-nowrap"
                  @click="
                    () => {
                      onButtonClick(index, tab)
                    }
                  "
                >
                  {{ tab.title }}
                </button>

                <div
                  class="h-0.5"
                  :class="
                    selectedCardIndex === index
                      ? 'bg-blue-700'
                      : 'bg-slate-300'
                  "
                />
              </h2>

              <div v-if="index === tabs.length - 1" class="w-5" />
            </div>
          </div>
        </div>
      </div>
    </ContainerMarginRight>

    <div class="overflow-hidden">
      <div
        :id="`tabpanel-${selectedCardIndex ?? 0}`"
        ref="card"
        :aria-labelledby="`tab-${selectedCardIndex ?? 0}`"
        role="tabpanel"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { title: string }">
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core"
import { animate } from "animejs"
import { computed, ref } from "vue"

import ContainerMarginRight from "./ContainerMarginRight.vue"

import type { JSAnimation } from "animejs"
import type { PropType } from "vue"

const properties = defineProps({
  containerMarginRightActive: {
    default: undefined,
    required: false,
    type: Boolean,
  },
  tabs: {
    required: true,
    type: Array as PropType<T[]>,
  },
})

const emit = defineEmits<(event: "button-click", tab: T) => void>()

const breakpoints = useBreakpoints(breakpointsTailwind)
const isSmallScreen = breakpoints.smaller("sm")

const selectedCardIndex = defineModel<number>("active-index")

const card = ref<Element>()
const cardAnimation = ref<JSAnimation>()

const defaultContainerMarginRightActive = computed(() => isSmallScreen.value)

const valideContainerMarginRightActive = computed(() =>
  properties.containerMarginRightActive === undefined
    ? defaultContainerMarginRightActive.value
    : properties.containerMarginRightActive,
)

function onButtonClick(index: number, tab: T) {
  emit("button-click", tab)
  setSelectedCardIndex(index)
}

function setSelectedCardIndex(value: number) {
  const oldValue = selectedCardIndex.value
  const translateXfrom =
    oldValue !== undefined && value > oldValue ? "100%" : "-100%"
  selectedCardIndex.value = value
  if (oldValue !== value) {
    cardAnimation.value?.pause()
    if (card.value) {
      cardAnimation.value = animate(card.value, {
        duration: 100,
        ease: "outQuad",
        opacity: [0, 1],
        translateX: [translateXfrom, "0%"],
      })
    }
  }
}
</script>
