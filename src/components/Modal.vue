<template>
  <TransitionRoot as="template" :show="valideShow">
    <Dialog class="relative z-10" @close="setClose">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-[var(--ch-admin-overlay,rgba(0,0,0,0.5))] transition-opacity"
        />
      </TransitionChild>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="relative w-full transform overflow-hidden rounded-lg bg-[var(--ch-admin-surface,#fff)] text-[var(--ch-admin-text,inherit)] shadow-xl transition-all"
              :style="`max-width: ${maxWidth}`"
            >
              <slot />
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue"
import { computed } from "vue"

const properties = defineProps({
  maxWidth: { default: "520px", type: String },
  show: { default: undefined, type: Boolean },
})

const showModel = defineModel<boolean>("show")
const valideShow = computed(() =>
  properties.show === undefined ? showModel.value : properties.show,
)

const emit = defineEmits<(emit: "setVisible", value: boolean) => void>()

function setClose() {
  emit("setVisible", false)
  showModel.value = false
}
</script>
