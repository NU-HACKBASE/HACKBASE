import { useParams } from 'react-router-dom'

export function AdminEventEditPage() {
  const { eventId } = useParams()

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <p className="text-sm font-medium text-rose-700">管理</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">イベント編集</h1>
        <p className="mt-2 text-sm text-stone-600">{eventId}</p>
      </div>
      <form className="space-y-4 rounded-md border border-stone-200 bg-white p-5">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">タイトル</span>
          <input
            className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2"
            defaultValue="駅前ナイトマーケット"
          />
        </label>
        <button
          className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
          type="submit"
        >
          保存
        </button>
      </form>
    </div>
  )
}
