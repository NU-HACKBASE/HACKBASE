import { Link } from 'react-router-dom'

import { sampleEvents } from '../lib/sampleData'

const pinPositions = [
  'left-[18%] top-[34%]',
  'left-[62%] top-[28%]',
  'left-[44%] top-[67%]',
]

export function MapPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-h-[520px] overflow-hidden rounded-md border border-stone-200 bg-[#dbe7df]">
        <div className="relative h-full min-h-[520px]">
          <div className="absolute inset-x-0 top-1/3 h-7 rotate-[-8deg] bg-stone-100" />
          <div className="absolute inset-y-0 left-1/3 w-8 rotate-[17deg] bg-stone-100" />
          <div className="absolute inset-x-0 bottom-1/4 h-9 rotate-[4deg] bg-sky-100" />
          <div className="absolute left-[54%] top-[43%] h-28 w-28 rounded-full border border-teal-300 bg-teal-200/40" />
          <div className="absolute left-[50%] top-[48%] h-3 w-3 rounded-full bg-teal-800 ring-4 ring-white" />

          {sampleEvents.map((event, index) => (
            <Link
              className={`absolute ${pinPositions[index]} flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2`}
              key={event.id}
              to={`/${event.id}`}
            >
              <span
                className="rounded-full border-2 border-white bg-rose-600 shadow-lg"
                style={{
                  height: `${Math.max(36, event.heat / 1.6)}px`,
                  width: `${Math.max(36, event.heat / 1.6)}px`,
                }}
              />
              <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-stone-800 shadow-sm">
                {event.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium text-teal-700">現在地周辺</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-stone-950">
            盛り上がっているイベント
          </h1>
        </div>
        {sampleEvents.map((event) => (
          <Link
            className="block rounded-md border border-stone-200 bg-white p-4 hover:border-teal-500"
            key={event.id}
            to={`/${event.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-stone-950">{event.title}</h2>
                <p className="mt-1 text-sm text-stone-600">{event.address}</p>
              </div>
              <span className="rounded-md bg-rose-50 px-2 py-1 text-sm font-semibold text-rose-700">
                {event.heat}
              </span>
            </div>
            <p className="mt-3 text-sm text-stone-600">
              参加 {event.participants}人 / 範囲 {event.radius}m
            </p>
          </Link>
        ))}
      </section>
    </div>
  )
}
