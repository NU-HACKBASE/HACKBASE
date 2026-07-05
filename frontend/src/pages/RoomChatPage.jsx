import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useCurrentUser } from '../hooks/useCurrentUser'
import {
  mergeRealtimeChat,
  removeRealtimeChat,
  useRoomChatSocket,
} from '../hooks/useRoomChatSocket'
import { createRoomChat, deleteChat, likeChat, updateChat } from '../lib/chatApi'
import { fetchRoom } from '../lib/roomApi'

const PRESENCE_TTL_MS = 8000

function createSessionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readPresence(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? '{}')
  } catch {
    return {}
  }
}

function writePresence(key, presence) {
  window.localStorage.setItem(key, JSON.stringify(presence))
}

function getActivePresence(key) {
  const now = Date.now()
  const presence = readPresence(key)

  return Object.fromEntries(
    Object.entries(presence).filter(([, lastSeenAt]) => now - lastSeenAt < PRESENCE_TTL_MS),
  )
}

function getParticipantCount(key) {
  return Math.max(1, Object.keys(getActivePresence(key)).length)
}

export function RoomChatPage() {
  const { eventId, roomId } = useParams()
  const { userId } = useCurrentUser()
  const eventPath = eventId ? `/${eventId}` : '/events'
  const presenceKey = `room-presence:${eventId ?? 'default-event'}:${roomId ?? 'default-room'}`
  const bottomRef = useRef(null)
  const [sessionId] = useState(createSessionId)
  const [room, setRoom] = useState(null)
  const [chats, setChats] = useState([])
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [participantCount, setParticipantCount] = useState(() =>
    getParticipantCount(presenceKey),
  )
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const [likingChatId, setLikingChatId] = useState(null)
  const [editingChatId, setEditingChatId] = useState(null)
  const [editingBody, setEditingBody] = useState('')
  const [savingChatId, setSavingChatId] = useState(null)
  const [deletingChatId, setDeletingChatId] = useState(null)

  // ルーム詳細と初期チャット一覧をAPIから読み込む
  useEffect(() => {
    const controller = new AbortController()

    const loadRoom = async () => {
      if (!roomId) {
        setError('ルームが見つかりません。')
        setStatus('error')
        return
      }

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

  useRoomChatSocket(roomId, {
    onChatCreated: (chat) => {
      setChats((currentChats) => mergeRealtimeChat(currentChats, chat))
    },
    onChatUpdated: (chat) => {
      setChats((currentChats) => mergeRealtimeChat(currentChats, chat))
    },
    onChatDeleted: (chatId) => {
      setChats((currentChats) => removeRealtimeChat(currentChats, chatId))
    },
  })

  // このルーム画面を開いているタブを現在参加中として扱う
  useEffect(() => {
    const touchPresence = () => {
      const activePresence = getActivePresence(presenceKey)
      activePresence[sessionId] = Date.now()
      writePresence(presenceKey, activePresence)
      setParticipantCount(getParticipantCount(presenceKey))
    }

    const removePresence = () => {
      const activePresence = getActivePresence(presenceKey)
      delete activePresence[sessionId]
      writePresence(presenceKey, activePresence)
    }

    const handleStorage = (event) => {
      if (event.key === presenceKey) {
        setParticipantCount(getParticipantCount(presenceKey))
      }
    }

    const initialTimerId = window.setTimeout(touchPresence, 0)
    const heartbeatId = window.setInterval(touchPresence, 3000)
    window.addEventListener('storage', handleStorage)
    window.addEventListener('beforeunload', removePresence)

    return () => {
      window.clearTimeout(initialTimerId)
      window.clearInterval(heartbeatId)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('beforeunload', removePresence)
      removePresence()
    }
  }, [presenceKey, sessionId])

  // 新しいチャットが追加されたら末尾へスクロールする
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats])

  // 入力されたメッセージをAPIへ送信し、成功したら一覧へ追加する
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

      setChats((currentChats) => mergeRealtimeChat(currentChats, chat))
      setMessage('')
      setSubmitStatus('idle')
    } catch (createError) {
      setSubmitError(createError.message)
      setSubmitStatus('idle')
    }
  }

  // いいね数をAPIで更新し、対象チャットだけ差し替える
  const handleLike = async (chatId) => {
    setLikingChatId(chatId)
    setSubmitError('')

    try {
      const likedChat = await likeChat(chatId)

      setChats((currentChats) => mergeRealtimeChat(currentChats, likedChat))
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

  // 編集中の本文をAPIへ保存し、成功したら一覧へ反映する
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

      setChats((currentChats) => mergeRealtimeChat(currentChats, updatedChat))
      cancelEditing()
    } catch (updateError) {
      setSubmitError(updateError.message)
    } finally {
      setSavingChatId(null)
    }
  }

  // 自分のチャットをAPIで削除し、成功したら一覧から取り除く
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
    return <StatusPanel>ルームを読み込み中です。</StatusPanel>
  }

  if (status === 'error') {
    return <StatusPanel tone="error">{error}</StatusPanel>
  }

  if (!room) {
    return <StatusPanel>ルームが見つかりません。</StatusPanel>
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#171b21] text-white shadow-2xl shadow-black/40 md:h-[780px]">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#171b21]/95 px-5 pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              className="text-xs font-semibold text-emerald-300 hover:text-emerald-200"
              to={eventPath}
            >
              ← イベントへ戻る
            </Link>
            <h1 className="mt-2 truncate text-2xl font-bold tracking-normal">
              <span className="text-emerald-300">#イベント</span>
              <span className="font-semibold text-white"> - 交流チャット</span>
            </h1>
            <p className="mt-1 truncate text-sm text-zinc-400">
              {room.title || 'ルーム'} / 匿名ではなく表示中
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md bg-zinc-800/80 px-3 py-1.5 text-base text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            参加者: {participantCount}人
          </span>
          <button
            className="rounded-md bg-zinc-600/80 px-3 py-1.5 text-sm font-semibold text-zinc-100"
            type="button"
          >
            話題の要約
          </button>
        </div>

        {room.summary ? (
          <div className="mt-4 rounded-md bg-red-900/55 px-3 py-2 text-sm leading-5 text-red-50">
            <span className="mr-2 rounded bg-red-700/80 px-1.5 py-0.5 font-medium">
              お知らせ
            </span>
            {room.summary}
          </div>
        ) : null}
      </header>

      <main
        className={
          chats.length === 0
            ? 'flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-5 pb-44 pt-4'
            : 'min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-44 pt-4'
        }
      >
        {chats.length === 0 ? (
          <div className="max-w-[240px] text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-zinc-800 text-2xl text-zinc-400">
              #
            </div>
            <p className="mt-4 text-base font-semibold text-zinc-200">
              まだメッセージはありません
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              最初の投稿を送ると、このルームの会話がここに表示されます。
            </p>
          </div>
        ) : (
          chats.map((chat) => {
            const isOwnMessage = chat.userId === userId
            const authorName = isOwnMessage ? '自分' : chat.userName || '参加者'
            const authorNote = isOwnMessage ? 'あなた' : '参加者'
            const isEditing = editingChatId === chat.id

            return (
              <article
                className="grid grid-cols-[42px_minmax(0,1fr)] gap-3"
                key={chat.id}
              >
                <div
                  aria-hidden="true"
                  className={
                    isOwnMessage
                      ? 'h-10 w-10 rounded-full bg-emerald-300 ring-2 ring-emerald-200/20'
                      : 'h-10 w-10 rounded-full bg-zinc-700 ring-2 ring-zinc-500/20'
                  }
                />
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-base font-bold text-white">
                      {authorName}
                      <span className="ml-1 font-normal text-zinc-400">({authorNote})</span>
                    </p>
                    <time className="shrink-0 text-sm text-zinc-400">
                      {formatDateTime(chat.createdAt)}
                    </time>
                  </div>

                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <input
                        className="w-full rounded-lg border border-zinc-600 bg-[#11151a] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-emerald-400"
                        disabled={savingChatId === chat.id}
                        onChange={(event) => setEditingBody(event.target.value)}
                        value={editingBody}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-zinc-300"
                          disabled={savingChatId === chat.id}
                          onClick={() => handleUpdate(chat.id)}
                          type="button"
                        >
                          {savingChatId === chat.id ? '保存中...' : '保存'}
                        </button>
                        <button
                          className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-600"
                          onClick={cancelEditing}
                          type="button"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap break-words text-base leading-6 text-zinc-100">
                      {chat.body}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      className="rounded-lg bg-zinc-700/90 px-2.5 py-1.5 text-sm font-semibold text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400"
                      disabled={likingChatId === chat.id}
                      onClick={() => handleLike(chat.id)}
                      type="button"
                    >
                      いいね {chat.likedCount}
                    </button>

                    {isOwnMessage && !isEditing ? (
                      <>
                        <button
                          className="rounded-lg bg-zinc-700/90 px-2.5 py-1.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-600"
                          onClick={() => startEditing(chat)}
                          type="button"
                        >
                          編集
                        </button>
                        <button
                          className="rounded-lg bg-zinc-700/90 px-2.5 py-1.5 text-sm font-semibold text-zinc-100 hover:bg-rose-700 disabled:cursor-not-allowed disabled:text-zinc-400"
                          disabled={deletingChatId === chat.id}
                          onClick={() => handleDelete(chat.id)}
                          type="button"
                        >
                          {deletingChatId === chat.id ? '削除中...' : '削除'}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })
        )}
        <div ref={bottomRef} />
      </main>

      <form
        className="fixed bottom-24 left-1/2 z-[1300] w-full max-w-md -translate-x-1/2 shrink-0 border border-white/10 bg-[#171b21] px-4 py-4 shadow-2xl shadow-black/40"
        onSubmit={handleSubmit}
      >
        {submitError ? (
          <p className="mb-3 rounded-lg border border-rose-500/40 bg-rose-950/70 px-3 py-2 text-sm text-rose-100">
            {submitError}
          </p>
        ) : null}
        <div className="flex h-12 items-center gap-2 rounded-xl border border-zinc-700 bg-[#11151a] p-1.5 shadow-inner shadow-black/40">
          <button
            aria-label="添付を追加"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-700 text-2xl leading-none text-zinc-300"
            type="button"
          >
            +
          </button>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            disabled={submitStatus === 'submitting'}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="メッセージを入力"
            type="text"
            value={message}
          />
          <button className="shrink-0 text-sm font-medium text-zinc-400" type="button">
            スタンプ
          </button>
          <button
            className="shrink-0 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-zinc-300"
            disabled={submitStatus === 'submitting' || !message.trim()}
            type="submit"
          >
            {submitStatus === 'submitting' ? '送信中...' : '送信'}
          </button>
        </div>
      </form>
    </div>
  )
}

function StatusPanel({ children, tone = 'default' }) {
  const toneClass =
    tone === 'error'
      ? 'border-rose-500/40 bg-rose-950/70 text-rose-100'
      : 'border-white/10 bg-[#171b21] text-zinc-200'

  return (
    <p className={`mx-auto max-w-md rounded-2xl border p-4 text-sm ${toneClass}`}>
      {children}
    </p>
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
