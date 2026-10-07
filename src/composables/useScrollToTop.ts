import { ref } from "vue"

/** Scroll offset below which the element is considered to be at the top. */
const SCROLL_TOP_THRESHOLD = 0

/**
 * Tracks whether a scrollable element is scrolled down and provides a way to
 * scroll it back to the top. Bind the returned `containerRef` to the element;
 * show a "scroll to top" button while `isScrolledDown` is `true`.
 */
export function useScrollToTop() {
  const containerReference = ref<HTMLElement>()

  const isScrolledDown = ref(false)

  /** Syncs the button visibility with the current scroll position. */
  function updateIsScrolledDown() {
    const element = containerReference.value
    if (element === undefined) return
    isScrolledDown.value = element.scrollTop > SCROLL_TOP_THRESHOLD
  }

  /** Smoothly scrolls the tracked element back to the top. */
  function scrollToTop() {
    containerReference.value?.scrollTo({
      behavior: "smooth",
      top: SCROLL_TOP_THRESHOLD,
    })
  }

  return {
    containerRef: containerReference,
    isScrolledDown,
    scrollToTop,
    updateIsScrolledDown,
  }
}
