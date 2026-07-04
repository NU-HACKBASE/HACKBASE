import { apiV1BaseUrl } from './config'

const userIdStorageKey = 'hackbase:userId'
const userTokenStorageKey = 'hackbase:userToken'

export class ApiError extends Error {
  constructor({ data, message, status }) {
    super(message)
    this.name = 'ApiError'
    this.data = data
    this.status = status
  }
}

export async function apiRequest(path, options = {}) {
  const {
    auth = true,
    baseUrl = apiV1BaseUrl,
    body,
    headers,
    method = body === undefined ? 'GET' : 'POST',
    signal,
  } = options
  const requestHeaders = createHeaders(headers)
  const requestBody = createBody(body, requestHeaders)

  if (auth) {
    applyAuthHeaders(requestHeaders)
  }

  const response = await fetch(createUrl(path, baseUrl), {
    body: requestBody,
    headers: requestHeaders,
    method,
    signal,
  })
  const data = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError({
      data,
      message: getErrorMessage(data, response),
      status: response.status,
    })
  }

  return data
}

function createHeaders(headers) {
  const requestHeaders = new Headers({
    Accept: 'application/json',
  })

  if (headers) {
    new Headers(headers).forEach((value, key) => {
      requestHeaders.set(key, value)
    })
  }

  return requestHeaders
}

function createBody(body, headers) {
  if (body === undefined || body === null) {
    return undefined
  }

  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob
  ) {
    return body
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return JSON.stringify(body)
}

function applyAuthHeaders(headers) {
  const token = localStorage.getItem(userTokenStorageKey)
  const userId = localStorage.getItem(userIdStorageKey)
  const bearerValue = token ?? userId

  if (bearerValue && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${bearerValue}`)
  }

  if (userId && !headers.has('X-User-Id')) {
    headers.set('X-User-Id', userId)
  }
}

function createUrl(path, baseUrl) {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${normalizedBaseUrl}${normalizedPath}`
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('Content-Type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()

  return text || null
}

function getErrorMessage(data, response) {
  if (data?.error?.message) {
    return data.error.message
  }

  if (data?.message) {
    return data.message
  }

  return `API request failed: ${response.status}`
}
