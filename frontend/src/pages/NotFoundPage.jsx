import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-4 text-stone-950">
      <section className="w-full max-w-md rounded-md border border-stone-200 bg-white p-6 text-center">
        <p className="text-sm font-medium text-teal-700">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">ページが見つかりません</h1>
        <Link
          className="mt-5 inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          to="/map"
        >
          マップへ
        </Link>
      </section>
    </main>
  )
}
