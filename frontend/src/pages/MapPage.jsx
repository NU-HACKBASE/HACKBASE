import { useState } from 'react'
import { Link } from 'react-router-dom'

const mapEvents = [
  {
    id: 'event-101',
    title: 'サンセット・ピクニック',
    label: '人気',
    place: '代々木公園 芝生広場',
    startsAt: '17:00',
    participants: 38,
    color: 'orange',
    position: { left: '21%', top: '29%' },
  },
  {
    id: 'event-202',
    title: '夜カフェ交流会',
    label: '新着',
    place: '神宮前テラス',
    startsAt: '18:30',
    participants: 24,
    color: 'violet',
    position: { left: '49%', top: '28%' },
  },
  {
    id: 'event-303',
    title: '路上ライブ',
    label: 'ライブ',
    place: '渋谷ストリート',
    startsAt: '19:00',
    participants: 52,
    color: 'pink',
    position: { left: '57%', top: '58%' },
  },
  {
    id: 'event-404',
    title: 'フードマーケット',
    label: '開催中',
    place: '北参道マーケット',
    startsAt: '16:00',
    participants: 61,
    color: 'coral',
    position: { left: '78%', top: '30%' },
  },
  {
    id: 'event-505',
    title: '朝ラン合流所',
    label: '少人数',
    place: '神宮外苑',
    startsAt: '07:30',
    participants: 12,
    color: 'green',
    position: { left: '15%', top: '45%' },
  },
  {
    id: 'event-606',
    title: 'ハッカソン雑談',
    label: '交流',
    place: '恵比寿ラウンジ',
    startsAt: '20:00',
    participants: 18,
    color: 'blue',
    position: { left: '44%', top: '84%' },
  },
]

const pinStyles = {
  orange: 'bg-amber-400 shadow-amber-400/60',
  violet: 'bg-violet-500 shadow-violet-500/60',
  pink: 'bg-pink-500 shadow-pink-500/60',
  coral: 'bg-orange-500 shadow-orange-500/60',
  green: 'bg-emerald-500 shadow-emerald-500/60',
  blue: 'bg-blue-500 shadow-blue-500/60',
}

const labelPoints = [
  { text: '原宿駅', className: 'left-[19%] top-[21%]' },
  { text: '代々木公園', className: 'left-[43%] top-[22%]' },
  { text: '北参道', className: 'left-[62%] top-[34%]' },
  { text: '明治神宮前駅', className: 'left-[72%] top-[40%]' },
  { text: '神宮外苑', className: 'left-[18%] top-[50%]' },
  { text: '渋谷区役所', className: 'left-[20%] top-[70%]' },
  { text: '恵比寿駅', className: 'left-[19%] top-[91%]' },
]

export function MapPage() {
  const [selectedEvent, setSelectedEvent] = useState(mapEvents[0])

  return (
    <div className="relative isolate min-h-[calc(100vh-6rem)] overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_31%,rgba(34,197,94,0.15),transparent_18%),radial-gradient(circle_at_24%_70%,rgba(245,158,11,0.11),transparent_20%),radial-gradient(circle_at_78%_25%,rgba(14,165,233,0.1),transparent_22%),linear-gradient(180deg,#0d1626_0%,#101827_44%,#111827_100%)]" />
      <MapLines />

      {labelPoints.map((label) => (
        <span
          className={`absolute ${label.className} z-10 -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-slate-300/70 drop-shadow md:text-base`}
          key={label.text}
        >
          {label.text}
        </span>
      ))}

      <section
        className="absolute left-1/2 top-[72%] z-10 grid h-56 w-56 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-emerald-400/70 bg-emerald-500/20 text-center shadow-[0_0_42px_rgba(34,197,94,0.25)] md:h-72 md:w-72"
        aria-label="アクティブイベントエリア"
      >
        <div className="px-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/60 text-2xl shadow-lg shadow-emerald-500/40">
            <span aria-hidden="true">••</span>
          </div>
          <p className="mt-3 text-lg font-bold text-white md:text-xl">アクティブイベントエリア</p>
          <p className="mt-1 text-base text-slate-100">渋谷エリア</p>
          <p className="mt-3 text-sm text-slate-200">半径 800m</p>
        </div>
      </section>

      {mapEvents.map((event) => (
        <button
          className="absolute z-20 -translate-x-1/2 -translate-y-full"
          key={event.id}
          onClick={() => setSelectedEvent(event)}
          style={event.position}
          type="button"
        >
          <MapPin color={event.color} selected={selectedEvent.id === event.id} />
          <span className="sr-only">{event.title}</span>
        </button>
      ))}

      <div className="absolute left-[77%] top-[65%] z-20 flex -translate-x-1/2 items-center gap-2">
        <span className="grid h-11 w-11 place-items-center rounded-full border-4 border-blue-100 bg-blue-500 shadow-[0_0_28px_rgba(59,130,246,0.65)]">
          <span className="h-4 w-4 rounded-full bg-blue-100" />
        </span>
        <span className="rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-blue-200 shadow-lg backdrop-blur">
          現在地
        </span>
      </div>

      {selectedEvent ? <EventPopup event={selectedEvent} /> : null}
    </div>
  )
}

