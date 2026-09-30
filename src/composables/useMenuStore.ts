// eslint-disable-next-line import/no-unresolved
import { defineStore } from "pinia"
import { ref } from "vue"

/**
 * Shared UI state for the site menu: navigation sidebar visibility
 * and header search input visibility.
 */
export const useMenuStore = defineStore("menu", () => {
  const navigationSlidebarIsOpen = ref(false)
  const showSearchInput = ref(false)

  function setNavigationSlidebarIsOpen(value: boolean) {
    navigationSlidebarIsOpen.value = value
  }

  function openNavigationSlidebar() {
    navigationSlidebarIsOpen.value = true
  }

  function closeNavigationSlidebar() {
    navigationSlidebarIsOpen.value = false
  }

  return {
    closeNavigationSlidebar,
    navigationSlidebarIsOpen,
    openNavigationSlidebar,
    setNavigationSlidebarIsOpen,
    showSearchInput,
  }
})
