import { computed } from "vue"

import { useDetailApi } from "./api"

interface Captcha {
  captcha_image: string
  image_decode: string
  image_type: string
}

/**
 * Loads a captcha through a detail POST request and builds its data-URL image.
 * The `capthcaImageSource` name is kept as-is for backwards compatibility
 * with the existing project consumers.
 */
export function useCaptcha(parameters: { url: string }) {
  const {
    data: captcha,
    fetchData: fetchCaptcha,
    fetchDataStatus: fetchCaptchaStatus,
  } = useDetailApi<Captcha>({
    method: "post",
    url: parameters.url,
  })

  const capthcaImageSource = computed(() =>
    captcha.value
      ? `data:${captcha.value.image_type};${captcha.value.image_decode},${captcha.value.captcha_image}`
      : undefined,
  )

  return { captcha, capthcaImageSource, fetchCaptcha, fetchCaptchaStatus }
}
