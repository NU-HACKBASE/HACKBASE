import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const PRESENCE_TTL_MS = 8000
const MAX_STORED_MESSAGES = 100

function createSessionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readJson(key, fallbackValue) {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? JSON.stringify(fallbackValue))
  } catch {
    return fallbackValue
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function getActivePresence(key) {
  const now = Date.now()
  const presence = readJson(key, {})

  return Object.fromEntries(
    Object.entries(presence).filter(([, lastSeenAt]) => now - lastSeenAt < PRESENCE_TTL_MS),
  )
}

function getParticipantCount(key) {
  return Math.max(1, Object.keys(getActivePresence(key)).length)
}

function readMessages(key) {
  const messages = readJson(key, [])

  return Array.isArray(messages) ? messages : []
}

function saveMessages(key, messages) {
  writeJson(key, messages.slice(-MAX_STORED_MESSAGES))
}

export function RoomChatPage() {
  const { eventId, roomId = 'default-room' } = useParams()
  const eventPath = eventId ? `/${eventId}` : '/events'
  const roomKey = `${eventId ?? 'default-event'}:${roomId}`
  const presenceKey = `room-presence:${roomKey}`
  const messagesKey = `room-messages:${roomKey}`
  const bottomRef = useRef(null)
  const [sessionId] = useState(createSessionId)
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState(() => readMessages(messagesKey))
  const [participantCount, setParticipantCount] = useState(() =>
    getParticipantCount(presenceKey),
  )

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setMessages(readMessages(messagesKey))
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [messagesKey])

  useEffect(() => {
    const touchPresence = () => {
      const activePresence = getActivePresence(presenceKey)
      activePresence[sessionId] = Date.now()
      writeJson(presenceKey, activePresence)
      setParticipantCount(getParticipantCount(presenceKey))
    }

    const removePresence = () => {
      const activePresence = getActivePresence(presenceKey)
      delete activePresence[sessionId]
      writeJson(presenceKey, activePresence)
    }

    const handleStorage = (event) => {
      if (event.key === presenceKey) {
        setParticipantCount(getParticipantCount(presenceKey))
      }

      if (event.key === messagesKey) {
        setMessages(readMessages(messagesKey))
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
  }, [messagesKey, presenceKey, sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedMessage = messageText.trim()
    if (!trimmedMessage) return

    const now = new Date()
    const nextMessage = {
      id: `${now.getTime()}-${sessionId}`,
      authorId: sessionId,
      body: trimmedMessage,
      createdAt: now.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    const nextMessages = [...readMessages(messagesKey), nextMessage].slice(
      -MAX_STORED_MESSAGES,
    )

    saveMessages(messagesKey, nextMessages)
    setMessages(nextMessages)
    setMessageText('')
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#171b21] text-white shadow-2xl shadow-black/40 md:min-h-[780px]">
      <header className="border-b border-white/5 bg-[#171b21]/95 px-5 pb-3 pt-5">
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
            <p className="mt-1 text-sm text-zinc-400">匿名ではなく表示中</p>
          </div>
          <button
            aria-label="匿名モードを切り替え"
            className="mt-9 flex h-6 w-11 shrink-0 items-center rounded-full bg-zinc-600 p-1"
            type="button"
          >
            <span className="ml-auto h-4 w-4 rounded-full bg-zinc-300" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md bg-zinc-800/80 px-3 py-1.5 text-base text-white transition-colors">
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

        <div className="mt-4 rounded-md bg-red-900/55 px-3 py-2 text-sm leading-5 text-red-50">
          <span className="mr-2 rounded bg-red-700/80 px-1.5 py-0.5 font-medium">
            お知らせ
          </span>
          15:00から中央公園でミートアップを開始します。
        </div>
      </header>

      <main
        className={
          messages.length === 0
            ? 'flex flex-1 items-center justify-center overflow-y-auto px-5 py-4'
            : 'flex-1 space-y-4 overflow-y-auto px-5 py-4'
        }
      >
        {messages.length === 0 ? (
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
          messages.map((message) => {
            const isOwnMessage = message.authorId === sessionId
            const authorName = isOwnMessage ? '自分' : '参加者'
            const authorNote = isOwnMessage ? 'あなた' : '同期'

            return (
              <article
                className="grid grid-cols-[42px_minmax(0,1fr)] gap-3"
                key={message.id}
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
                      {message.createdAt}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-base leading-6 text-zinc-100">
                    {message.body}
                  </p>
                </div>
              </article>
            )
          })
        )}
        <div ref={bottomRef} />
      </main>

      <form className="border-t border-white/5 bg-[#171b21] px-4 py-4" onSubmit={handleSubmit}>
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
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="メッセージを入力"
            type="text"
            value={messageText}
          />
          <button className="shrink-0 text-sm font-medium text-zinc-400" type="button">
            スタンプ
          </button>
          <button
            className="shrink-0 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:bg-zinc-600 disabled:text-zinc-300"
            disabled={!messageText.trim()}
            type="submit"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  )
}
