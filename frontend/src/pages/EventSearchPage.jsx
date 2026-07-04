import { Link } from 'react-router-dom'

import { sampleEvents } from '../lib/sampleData'

export function EventSearchPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">イベント検索</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">イベント一覧</h1>
        </div>
        <input
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 md:max-w-xs"
          placeholder="場所 / イベント名"
          type="search"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {sampleEvents.map((event) => (
          <Link
            className="rounded-md border border-stone-200 bg-white p-4 hover:border-teal-500"
            key={event.id}
            to={`/${event.id}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-stone-950">{event.title}</h2>
              <span className="rounded-md bg-rose-50 px-2 py-1 text-sm font-semibold text-rose-700">
                {event.heat}
              </span>
            </div>
            <p className="mt-2 text-sm text-stone-600">{event.address}</p>
            <p className="mt-4 text-sm text-stone-600">参加 {event.participants}人</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
