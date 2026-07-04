import { apiV1BaseUrl } from './config'

const userEndpoint = `${apiV1BaseUrl}/users`

export async function createAnonymousUser({ userName }) {
  const response = await fetch(userEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userName }),
  })

  return parseUserResponse(response)
}

export async function fetchCurrentUser({ userId, token }) {
  const response = await fetch(`${userEndpoint}/me`, {
    headers: createAuthHeaders({ userId, token }),
  })

  return parseUserResponse(response)
}

function createAuthHeaders({ userId, token }) {
  const authValue = token ?? userId
  const headers = {}

  if (authValue) {
    headers.Authorization = `Bearer ${authValue}`
  }

  if (userId) {
    headers['X-User-Id'] = userId
  }

  return headers
}

async function parseUserResponse(response) {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.error?.message ?? data?.message ?? 'ユーザー情報の取得に失敗しました'
    throw new Error(message)
  }

  return normalizeUserPayload(data)
}

function normalizeUserPayload(data) {
  const source = data?.user ?? data
  const userId = source?.userId ?? source?.id ?? data?.userId
  const userName = source?.userName ?? source?.name ?? data?.userName ?? ''
  const token = data?.token ?? source?.token ?? null

  if (!userId) {
    throw new Error('ユーザーIDがレスポンスに含まれていません')
  }

  return {
    id: userId,
    userId,
    userName,
    token,
    raw: data,
  }
}
