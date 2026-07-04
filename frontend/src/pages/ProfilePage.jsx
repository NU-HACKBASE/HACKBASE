export function ProfilePage() {
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <p className="text-sm font-medium text-teal-700">プロフィール</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">匿名ユーザー</h1>
      </div>

      <section className="rounded-md border border-stone-200 bg-white p-5">
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm text-stone-500">ユーザーID</dt>
            <dd className="mt-1 font-semibold text-stone-950">user-local</dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">種別</dt>
            <dd className="mt-1 font-semibold text-stone-950">anonymous</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
