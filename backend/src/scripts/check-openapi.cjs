const { readFileSync } = require('node:fs')
const path = require('node:path')

const httpMethods = ['get', 'post', 'put', 'patch', 'delete']
const openApiPath = path.resolve(__dirname, '../../../openapi/openapi.yaml')
const apiRoutePath = path.resolve(__dirname, '../routes/api.route.ts')
const healthRoutePath = path.resolve(__dirname, '../routes/health.route.ts')
const openApiSource = readFileSync(openApiPath, 'utf8')
const document = parseOpenApi(openApiSource)

if (!openApiSource.includes('openapi:') || !openApiSource.includes('info:') || !document.paths['/health']) {
  throw new Error('openapi/openapi.yaml must define openapi, info, paths, and /health')
}

if (healthResponseDefinesCache(openApiSource)) {
  throw new Error('HealthResponse must not define cache because Redis is not used')
}

const implementedRoutes = [
  ...extractRoutes(readFileSync(apiRoutePath, 'utf8'), '/api/v1'),
  ...extractRoutes(readFileSync(healthRoutePath, 'utf8')),
]
const documentedRoutes = extractOpenApiRoutes(document.paths)

assertRouteSetsMatch(implementedRoutes, documentedRoutes)
assertOperationsAreComplete(document.paths, document.parameters)

console.log('OpenAPI contract looks valid')

function parseOpenApi(source) {
  const lines = source.split(/\r?\n/)
  const paths = {}
  const parameters = {}
  let section = ''
  let currentPath = ''
  let currentMethod = ''
  let currentParameter = ''
  let inResponses = false
  let inOperationParameters = false

  for (const line of lines) {
    if (/^[A-Za-z]/.test(line)) {
      section = line.replace(/:.*/, '')
      currentPath = ''
      currentMethod = ''
      inResponses = false
      inOperationParameters = false
    }

    if (section === 'paths') {
      const pathMatch = line.match(/^  (\/[^:]+):\s*$/)

      if (pathMatch) {
        currentPath = pathMatch[1]
        paths[currentPath] = paths[currentPath] ?? {}
        currentMethod = ''
        continue
      }

      const methodMatch = line.match(/^    (get|post|put|patch|delete):\s*$/)

      if (currentPath && methodMatch) {
        currentMethod = methodMatch[1]
        paths[currentPath][currentMethod] = {
          operationId: '',
          parameterRefs: [],
          parameters: [],
          responses: new Set(),
        }
        inResponses = false
        inOperationParameters = false
        continue
      }

      if (!currentPath || !currentMethod) {
        continue
      }

      const operation = paths[currentPath][currentMethod]
      const operationIdMatch = line.match(/^      operationId:\s*(\S+)/)

      if (operationIdMatch) {
        operation.operationId = operationIdMatch[1]
        continue
      }

      if (/^      parameters:\s*$/.test(line)) {
        inOperationParameters = true
        inResponses = false
        continue
      }

      if (/^      responses:\s*$/.test(line)) {
        inResponses = true
        inOperationParameters = false
        continue
      }

      if (/^      [A-Za-z]/.test(line)) {
        inResponses = false
        inOperationParameters = false
      }

      if (inOperationParameters) {
        const refMatch = line.match(/^\s+- \$ref:\s*"#\/components\/parameters\/([^"]+)"/)

        if (refMatch) {
          operation.parameterRefs.push(refMatch[1])
        }

        const nameMatch = line.match(/^\s+name:\s*(\S+)/)

        if (nameMatch) {
          operation.parameters.push({ name: nameMatch[1] })
        }
      }

      if (inResponses) {
        const statusMatch = line.match(/^\s+["']?([0-9]{3})["']?:/)

        if (statusMatch) {
          operation.responses.add(statusMatch[1])
        }
      }
    }

    if (section === 'components') {
      const parameterMatch = line.match(/^    ([A-Za-z0-9_]+):\s*$/)

      if (parameterMatch && isInsideParametersBlock(lines, line)) {
        currentParameter = parameterMatch[1]
        parameters[currentParameter] = {}
        continue
      }

      if (currentParameter) {
        const nameMatch = line.match(/^      name:\s*(\S+)/)
        const inMatch = line.match(/^      in:\s*(\S+)/)
        const requiredMatch = line.match(/^      required:\s*(true|false)/)

        if (nameMatch) {
          parameters[currentParameter].name = nameMatch[1]
        }

        if (inMatch) {
          parameters[currentParameter].in = inMatch[1]
        }

        if (requiredMatch) {
          parameters[currentParameter].required = requiredMatch[1] === 'true'
        }
      }
    }
  }

  return { paths, parameters }
}

function isInsideParametersBlock(lines, line) {
  const index = lines.indexOf(line)

  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (/^  parameters:\s*$/.test(lines[cursor])) {
      return true
    }

    if (/^  [A-Za-z]/.test(lines[cursor])) {
      return false
    }
  }

  return false
}

