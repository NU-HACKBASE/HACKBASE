import { apiRequest } from './apiClient'

export async function createAnonymousUser({ userName }) {
  const data = await apiRequest('/users', {
    auth: false,
    method: 'POST',
    body: { userName },
  })

  return normalizeUserPayload(data)
}

export async function fetchCurrentUser({ userId, token }) {
  const data = await apiRequest('/users/me', {
    headers: createAuthHeaders({ userId, token }),
  })

  return normalizeUserPayload(data)
}

export async function loginAdmin({ password, userName }) {
  const data = await apiRequest('/admin/login', {
    auth: false,
    body: { password, userName },
    method: 'POST',
  })

  return normalizeUserPayload(data)
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
