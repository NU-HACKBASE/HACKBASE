import { useCurrentUser } from '../hooks/useCurrentUser'

export function ProfilePage() {
  const { clearUser, error, isLoading, userId, userName } = useCurrentUser()

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <p className="text-sm font-medium text-teal-700">プロフィール</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">
          {userName || '匿名ユーザー'}
        </h1>
      </div>

      <section className="rounded-md border border-stone-200 bg-white p-5">
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm text-stone-500">ユーザーID</dt>
            <dd className="mt-1 break-all font-semibold text-stone-950">
              {isLoading ? '読み込み中' : userId}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">ユーザー名</dt>
            <dd className="mt-1 font-semibold text-stone-950">
              {isLoading ? '読み込み中' : userName || '未設定'}
            </dd>
          </div>
        </dl>
        {error ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </p>
        ) : null}
        <button
          className="mt-5 rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-rose-500 hover:text-rose-700"
          onClick={clearUser}
          type="button"
        >
          ユーザー登録をやり直す
        </button>
      </section>
    </div>
  )
}
