/**
 * Runs the initial data fetch once on the server (deduplicated by `callOnce`)
 * and once on the client after mount, skipping hydration.
 */
export async function useVoidAsyncData(parameters: {
  fetchFunction: () => Promise<void>
}) {
  const nuxt = useNuxtApp()

  if (import.meta.server) await callOnce(parameters.fetchFunction)
  else if (!nuxt.isHydrating) onMounted(parameters.fetchFunction)
}
