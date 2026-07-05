import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { parse } from 'yaml'

const openApiPath = fileURLToPath(new URL('../../../openapi/openapi.yaml', import.meta.url))
const document = parse(readFileSync(openApiPath, 'utf8')) as {
  openapi?: string
  info?: unknown
  paths?: Record<string, unknown>
  components?: {
    schemas?: {
      HealthResponse?: {
        properties?: {
          services?: {
            properties?: Record<string, unknown>
          }
        }
      }
    }
  }
}

if (!document.openapi || !document.info || !document.paths) {
  throw new Error('openapi/openapi.yaml must define openapi, info, and paths')
}

if (!document.paths['/health']) {
  throw new Error('openapi/openapi.yaml must define /health')
}

if (document.components?.schemas?.HealthResponse?.properties?.services?.properties?.cache) {
  throw new Error('HealthResponse must not define cache because Redis is not used')
}

console.log('OpenAPI contract looks valid')
process.exit(0)
