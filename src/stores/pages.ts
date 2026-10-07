import { useDetailApi } from "../composables/api"

/** Breadcrumb item returned by the static-page SEO endpoint. */
interface PageBreadcrumb {
  slug: string
  title?: string
}

/** Static-page SEO payload returned by the backend. */
interface ApiStaticPage {
  [key: string]: unknown
  breadcrumbs?: PageBreadcrumb[]
}

export const usePagesStore = defineStore("pages", () => {
  const {
    public: { backendApiUrl },
  } = useRuntimeConfig()
  const {
    data: apiPageSeoData,
    fetchData: fetchApiPageSeoDataBase,
    fetchDataStatus: fetchApiPageSeoDataStatus,
  } = useDetailApi<ApiStaticPage>()

  const pageSeoData = computed(() => {
    if (!apiPageSeoData.value) {
      return undefined
    }
    const otherFields = { ...apiPageSeoData.value }
    delete otherFields.breadcrumbs
    return otherFields
  })

  const breadcrumbs = computed(() => {
    const breadcrumbsFromApi = apiPageSeoData.value?.breadcrumbs
    if (breadcrumbsFromApi === undefined) {
      return undefined
    }
    const mainPage = {
      path: "/",
      slug: "index",
      title: "Главная",
    }
    const breadcrumbsFromApiWithPath = breadcrumbsFromApi.map(
      (breadcrumbsElement, index) => ({
        ...breadcrumbsElement,
        path: breadcrumbsFromApi
          .slice(0, index + 1)
          .map(
            (slicedBreadcrumbsElement) => `/${slicedBreadcrumbsElement.slug}`,
          )
          .join(""),
      }),
    )
    return [mainPage, ...breadcrumbsFromApiWithPath]
  })

  async function fetchPageSeoData(path: string): Promise<void> {
    const arrayPath = path.split("/")
    const slug = arrayPath.at(-1)
    const slugOrMain = slug || "index"
    const url = `${backendApiUrl}/page/static/${slugOrMain}/`

    await fetchApiPageSeoDataBase({
      onResponseError: () => {
        console.error(`Failed to load seo data list for "${slugOrMain}" page`)
      },
      url,
    })
  }

  return {
    apiPageSeoData,
    breadcrumbs,
    fetchApiPageSeoDataStatus,
    fetchPageSeoData,
    pageSeoData,
  }
})
