import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useCurrentUser } from '../hooks/useCurrentUser'
import {
  createRoomChat,
  deleteChat,
  likeChat,
  updateChat,
} from '../lib/chatApi'
import { fetchRoom } from '../lib/roomApi'

export function RoomChatPage() {
  const { eventId, roomId } = useParams()
  const { userId } = useCurrentUser()
  const [room, setRoom] = useState(null)
  const [chats, setChats] = useState([])
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [likingChatId, setLikingChatId] = useState(null)
  const [editingChatId, setEditingChatId] = useState(null)
  const [editingBody, setEditingBody] = useState('')
  const [savingChatId, setSavingChatId] = useState(null)
  const [deletingChatId, setDeletingChatId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadRoom = async () => {
      setStatus('loading')
      setError('')

      try {
        const nextRoom = await fetchRoom(roomId, { signal: controller.signal })
        setRoom(nextRoom)
        setChats(nextRoom.chats)
        setStatus('ready')
      } catch (loadError) {
        if (controller.signal.aborted) {
          return
        }

        setError(loadError.message)
        setStatus('error')
      }
    }

    loadRoom()

    return () => {
      controller.abort()
    }
  }, [roomId])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      setSubmitError('メッセージを入力してください')
      return
    }

    setSubmitStatus('submitting')
    setSubmitError('')

    try {
      const chat = await createRoomChat(roomId, { body: trimmedMessage })

      setChats((currentChats) => [...currentChats, chat])
      setMessage('')
      setSubmitStatus('idle')
    } catch (createError) {
      setSubmitError(createError.message)
      setSubmitStatus('idle')
    }
  }

  const handleLike = async (chatId) => {
    setLikingChatId(chatId)
    setSubmitError('')

    try {
      const likedChat = await likeChat(chatId)

      setChats((currentChats) =>
        currentChats.map((chat) => (chat.id === chatId ? likedChat : chat)),
      )
    } catch (likeError) {
      setSubmitError(likeError.message)
    } finally {
      setLikingChatId(null)
    }
  }

  const startEditing = (chat) => {
    setEditingChatId(chat.id)
    setEditingBody(chat.body)
    setSubmitError('')
  }

  const cancelEditing = () => {
    setEditingChatId(null)
    setEditingBody('')
  }

  const handleUpdate = async (chatId) => {
    const trimmedBody = editingBody.trim()

    if (!trimmedBody) {
      setSubmitError('メッセージを入力してください')
      return
    }

    setSavingChatId(chatId)
    setSubmitError('')

    try {
      const updatedChat = await updateChat(chatId, { body: trimmedBody })

      setChats((currentChats) =>
        currentChats.map((chat) => (chat.id === chatId ? updatedChat : chat)),
      )
      cancelEditing()
    } catch (updateError) {
      setSubmitError(updateError.message)
    } finally {
      setSavingChatId(null)
    }
  }

  const handleDelete = async (chatId) => {
    setDeletingChatId(chatId)
    setSubmitError('')

    try {
      await deleteChat(chatId)
      setChats((currentChats) => currentChats.filter((chat) => chat.id !== chatId))
    } catch (deleteError) {
      setSubmitError(deleteError.message)
    } finally {
      setDeletingChatId(null)
    }
  }

  if (status === 'loading') {
    return (
      <p className="rounded-md border border-stone-200 bg-white p-4 text-sm text-stone-600">
        ルームを読み込み中です。
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

  if (!room) {
    return (
      <p className="rounded-md border border-stone-200 bg-white p-4 text-sm text-stone-600">
        ルームが見つかりません。
      </p>
    )
  }

  return (
    <div className="grid min-h-[640px] gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-md border border-stone-200 bg-white p-5">
        <p className="text-sm font-medium text-teal-700">ルーム</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">{room.title}</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">{room.summary}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-stone-500">盛り上がり</dt>
            <dd className="mt-1 text-2xl font-semibold text-rose-700">{room.heat}</dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">参加</dt>
            <dd className="mt-1 text-2xl font-semibold text-stone-950">
              {room.participants}
            </dd>
          </div>
        </dl>
        <Link
          className="mt-5 inline-flex rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-teal-600 hover:text-teal-700"
          to={`/${eventId}`}
        >
          イベントに戻る
        </Link>
      </aside>

      <section className="flex min-h-[640px] flex-col rounded-md border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="font-semibold text-stone-950">チャット</h2>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {chats.length === 0 ? (
            <p className="rounded-md bg-stone-50 p-3 text-sm text-stone-600">
              まだメッセージがありません。
            </p>
          ) : null}

          {chats.map((chat) => (
            <article className="rounded-md bg-stone-50 p-3" key={chat.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-stone-900">{chat.userName}</span>
                <span className="text-stone-500">{formatDateTime(chat.createdAt)}</span>
              </div>
              {editingChatId === chat.id ? (
                <div className="mt-2 space-y-2">
                  <input
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                    disabled={savingChatId === chat.id}
                    onChange={(event) => setEditingBody(event.target.value)}
                    value={editingBody}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                      disabled={savingChatId === chat.id}
                      onClick={() => handleUpdate(chat.id)}
                      type="button"
                    >
                      {savingChatId === chat.id ? '保存中...' : '保存'}
                    </button>
                    <button
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-stone-500"
                      onClick={cancelEditing}
                      type="button"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-stone-700">{chat.body}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  className="text-sm font-semibold text-rose-700 hover:text-rose-800 disabled:cursor-not-allowed disabled:text-stone-400"
                  disabled={likingChatId === chat.id}
                  onClick={() => handleLike(chat.id)}
                  type="button"
                >
                  いいね {chat.likedCount}
                </button>
                {chat.userId === userId && editingChatId !== chat.id ? (
                  <>
                    <button
                      className="text-sm font-semibold text-stone-600 hover:text-teal-700"
                      onClick={() => startEditing(chat)}
                      type="button"
                    >
                      編集
                    </button>
                    <button
                      className="text-sm font-semibold text-stone-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:text-stone-400"
                      disabled={deletingChatId === chat.id}
                      onClick={() => handleDelete(chat.id)}
                      type="button"
                    >
                      {deletingChatId === chat.id ? '削除中...' : '削除'}
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <form className="border-t border-stone-200 p-3" onSubmit={handleSubmit}>
          {submitError ? (
            <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {submitError}
            </p>
          ) : null}
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              disabled={submitStatus === 'submitting'}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="メッセージ"
              type="text"
              value={message}
            />
            <button
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={submitStatus === 'submitting'}
              type="submit"
            >
              {submitStatus === 'submitting' ? '送信中...' : '送信'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}
