import assert from 'node:assert/strict'
import test from 'node:test'

import { readEnv } from './read-env.js'

test('readEnv reads values from the environment', () => {
  assert.equal(readEnv('AUTH_SECRET', undefined, { AUTH_SECRET: 'from-env' }), 'from-env')
})

test('readEnv throws when a required value is missing', () => {
  assert.throws(() => readEnv('AUTH_SECRET', undefined, {}), /Missing required environment variable: AUTH_SECRET/)
})
