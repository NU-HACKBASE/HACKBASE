import { useEffect, useMemo, useState } from 'react'

import { apiBaseUrl, wsUrl } from './lib/config'

const statusStyles = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  degraded: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  pending: 'border-slate-200 bg-slate-50 text-slate-600',
}

function App() {
  const [health, setHealth] = useState(null)
  const [healthStatus, setHealthStatus] = useState('pending')
  const [socketStatus, setSocketStatus] = useState('pending')
  const [socketMessage, setSocketMessage] = useState('Waiting for connection')

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`)
        const data = await response.json()

        setHealth(data)
        setHealthStatus(response.ok ? data.status : 'degraded')
      } catch {
        setHealthStatus('error')
      }
    }

    loadHealth()
  }, [])

  useEffect(() => {
    const socket = new WebSocket(wsUrl)

    socket.addEventListener('open', () => {
      setSocketStatus('ok')
      socket.send('frontend-ready')
    })

    socket.addEventListener('message', (event) => {
      setSocketMessage(event.data)
    })

    socket.addEventListener('close', () => {
      setSocketStatus('degraded')
    })

    socket.addEventListener('error', () => {
      setSocketStatus('error')
    })

    return () => {
      socket.close()
    }
  }, [])

  const serviceRows = useMemo(() => {
    if (!health?.services) {
      return [
        ['API', 'pending'],
        ['PostgreSQL', 'pending'],
        ['Redis', 'pending'],
      ]
    }

    return [
      ['API', health.services.api],
      ['PostgreSQL', health.services.database],
      ['Redis', health.services.cache],
    ]
  }, [health])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 md:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">
              HACKBASE
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white md:text-5xl">
              Web app foundation
            </h1>
          </div>
          <a
            className="inline-flex w-fit items-center rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-cyan-300 hover:text-cyan-200"
            href={`${apiBaseUrl}/docs`}
            target="_blank"
          >
            Open Swagger
          </a>
        </header>

        <section className="grid flex-1 gap-4 py-8 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">REST API</p>
            <div
              className={`mt-4 inline-flex rounded-md border px-3 py-1 text-sm font-medium ${statusStyles[healthStatus]}`}
            >
              {healthStatus}
            </div>
            <p className="mt-5 break-all text-sm text-slate-300">{apiBaseUrl}/health</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">WebSocket</p>
            <div
              className={`mt-4 inline-flex rounded-md border px-3 py-1 text-sm font-medium ${statusStyles[socketStatus]}`}
            >
              {socketStatus}
            </div>
            <p className="mt-5 line-clamp-4 break-all text-sm text-slate-300">
              {socketMessage}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Dependencies</p>
            <div className="mt-4 space-y-3">
              {serviceRows.map(([name, status]) => (
                <div className="flex items-center justify-between gap-3" key={name}>
                  <span className="text-sm text-slate-300">{name}</span>
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium ${statusStyles[status]}`}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
