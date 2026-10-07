import type { Seo } from "../types/pages"
import type { MetaObject } from "nuxt/schema"

export default function useSeo(seo: Ref<Seo | undefined>) {
  const route = useRoute()

  const {
    public: { backendUrl },
  } = useRuntimeConfig()

  const head = computed<MetaObject>(() => {
    const canonical = getCanonical()
    const metaInfo = createMetaInfo(canonical)
    setMetaProperties(metaInfo)
    return metaInfo
  })

  function getCanonical() {
    const formatPath = route.path.toLowerCase().replace(/\/$/v, "")
    return `${backendUrl}${formatPath}`
  }

  function createMetaInfo(canonical: string): MetaObject {
    return {
      htmlAttrs: {
        lang: "ru",
      },
      link: [{ href: canonical, rel: "canonical" }],
      meta: [],
      title: seo.value ? seo.value.seoTitle || seo.value.title : undefined,
    }
  }

  function setMetaProperties(metaInfo: MetaObject) {
    if (seo.value?.seoDescription) {
      const seoDescriptionMetaProperty: NonNullable<MetaObject["meta"]>["0"] =
        {
          content: seo.value.seoDescription,
          name: "description",
        }
      metaInfo.meta?.push(seoDescriptionMetaProperty)
    }

    if (seo.value?.seoKeywords) {
      const seoKeywordsMetaProperty: NonNullable<MetaObject["meta"]>["0"] = {
        content: seo.value.seoKeywords,
        name: "keywords",
      }
      metaInfo.meta?.push(seoKeywordsMetaProperty)
    }
  }

  useHead(head)
}
