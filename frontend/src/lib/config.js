export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787').replace(
  /\/+$/,
  '',
)
export const apiV1BaseUrl = `${apiBaseUrl}/api/v1`

const configuredWsUrl = import.meta.env.VITE_WS_URL

export const wsUrl =
  configuredWsUrl && !shouldIgnoreConfiguredLocalWsUrl(configuredWsUrl)
    ? normalizeConfiguredWsUrl(configuredWsUrl)
    : buildWsUrl(apiBaseUrl)

function buildWsUrl(baseUrl) {
  const url = new URL(baseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws'
  url.search = ''
  url.hash = ''

  return url.toString()
}

function shouldIgnoreConfiguredLocalWsUrl(value) {
  if (typeof window === 'undefined') {
    return false
  }

  const currentHost = window.location.hostname

  if (isLocalHost(currentHost)) {
    return false
  }

  try {
    return isLocalHost(new URL(value).hostname)
  } catch {
    return false
  }
}

function normalizeConfiguredWsUrl(value) {
  if (typeof window === 'undefined') {
    return value
  }

  try {
    const url = new URL(value)

    if (window.location.protocol === 'https:' && url.protocol === 'ws:') {
      url.protocol = 'wss:'
    }

    return url.toString()
  } catch {
    return value
  }
}

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1'
}
