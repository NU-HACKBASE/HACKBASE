import assert from 'node:assert/strict'
import test from 'node:test'

import { Hono } from 'hono'

import { ApiError, errorBody } from './api-error.js'
import { readJson } from './request.js'

const createTestApp = () => {
  const app = new Hono()

  app.post('/test', async (c) => {
    const body = await readJson<{ userName?: string }>(c)

    return c.json(body)
  })

  app.onError((error, c) => {
    if (error instanceof ApiError) {
      return c.json(errorBody(error), { status: error.status as 400 })
    }

    throw error
  })

  return app
}

test('readJson treats an empty request body as an empty object', async () => {
  const app = createTestApp()

  const response = await app.request('/test', { method: 'POST' })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {})
})

test('readJson treats a whitespace-only request body as an empty object', async () => {
  const app = createTestApp()

  const response = await app.request('/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '   ',
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {})
})

test('readJson parses valid JSON request bodies', async () => {
  const app = createTestApp()

  const response = await app.request('/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: 'guest' }),
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { userName: 'guest' })
})

test('readJson rejects malformed JSON request bodies', async () => {
  const app = createTestApp()

  const response = await app.request('/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid',
  })

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: {
      code: 'INVALID_JSON',
      message: 'Request body must be valid JSON',
    },
  })
})
