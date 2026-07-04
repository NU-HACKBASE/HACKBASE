import { useParams } from 'react-router-dom'

import { sampleRooms } from '../lib/sampleData'

export function AdminRoomsPage() {
  const { eventId } = useParams()

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-rose-700">管理</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">ルーム管理</h1>
        <p className="mt-2 text-sm text-stone-600">{eventId}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {sampleRooms.map((room) => (
          <section className="rounded-md border border-stone-200 bg-white p-4" key={room.id}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-stone-950">{room.title}</h2>
              <span className="rounded-md bg-rose-50 px-2 py-1 text-sm font-semibold text-rose-700">
                {room.heat}
              </span>
            </div>
            <p className="mt-3 text-sm text-stone-600">{room.summary}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
