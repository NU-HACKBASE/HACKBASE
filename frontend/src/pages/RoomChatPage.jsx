import { useParams } from 'react-router-dom'

import { sampleChats, sampleRooms } from '../lib/sampleData'

export function RoomChatPage() {
  const { roomId } = useParams()
  const room = sampleRooms.find((item) => item.id === roomId) ?? sampleRooms[0]

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
      </aside>

      <section className="flex min-h-[640px] flex-col rounded-md border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="font-semibold text-stone-950">チャット</h2>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {sampleChats.map((chat) => (
            <article className="rounded-md bg-stone-50 p-3" key={chat.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-stone-900">{chat.userName}</span>
                <span className="text-stone-500">{chat.createdAt}</span>
              </div>
              <p className="mt-2 text-stone-700">{chat.body}</p>
              <p className="mt-2 text-sm text-rose-700">いいね {chat.likedCount}</p>
            </article>
          ))}
        </div>
        <form className="flex gap-2 border-t border-stone-200 p-3">
          <input
            className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
            placeholder="メッセージ"
            type="text"
          />
          <button
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            type="submit"
          >
            送信
          </button>
        </form>
      </section>
    </div>
  )
}
