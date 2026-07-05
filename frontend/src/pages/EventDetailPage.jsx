import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { fetchEvent, fetchEventRooms, joinEvent } from '../lib/eventApi'

export function EventDetailPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [rooms, setRooms] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [joinStatus, setJoinStatus] = useState('idle')
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadEvent = async () => {
      setStatus('loading')
      setError('')

      try {
        const [nextEvent, nextRooms] = await Promise.all([
          fetchEvent(eventId, { signal: controller.signal }),
          fetchEventRooms(eventId, { signal: controller.signal }),
        ])

        setEvent(nextEvent)
        setRooms(nextRooms)
        setJoinStatus('idle')
        setJoinError('')
        setStatus('ready')
      } catch (loadError) {
        if (controller.signal.aborted) {
          return
        }

        setError(loadError.message)
        setStatus('error')
      }
    }

    loadEvent()

    return () => {
      controller.abort()
    }
  }, [eventId])

  const handleJoin = async () => {
    setJoinStatus('joining')
    setJoinError('')

    try {
      const result = await joinEvent(eventId)

      setJoinStatus('joined')

      if (result.event?.id) {
        setEvent(result.event)
      }

      try {
        const nextEvent = await fetchEvent(eventId)
        setEvent(nextEvent)
      } catch {
        // The join succeeded; keep the joined UI even if the follow-up refresh fails.
      }

      if (rooms[0]) {
        navigate(`/${eventId}/${rooms[0].id}`)
        return
      }
    } catch (error) {
      setJoinError(error.message)
      setJoinStatus('idle')
    }
  }

  if (status === 'loading') {
    return (
      <p className="rounded-md border border-stone-200 bg-white p-4 text-sm text-stone-600">
        イベントを読み込み中です。
      </p>
    )
  }

  if (status === 'error') {
    return (
      <p className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </p>
    )
  }

  if (!event) {
    return (
      <p className="rounded-md border border-stone-200 bg-white p-4 text-sm text-stone-600">
        イベントが見つかりません。
      </p>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <section className="rounded-md border border-stone-200 bg-white p-5">
        <p className="text-sm font-medium text-teal-700">イベント</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">{event.title}</h1>
        <p className="mt-3 text-sm text-stone-600">{event.address}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-stone-500">盛り上がり</dt>
            <dd className="mt-1 text-2xl font-semibold text-rose-700">{event.heat}</dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">参加</dt>
            <dd className="mt-1 text-2xl font-semibold text-stone-950">
              {event.participants}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-normal">ルーム</h2>
          <button
            className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
            disabled={joinStatus === 'joining' || joinStatus === 'joined'}
            onClick={handleJoin}
            type="button"
          >
            {getJoinButtonLabel(joinStatus)}
          </button>
        </div>
        {joinStatus === 'joined' ? (
          <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
            イベントに参加しました。
          </p>
        ) : null}
        {joinError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {joinError}
          </p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-3">
          {rooms.map((room) => (
            <Link
              className="rounded-md border border-stone-200 bg-white p-4 hover:border-teal-500"
              key={room.id}
              to={`/${event.id}/${room.id}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-stone-950">{room.title}</h3>
                <span className="rounded-md bg-rose-50 px-2 py-1 text-sm font-semibold text-rose-700">
                  {room.heat}
                </span>
              </div>
              <p className="mt-3 text-sm text-stone-600">{room.summary}</p>
              <p className="mt-4 text-sm text-stone-600">参加 {room.participants}人</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function getJoinButtonLabel(joinStatus) {
  if (joinStatus === 'joining') {
    return '参加中...'
  }

  if (joinStatus === 'joined') {
    return '参加済み'
  }

  return '参加'
}
