import { useParams } from 'react-router-dom'

export function AdminParticipantsPage() {
  const { eventId } = useParams()

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-rose-700">管理</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">参加者一覧</h1>
        <p className="mt-2 text-sm text-stone-600">{eventId}</p>
      </div>
      <div className="rounded-md border border-stone-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-3">
          {['user-018', 'user-044', 'user-072'].map((userId) => (
            <div className="rounded-md bg-stone-50 p-3" key={userId}>
              <p className="font-semibold text-stone-950">{userId}</p>
              <p className="mt-1 text-sm text-stone-600">anonymous</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
