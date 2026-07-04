import { useEffect, useMemo, useState } from 'react'

import { apiBaseUrl, wsUrl } from '../lib/config'
import { apiRequest } from '../lib/apiClient'

const statusStyles = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  degraded: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  pending: 'border-stone-200 bg-stone-50 text-stone-600',
}

function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs font-medium ${statusStyles[status] ?? statusStyles.pending}`}
    >
      {status}
    </span>
  )
}

export function DevStatus() {
  const [health, setHealth] = useState(null)
  const [healthStatus, setHealthStatus] = useState('pending')
  const [socketStatus, setSocketStatus] = useState('pending')

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const data = await apiRequest('/health', {
          auth: false,
          baseUrl: apiBaseUrl,
        })

        setHealth(data)
        setHealthStatus(data.status)
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
      socket.send(JSON.stringify({ type: 'client.ready', payload: { source: 'frontend' } }))
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
    <aside className="border-t border-stone-200 bg-white/80 px-4 py-3 md:border-l md:border-t-0">
      <div className="mx-auto grid max-w-6xl gap-3 text-sm md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="font-semibold text-stone-900">HACKBASE</div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={healthStatus} />
          <StatusBadge status={socketStatus} />
          {serviceRows.map(([name, status]) => (
            <span className="inline-flex items-center gap-2 text-stone-600" key={name}>
              {name}
              <StatusBadge status={status} />
            </span>
          ))}
        </div>
        <a
          className="w-fit rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:border-teal-500 hover:text-teal-700"
          href={`${apiBaseUrl}/docs`}
          target="_blank"
        >
          Swagger
        </a>
      </div>
    </aside>
  )
}
