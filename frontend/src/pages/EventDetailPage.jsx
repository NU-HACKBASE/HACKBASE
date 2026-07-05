import { Link, useParams } from 'react-router-dom'

import { sampleEvents, sampleRooms } from '../lib/sampleData'

export function EventDetailPage() {
  const { eventId } = useParams()
  const event = sampleEvents.find((item) => item.id === eventId) ?? sampleEvents[0]

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
            <p className="mt-1 text-3xl font-black">{event.heat}°</p>
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
          <Link
            className="group relative inline-block px-8 py-3 font-bold text-teal-600 transition-all duration-300"
            to={`/${event.id}/${sampleRooms[0].id}`}
          >
            <span className="absolute inset-0 rounded-full bg-teal-600 transition-all duration-300 group-hover:scale-105"></span>
            <span className="relative text-white">参加する</span>
          </Link>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sampleRooms.map((room) => (
            <Link
              className="group relative overflow-hidden rounded-3xl transition-all duration-300"
              key={room.id}
              to={`/${event.id}/${room.id}`}
            >
              {/* 背景グラデーション */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300"></div>
              <div className="absolute inset-0 border border-indigo-200 rounded-3xl group-hover:border-indigo-400 transition-all duration-300"></div>
              <div className="absolute inset-0 shadow-md group-hover:shadow-xl rounded-3xl transition-all duration-300"></div>
              
              {/* コンテンツ */}
              <div className="relative p-5 z-10">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="flex-1 text-xl font-black text-indigo-900 group-hover:text-teal-600 transition-colors">{room.title}</h3>
                  <span className="inline-block rounded-full bg-gradient-to-br from-rose-400 to-rose-500 px-4 py-2 text-sm font-bold text-white whitespace-nowrap">
                    {room.heat}°
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
