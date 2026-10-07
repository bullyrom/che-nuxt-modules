import noop from "lodash-es/noop"
import { getCurrentInstance } from "vue"

export default function useRender(render: () => unknown): void {
  const vm = getCurrentInstance()

  if (!vm) {
    throw new Error("[useRender] must be called from inside a setup function")
  }

  /**
   * In development mode, assignment render property works fine
   * but in production SFC overwrites it with an empty function
   * because no <template> section defined.
   *
   * Filthy hack to avoid this in production.
   * https://github.com/vuejs/core/issues/4980
   */
  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    vm.render = render
  } else {
    Object.defineProperty(vm, "render", {
      get: () => render,
      set: noop,
    })
  }
}
