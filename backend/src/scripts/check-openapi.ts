import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { parse } from 'yaml'

const openApiPath = fileURLToPath(new URL('../../../openapi/openapi.yaml', import.meta.url))
const document = parse(readFileSync(openApiPath, 'utf8')) as {
  openapi?: string
  info?: unknown
  paths?: Record<string, unknown>
}

if (!document.openapi || !document.info || !document.paths) {
  throw new Error('openapi/openapi.yaml must define openapi, info, and paths')
}

if (!document.paths['/health']) {
  throw new Error('openapi/openapi.yaml must define /health')
}

console.log('OpenAPI contract looks valid')
