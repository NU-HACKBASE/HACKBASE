export function AdminEventNewPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <p className="text-sm font-medium text-rose-700">管理</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">イベント作成</h1>
      </div>
      <EventForm />
    </div>
  )
}

function EventForm() {
  return (
    <form className="space-y-4 rounded-md border border-stone-200 bg-white p-5">
      <label className="block">
        <span className="text-sm font-medium text-stone-700">タイトル</span>
        <input className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2" />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">緯度</span>
          <input className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">経度</span>
          <input className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">範囲 m</span>
          <input className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2" />
        </label>
      </div>
      <button
        className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
        type="submit"
      >
        保存
      </button>
    </form>
  )
}
