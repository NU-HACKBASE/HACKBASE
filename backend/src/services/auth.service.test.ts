import assert from 'node:assert/strict'
import test from 'node:test'

import { ApiError } from '../utils/api-error.js'
import { AuthService } from './auth.service.js'

test('AuthService creates and verifies a signed token', () => {
  const service = new AuthService()
  const token = service.createToken('user-1', 'anonymous')

  assert.deepEqual(service.verifyToken(token), {
    userId: 'user-1',
    role: 'anonymous',
  })
})

test('AuthService rejects a tampered token', () => {
  const service = new AuthService()
  const token = service.createToken('user-1', 'anonymous')
  const [payload] = token.split('.')

  assert.throws(() => service.verifyToken(`${payload}.invalid-signature`), ApiError)
})

test('AuthService requires admin role for admin actions', () => {
  const service = new AuthService()

  assert.throws(() => service.requireAdmin({ userId: 'user-1', role: 'anonymous' }), ApiError)
  assert.doesNotThrow(() => service.requireAdmin({ userId: 'admin', role: 'admin' }))
})