function MapLines() {
  return (
    <div className="absolute inset-0 opacity-80">
      <div className="absolute left-[-8%] top-[28%] h-3 w-[120%] rotate-[-18deg] rounded-full bg-slate-500/20" />
      <div className="absolute left-[-6%] top-[36%] h-2 w-[116%] rotate-[-8deg] rounded-full bg-slate-400/20" />
      <div className="absolute left-[-10%] top-[53%] h-3 w-[125%] rotate-[12deg] rounded-full bg-slate-500/20" />
      <div className="absolute left-[8%] top-[-8%] h-[120%] w-2 rotate-[8deg] rounded-full bg-slate-400/20" />
      <div className="absolute left-[35%] top-[-10%] h-[125%] w-3 rotate-[-13deg] rounded-full bg-slate-500/20" />
      <div className="absolute left-[71%] top-[-8%] h-[118%] w-2 rotate-[20deg] rounded-full bg-slate-400/20" />
      <div className="absolute left-[2%] top-[82%] h-3 w-[102%] rotate-[-24deg] rounded-full bg-slate-500/20" />
      <div className="absolute left-[51%] top-[12%] h-[78%] w-16 rotate-[19deg] rounded-full border-l border-r border-slate-400/15" />
      <div className="absolute left-[14%] top-[17%] h-40 w-52 rounded-[40%] bg-emerald-500/10" />
      <div className="absolute right-[8%] top-[16%] h-28 w-40 rounded-[40%] bg-emerald-500/10" />
      <div className="absolute bottom-[8%] right-[18%] h-48 w-48 rounded-[42%] bg-emerald-500/10" />
    </div>
  )
}

function MapPin({ color, selected }) {
  return (
    <span className="relative block h-16 w-12">
      <span
        className={`absolute left-1/2 top-1 h-12 w-12 -translate-x-1/2 rounded-full shadow-[0_0_30px] ${pinStyles[color]} ${selected ? 'scale-110 ring-4 ring-white/30' : ''}`}
      />
      <span
        className={`absolute left-1/2 top-8 h-8 w-8 -translate-x-1/2 rotate-45 rounded-br-[70%] shadow-[0_0_30px] ${pinStyles[color]} ${selected ? 'scale-110' : ''}`}
      />
      <span className="absolute left-1/2 top-4 h-4 w-4 -translate-x-1/2 rounded-full bg-slate-950/70 ring-2 ring-white/35" />
    </span>
  )
}

function EventPopup({ event }) {
  return (
    <section className="absolute left-1/2 top-[42%] z-30 w-[min(88vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/15 bg-slate-950/88 p-5 text-white shadow-2xl shadow-black/50 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-bold tracking-normal md:text-2xl">{event.title}</h1>
        <span className="shrink-0 rounded-full bg-amber-500 px-3 py-1 text-sm font-bold text-white">
          {event.label}
        </span>
      </div>
      <dl className="mt-4 space-y-2 text-sm text-slate-100 md:text-base">
        <div className="flex gap-3">
          <dt className="w-6 text-emerald-300">●</dt>
          <dd>{event.place}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-6 text-slate-300">○</dt>
          <dd>開始時間: {event.startsAt}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-6 text-slate-300">◎</dt>
          <dd>参加者: {event.participants}人</dd>
        </div>
      </dl>
      <Link
        className="mt-5 block rounded-md bg-violet-600 px-4 py-3 text-center text-base font-bold text-white shadow-lg shadow-violet-700/30 hover:bg-violet-500"
        to={`/${event.id}`}
      >
        イベント詳細を見る
      </Link>
    </section>
  )
}
