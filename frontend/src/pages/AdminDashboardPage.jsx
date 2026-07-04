import { Link } from 'react-router-dom'

import { sampleEvents } from '../lib/sampleData'

export function AdminDashboardPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-700">管理</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">イベント管理</h1>
        </div>
        <Link
          className="w-fit rounded-md bg-rose-700 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-800"
          to="/admin/events/new"
        >
          新規作成
        </Link>
      </div>

      <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
            <tr>
              <th className="px-4 py-3 font-semibold">イベント</th>
              <th className="px-4 py-3 font-semibold">場所</th>
              <th className="px-4 py-3 font-semibold">盛り上がり</th>
              <th className="px-4 py-3 font-semibold">参加</th>
              <th className="px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sampleEvents.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 font-medium text-stone-950">{event.title}</td>
                <td className="px-4 py-3 text-stone-600">{event.address}</td>
                <td className="px-4 py-3 text-stone-600">{event.heat}</td>
                <td className="px-4 py-3 text-stone-600">{event.participants}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link className="text-rose-700" to={`/admin/events/${event.id}`}>
                      編集
                    </Link>
                    <Link className="text-rose-700" to={`/admin/events/${event.id}/rooms`}>
                      ルーム
                    </Link>
                    <Link
                      className="text-rose-700"
                      to={`/admin/events/${event.id}/participants`}
                    >
                      参加者
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
