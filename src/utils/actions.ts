/** Options used to bring an element into view smoothly and centered. */
const SCROLL_INTO_VIEW_OPTIONS: ScrollIntoViewOptions = {
  behavior: "smooth",
  block: "center",
  inline: "center",
}

/**
 * Scrolls the first element carrying the given class into view.
 * Used after a failed submit to focus the first invalid field.
 */
export function scrollToFirstElementWithClass(name: string) {
  const [firstElement] = document.querySelectorAll(`.${name}`)

  firstElement?.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS)
}