function healthResponseDefinesCache(source) {
  const healthResponse = source.split(/^    AuthResponse:/m)[0]?.split(/^    HealthResponse:/m)[1] ?? ''

  return /^\s+cache:/m.test(healthResponse)
}

function extractRoutes(source, prefix = '') {
  const routes = []
  const routeRegex = /route\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g
  let match

  while ((match = routeRegex.exec(source))) {
    routes.push({
      method: match[1],
      path: normalizeImplementedPath(`${prefix}${match[2]}`),
    })
  }

  return routes
}

function extractOpenApiRoutes(paths) {
  const routes = []

  for (const [pathName, pathItem] of Object.entries(paths)) {
    for (const method of httpMethods) {
      if (pathItem[method]) {
        routes.push({ method, path: pathName })
      }
    }
  }

  return routes
}

function normalizeImplementedPath(routePath) {
  return routePath.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
}

function assertRouteSetsMatch(implementedRoutes, documentedRoutes) {
  const implemented = new Set(implementedRoutes.map(routeKey))
  const documented = new Set(documentedRoutes.map(routeKey))
  const missingFromOpenApi = [...implemented].filter((route) => !documented.has(route))
  const missingFromImplementation = [...documented].filter((route) => !implemented.has(route))

  if (missingFromOpenApi.length > 0 || missingFromImplementation.length > 0) {
    const details = [
      ...missingFromOpenApi.map((route) => `Missing from OpenAPI: ${route}`),
      ...missingFromImplementation.map((route) => `Missing from implementation: ${route}`),
    ].join('\n')

    throw new Error(`OpenAPI and route implementation are out of sync:\n${details}`)
  }
}

function assertOperationsAreComplete(paths, sharedParameters) {
  for (const [pathName, pathItem] of Object.entries(paths)) {
    for (const method of httpMethods) {
      const operation = pathItem[method]

      if (!operation) {
        continue
      }

      const route = routeKey({ method, path: pathName })

      if (!operation.operationId) {
        throw new Error(`${route} must define operationId`)
      }

      if (![...operation.responses].some((status) => status.startsWith('2'))) {
        throw new Error(`${route} must define at least one 2xx response`)
      }

      for (const parameterName of extractPathParameterNames(pathName)) {
        if (!hasPathParameter(operation, sharedParameters, parameterName)) {
          throw new Error(`${route} must define path parameter: ${parameterName}`)
        }
      }
    }
  }
}

function hasPathParameter(operation, sharedParameters, parameterName) {
  return operation.parameterRefs.some((ref) => {
    const sharedParameter = sharedParameters[ref]

    return (
      sharedParameter?.name === parameterName &&
      sharedParameter.in === 'path' &&
      sharedParameter.required === true
    )
  })
}

function extractPathParameterNames(routePath) {
  return [...routePath.matchAll(/{([^}]+)}/g)].map((match) => match[1])
}

function routeKey(route) {
  return `${route.method.toUpperCase()} ${route.path}`
}
