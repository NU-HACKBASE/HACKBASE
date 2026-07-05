import { useState } from 'react'
import { Link } from 'react-router-dom'

import { loginAdmin } from '../lib/userApi'

const userIdStorageKey = 'hackbase:userId'
const userTokenStorageKey = 'hackbase:userToken'
const userNameStorageKey = 'hackbase:userName'
const adminTokenStorageKey = 'hackbase:adminToken'

export function AdminLoginPage() {
  const [form, setForm] = useState({ userName: 'admin', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const admin = await loginAdmin(form)

      localStorage.setItem(userIdStorageKey, admin.userId)
      localStorage.setItem(userNameStorageKey, admin.userName || 'admin')

      if (admin.token) {
        localStorage.setItem(userTokenStorageKey, admin.token)
        localStorage.setItem(adminTokenStorageKey, admin.token)
      }

      window.location.assign('/admin')
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 text-stone-950">
      <section className="w-full max-w-md rounded-md border border-stone-200 bg-white p-6">
        <p className="text-sm font-medium text-rose-700">管理者</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">ログイン</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">ユーザー名</span>
            <input
              className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-rose-600"
              onChange={(event) => updateField('userName', event.target.value)}
              type="text"
              value={form.userName}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">パスワード</span>
            <input
              className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-rose-600"
              onChange={(event) => updateField('password', event.target.value)}
              type="password"
              value={form.password}
            />
          </label>
          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
          <button
            className="w-full rounded-md bg-rose-700 px-4 py-2 font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'ログイン中' : 'ログイン'}
          </button>
        </form>
        <Link className="mt-4 inline-block text-sm font-medium text-stone-600" to="/map">
          ユーザー画面へ
        </Link>
      </section>
    </main>
  )
}
