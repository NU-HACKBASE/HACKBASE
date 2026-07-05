import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { fetchEvent, fetchEventRooms, joinEvent } from '../lib/eventApi'

function getJoinButtonLabel(status) {
  switch (status) {
    case 'joining':
      return '参加中...'
    case 'joined':
      return '参加済み'
    default:
      return '参加する'
  }
}

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
    <div className="space-y-6">
      {/* ヘッダーセクション */}
      <section className="rounded-3xl bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-widest opacity-90">イベント詳細</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">{event.title}</h1>
        <p className="mt-4 text-lg opacity-90">{event.address}</p>
        
        <div className="mt-6 flex gap-6 pt-6 border-t border-white/20">
          <div>
            <p className="text-sm font-medium opacity-75">盛り上がり指数</p>
            <p className="mt-1 text-3xl font-black">{event.heat}℃</p>
          </div>
          <div>
            <p className="text-sm font-medium opacity-75">参加者数</p>
            <p className="mt-1 text-3xl font-black">{event.participants}人</p>
          </div>
        </div>
      </section>

      {/* ルームセクション */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black tracking-tight">ルーム一覧</h2>
          <button
            className="group relative inline-block px-8 py-3 font-bold text-white transition-all duration-300 rounded-full bg-teal-600 hover:bg-teal-700 disabled:bg-stone-400 disabled:cursor-not-allowed"
            disabled={joinStatus === 'joining' || joinStatus === 'joined'}
            onClick={handleJoin}
            type="button"
          >
            {getJoinButtonLabel(joinStatus)}
          </button>
        </div>
        
        {joinStatus === 'joined' && (
          <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
            イベントに参加しました。
          </p>
        )}
        
        {joinError && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {joinError}
          </p>
        )}
        
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              className="group relative overflow-hidden rounded-3xl transition-all duration-300 cursor-pointer"
              key={room.id}
              to={`/${event.id}/${room.id}`}
            >
              {/* 背景グラデーション */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300"></div>
              <div className="absolute inset-0 border border-indigo-200 rounded-3xl group-hover:border-indigo-400 transition-all duration-300"></div>
              <div className="absolute inset-0 shadow-md group-hover:shadow-2xl rounded-3xl transition-all duration-300"></div>
              
              {/* コンテンツ */}
              <div className="relative p-5 z-10">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="flex-1 text-xl font-black text-indigo-900 group-hover:text-teal-600 transition-colors duration-300">{room.title}</h3>
                  <span className="inline-block rounded-full bg-gradient-to-br from-rose-400 to-rose-500 px-4 py-2 text-sm font-bold text-white whitespace-nowrap">
                    {room.heat}℃
                  </span>
                </div>
                
                <p className="text-sm text-indigo-700 mb-4">{room.summary}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-indigo-200">
                  <span className="text-sm font-bold text-indigo-600">👥 {room.participants}人</span>
                  <span className="text-teal-600 font-bold text-lg group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
