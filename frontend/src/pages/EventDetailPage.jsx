import { Link, useParams } from 'react-router-dom'

import { sampleEvents, sampleRooms } from '../lib/sampleData'

export function EventDetailPage() {
  const { eventId } = useParams()
  const event = sampleEvents.find((item) => item.id === eventId) ?? sampleEvents[0]

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
          <Link
            className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            to={`/${event.id}/${sampleRooms[0].id}`}
          >
            参加
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {sampleRooms.map((room) => (
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
