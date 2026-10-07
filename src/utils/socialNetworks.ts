/** Builds a social-network share URL from a link, description and image. */
type SocialNetworkShareLink = (
  link: string,
  description?: string,
  imageUrl?: string,
) => string

const OK_OFFER_URL = "https://connect.ok.ru/offer"
const VK_SHARE_URL = "https://vk.com/share.php"
const TELEGRAM_SHARE_URL = "https://t.me/share"

/** Odnoklassniki share URL. */
function odnoklassnikiShareLink(
  link: string,
  description?: string,
  imageUrl?: string,
) {
  return (
    `${OK_OFFER_URL}?url=${link}` +
    `&title=${description ?? ""}` +
    `&imageUrl=${imageUrl ?? ""}`
  )
}

/** VK share URL. */
function vkontakteShareLink(
  link: string,
  description?: string,
  imageUrl?: string,
) {
  return (
    `${VK_SHARE_URL}?url=${link}` +
    `&title=${description ?? ""}` +
    `&image=${imageUrl ?? ""}`
  )
}

/** Telegram share URL. */
function telegramShareLink(link: string, description?: string) {
  return `${TELEGRAM_SHARE_URL}?url=${link}&text=${description ?? ""}`
}

export { odnoklassnikiShareLink, telegramShareLink, vkontakteShareLink }
export type { SocialNetworkShareLink }
