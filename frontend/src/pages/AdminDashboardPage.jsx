import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  createEvent,
  deleteEvent,
  fetchEventParticipants,
  fetchEventRooms,
  fetchEvents,
  updateEvent,
} from '../lib/eventApi'
import { analyzeRoom, createRoom, deleteRoom, updateRoom } from '../lib/roomApi'

const initialEventForm = {
  title: '',
  address: '',
  latitude: '',
  longitude: '',
  radius: 100,
  startsAt: '',
}

const initialRoomForm = {
  title: '',
  summary: '',
}

const adminTokenStorageKey = 'hackbase:adminToken'

export function AdminDashboardPage() {
  const [events, setEvents] = useState([])
  const [rooms, setRooms] = useState([])
  const [participants, setParticipants] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [editingEventId, setEditingEventId] = useState('')
  const [editingRoomId, setEditingRoomId] = useState('')
  const [eventForm, setEventForm] = useState(initialEventForm)
  const [roomForm, setRoomForm] = useState(initialRoomForm)
  const [status, setStatus] = useState('loading')
  const [detailStatus, setDetailStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  )

  const adminToken = localStorage.getItem(adminTokenStorageKey)
  const hasAdminToken = Boolean(adminToken)

  const loadEvents = useCallback(async () => {
    setStatus('loading')
    setError('')

    try {
      const loadedEvents = await fetchEvents({}, { token: adminToken })
      setEvents(loadedEvents)
      setSelectedEventId((currentEventId) => currentEventId || loadedEvents[0]?.id || '')

      setStatus('ready')
    } catch (loadError) {
      setStatus('error')
      setError(loadError.message)
    }
  }, [adminToken])

  const loadEventDetails = useCallback(async (eventId) => {
    setDetailStatus('loading')

    try {
      const [loadedRooms, loadedParticipants] = await Promise.all([
        fetchEventRooms(eventId, { token: adminToken }),
        fetchEventParticipants(eventId, { token: adminToken }),
      ])

      setRooms(loadedRooms)
      setParticipants(loadedParticipants.filter(Boolean))
      setDetailStatus('ready')
    } catch (loadError) {
      setRooms([])
      setParticipants([])
      setDetailStatus('error')
      setError(loadError.message)
    }
  }, [adminToken])

  useEffect(() => {
    let ignore = false

    queueMicrotask(() => {
      if (!ignore) {
        loadEvents()
      }
    })

    return () => {
      ignore = true
    }
  }, [loadEvents])

  useEffect(() => {
    let ignore = false

    queueMicrotask(() => {
      if (!ignore && selectedEventId) {
        loadEventDetails(selectedEventId)
      }
    })

    return () => {
      ignore = true
    }
  }, [loadEventDetails, selectedEventId])

  const updateEventField = (field, value) => {
    setEventForm((current) => ({ ...current, [field]: value }))
  }

  const updateRoomField = (field, value) => {
    setRoomForm((current) => ({ ...current, [field]: value }))
  }

  const startCreateEvent = () => {
    setEditingEventId('')
    setEventForm(initialEventForm)
    setMessage('')
  }

  const startEditEvent = (event) => {
    setEditingEventId(event.id)
    setSelectedEventId(event.id)
    setEventForm({
      title: event.title,
      address: event.address,
      latitude: event.latitude ?? '',
      longitude: event.longitude ?? '',
      radius: event.radius ?? 100,
      startsAt: formatDateTimeLocal(event.startsAt),
    })
    setMessage('')
  }

  const startEditRoom = (room) => {
    setEditingRoomId(room.id)
    setRoomForm({
      title: room.title,
      summary: room.summary,
    })
    setMessage('')
  }

  const resetRoomForm = () => {
    setEditingRoomId('')
    setRoomForm(initialRoomForm)
  }

  const handleEventSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const savedEvent = editingEventId
        ? await updateEvent(editingEventId, eventForm, { token: adminToken })
        : await createEvent(eventForm, { token: adminToken })

      setMessage(editingEventId ? 'イベントを保存しました' : 'イベントを作成しました')
      setSelectedEventId(savedEvent.id)
      setEditingEventId(savedEvent.id)
      await loadEvents()
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('このイベントを削除しますか？')) {
      return
    }

    setError('')
    setMessage('')

    try {
      await deleteEvent(eventId, { token: adminToken })
      setMessage('イベントを削除しました')
      setSelectedEventId('')
      setEditingEventId('')
      setEventForm(initialEventForm)
      await loadEvents()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const handleRoomSubmit = async (event) => {
    event.preventDefault()

    if (!selectedEventId) {
      return
    }

    setError('')
    setMessage('')

    try {
      if (editingRoomId) {
        await updateRoom(editingRoomId, roomForm, { token: adminToken })
        setMessage('ルームを保存しました')
      } else {
        await createRoom(selectedEventId, roomForm, { token: adminToken })
        setMessage('ルームを作成しました')
      }

      resetRoomForm()
      await loadEventDetails(selectedEventId)
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  const handleDeleteRoom = async (roomId) => {
    if (!selectedEventId || !window.confirm('このルームを削除しますか？')) {
      return
    }

    setError('')
    setMessage('')

    try {
      await deleteRoom(roomId, { token: adminToken })
      setMessage('ルームを削除しました')
      resetRoomForm()
      await loadEventDetails(selectedEventId)
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  const handleAnalyzeRoom = async (roomId) => {
    if (!selectedEventId) {
      return
    }

    setError('')
    setMessage('')

    try {
      await analyzeRoom(roomId, { token: adminToken })
      setMessage('ルームを分析しました')
      await loadEventDetails(selectedEventId)
    } catch (analyzeError) {
      setError(analyzeError.message)
    }
  }

  if (!hasAdminToken) {
    return (
      <div className="max-w-xl space-y-4">
        <div>
          <p className="text-sm font-medium text-rose-700">管理</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">管理画面</h1>
        </div>
        <section className="rounded-md border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-600">管理操作にはログインが必要です。</p>
          <Link
            className="mt-4 inline-flex rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            to="/admin/login"
          >
            ログイン
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-700">管理</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">イベント運用</h1>
        </div>
        <button
          className="w-fit rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          onClick={startCreateEvent}
          type="button"
        >
          新規イベント
        </button>
      </div>

      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="overflow-x-auto rounded-md border border-stone-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">イベント</th>
                  <th className="px-4 py-3 font-semibold">場所</th>
                  <th className="px-4 py-3 font-semibold">熱量</th>
                  <th className="px-4 py-3 font-semibold">参加</th>
                  <th className="px-4 py-3 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {events.map((event) => (
                  <tr className={event.id === selectedEventId ? 'bg-rose-50/60' : ''} key={event.id}>
                    <td className="px-4 py-3">
                      <button
                        className="text-left font-semibold text-stone-950 hover:text-rose-700"
                        onClick={() => setSelectedEventId(event.id)}
                        type="button"
                      >
                        {event.title}
                      </button>
                      <p className="mt-1 text-xs text-stone-500">{formatDate(event.startsAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{event.address || '-'}</td>
                    <td className="px-4 py-3 text-stone-600">{event.heat}</td>
                    <td className="px-4 py-3 text-stone-600">{event.participants}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-md px-2 py-1 text-sm font-medium text-rose-700 hover:bg-rose-100"
                          onClick={() => startEditEvent(event)}
                          type="button"
                        >
                          編集
                        </button>
                        <button
                          className="rounded-md px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteEvent(event.id)}
                          type="button"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {status === 'ready' && events.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-stone-500" colSpan={5}>
                      イベントはまだありません
                    </td>
                  </tr>
                ) : null}
                {status === 'loading' ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-stone-500" colSpan={5}>
                      読み込み中
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <SelectedEventPanel
            detailStatus={detailStatus}
            onAnalyzeRoom={handleAnalyzeRoom}
            onDeleteRoom={handleDeleteRoom}
            onEditRoom={startEditRoom}
            participants={participants}
            rooms={rooms}
            selectedEvent={selectedEvent}
          />
        </section>

        <aside className="space-y-4">
          <EventForm
            editingEventId={editingEventId}
            form={eventForm}
            onChange={updateEventField}
            onReset={startCreateEvent}
            onSubmit={handleEventSubmit}
          />
          <RoomForm
            disabled={!selectedEvent}
            editingRoomId={editingRoomId}
            form={roomForm}
            onChange={updateRoomField}
            onReset={resetRoomForm}
            onSubmit={handleRoomSubmit}
          />
        </aside>
      </div>
    </div>
  )
}

function EventForm({ editingEventId, form, onChange, onReset, onSubmit }) {
  return (
    <form className="space-y-4 rounded-md border border-stone-200 bg-white p-4" onSubmit={onSubmit}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-stone-950">
          {editingEventId ? 'イベント編集' : 'イベント作成'}
        </h2>
        {editingEventId ? (
          <button className="text-sm font-medium text-stone-500 hover:text-stone-950" onClick={onReset} type="button">
            解除
          </button>
        ) : null}
      </div>
      <Field label="タイトル" required value={form.title} onChange={(value) => onChange('title', value)} />
      <Field label="場所" value={form.address} onChange={(value) => onChange('address', value)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="緯度" type="number" value={form.latitude} onChange={(value) => onChange('latitude', value)} />
        <Field label="経度" type="number" value={form.longitude} onChange={(value) => onChange('longitude', value)} />
        <Field label="範囲 m" type="number" value={form.radius} onChange={(value) => onChange('radius', value)} />
      </div>
      <Field
        label="開始日時"
        type="datetime-local"
        value={form.startsAt}
        onChange={(value) => onChange('startsAt', value)}
      />
      <button
        className="w-full rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
        type="submit"
      >
        保存
      </button>
    </form>
  )
}

function RoomForm({ disabled, editingRoomId, form, onChange, onReset, onSubmit }) {
  return (
    <form className="space-y-4 rounded-md border border-stone-200 bg-white p-4" onSubmit={onSubmit}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-stone-950">
          {editingRoomId ? 'ルーム編集' : 'ルーム作成'}
        </h2>
        {editingRoomId ? (
          <button className="text-sm font-medium text-stone-500 hover:text-stone-950" onClick={onReset} type="button">
            解除
          </button>
        ) : null}
      </div>
      <Field
        disabled={disabled}
        label="タイトル"
        required
        value={form.title}
        onChange={(value) => onChange('title', value)}
      />
      <label className="block">
        <span className="text-sm font-medium text-stone-700">要約</span>
        <textarea
          className="mt-2 min-h-24 w-full resize-y rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-rose-600 disabled:bg-stone-100"
          disabled={disabled}
          onChange={(event) => onChange('summary', event.target.value)}
          value={form.summary}
        />
      </label>
      <button
        className="w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        disabled={disabled}
        type="submit"
      >
        保存
      </button>
    </form>
  )
}

function SelectedEventPanel({
  detailStatus,
  onAnalyzeRoom,
  onDeleteRoom,
  onEditRoom,
  participants,
  rooms,
  selectedEvent,
}) {
  if (!selectedEvent) {
    return (
      <section className="rounded-md border border-stone-200 bg-white p-5 text-sm text-stone-600">
        イベントを選択するとルームと参加者を確認できます。
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-md border border-stone-200 bg-white p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">{selectedEvent.title}</h2>
          <p className="mt-1 text-sm text-stone-600">{selectedEvent.address || selectedEvent.id}</p>
        </div>
        <span className="w-fit rounded-md bg-stone-100 px-2 py-1 text-sm font-semibold text-stone-700">
          {detailStatus === 'loading' ? '更新中' : `参加 ${participants.length}`}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-stone-700">ルーム</h3>
          <div className="mt-3 space-y-2">
            {rooms.map((room) => (
              <div className="rounded-md border border-stone-200 p-3" key={room.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-950">{room.title}</p>
                    <p className="mt-1 text-sm text-stone-600">{room.summary || '要約なし'}</p>
                  </div>
                  <span className="rounded-md bg-rose-50 px-2 py-1 text-sm font-semibold text-rose-700">
                    {room.heat}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="text-sm font-medium text-rose-700" onClick={() => onEditRoom(room)} type="button">
                    編集
                  </button>
                  <button className="text-sm font-medium text-stone-700" onClick={() => onAnalyzeRoom(room.id)} type="button">
                    分析
                  </button>
                  <button className="text-sm font-medium text-red-700" onClick={() => onDeleteRoom(room.id)} type="button">
                    削除
                  </button>
                </div>
              </div>
            ))}
            {rooms.length === 0 ? <p className="text-sm text-stone-500">ルームはまだありません</p> : null}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-700">参加者</h3>
          <div className="mt-3 max-h-80 overflow-auto rounded-md border border-stone-200">
            {participants.map((participant) => (
              <div className="border-b border-stone-100 px-3 py-2 last:border-b-0" key={participant.userId}>
                <p className="text-sm font-semibold text-stone-950">
                  {participant.userName || participant.userId}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {participant.role} / chat {participant.chatCount}
                </p>
              </div>
            ))}
            {participants.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-stone-500">参加者はまだいません</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ disabled = false, label, onChange, required = false, type = 'text', value }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-rose-600 disabled:bg-stone-100"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
    </label>
  )
}

function formatDate(value) {
  if (!value) {
    return '日時未設定'
  }

  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDateTimeLocal(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 16)
}
