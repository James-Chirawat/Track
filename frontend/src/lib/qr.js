const DEFAULT_PUBLIC_APP_URL = 'https://qrtraceorganicwolffia.vercel.app'

export const PUBLIC_APP_URL = (
  import.meta.env.VITE_PUBLIC_APP_URL || DEFAULT_PUBLIC_APP_URL
).replace(/\/+$/, '')

export const createProductUrl = (productId) => {
  return `${PUBLIC_APP_URL}/product/${encodeURIComponent(productId)}`
}

export const getProductIdFromQrData = (data) => {
  const value = data.trim()

  if (!value) return ''

  try {
    const url = value.startsWith('/product/')
      ? new URL(value, PUBLIC_APP_URL)
      : new URL(value)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const productIndex = pathParts.indexOf('product')

    if (productIndex !== -1 && pathParts[productIndex + 1]) {
      return decodeURIComponent(pathParts[productIndex + 1])
    }
  } catch {
    // Plain product IDs are accepted below.
  }

  return value
}
