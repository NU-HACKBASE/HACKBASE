import assert from 'node:assert/strict'
import test from 'node:test'

import { AiService } from './ai.service.js'

test('AiService analyzes room chat JSON returned by Google AI', async () => {
  const service = new AiService({
    apiKey: 'test-key',
    model: 'gemma-4-31b-it',
    apiBaseUrl: 'https://example.test/v1beta',
    fetchImpl: async (url, init) => {
      assert.equal(url, 'https://example.test/v1beta/models/gemma-4-31b-it:generateContent')
      assert.equal(init?.method, 'POST')
      assert.equal(new Headers(init?.headers).get('x-goog-api-key'), 'test-key')

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      heat: 88.7,
                      summary: 'ステージ前の歓声と合流相談が増えています。',
                      trends: ['歓声', '合流', 'ステージ前'],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    },
  })

  const analysis = await service.analyzeRoom({
    roomTitle: 'Main',
    chats: [
      {
        userName: 'guest',
        body: 'ステージ前が盛り上がってます',
        likedCount: 3,
        createdAt: '2026-07-04T00:00:00.000Z',
      },
    ],
  })

  assert.deepEqual(analysis, {
    heat: 89,
    summary: 'ステージ前の歓声と合流相談が増えています。',
    trends: ['歓声', '合流', 'ステージ前'],
  })
})

test('AiService returns an empty analysis without calling Google AI when no chats exist', async () => {
  const service = new AiService({
    fetchImpl: async () => {
      throw new Error('fetch should not be called')
    },
  })

  assert.deepEqual(await service.analyzeRoom({ roomTitle: 'Main', chats: [] }), {
    heat: 0,
    summary: 'まだチャットがありません。',
    trends: [],
  })
})
