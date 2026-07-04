import { Link } from 'react-router-dom'

export function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 text-stone-950">
      <section className="w-full max-w-md rounded-md border border-stone-200 bg-white p-6">
        <p className="text-sm font-medium text-rose-700">管理者</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">ログイン</h1>
        <form className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">メールアドレス</span>
            <input
              className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-rose-600"
              type="email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">パスワード</span>
            <input
              className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-rose-600"
              type="password"
            />
          </label>
          <button
            className="w-full rounded-md bg-rose-700 px-4 py-2 font-semibold text-white hover:bg-rose-800"
            type="submit"
          >
            ログイン
          </button>
        </form>
        <Link className="mt-4 inline-block text-sm font-medium text-stone-600" to="/map">
          ユーザー画面へ
        </Link>
      </section>
    </main>
  )
}
