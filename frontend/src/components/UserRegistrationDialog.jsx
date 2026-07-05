import { useState } from 'react'

export function UserRegistrationDialog({
  error,
  isSubmitting,
  onSubmit,
  open,
}) {
  const [userName, setUserName] = useState('')
  const [validationError, setValidationError] = useState('')

  if (!open) {
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedUserName = userName.trim()

    if (!trimmedUserName) {
      setValidationError('ユーザー名を入力してください')
      return
    }

    setValidationError('')

    try {
      await onSubmit({ userName: trimmedUserName })
    } catch {
      // The provider owns the user-facing error message.
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] grid place-items-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <section
        aria-labelledby="user-registration-title"
        className="w-full max-w-sm rounded-lg border border-white/10 bg-slate-900 p-5 text-white shadow-2xl shadow-black/50"
        role="dialog"
      >
        <p className="text-sm font-semibold text-violet-300">HACKBASE</p>
        <h1
          className="mt-1 text-2xl font-bold tracking-normal"
          id="user-registration-title"
        >
          ユーザー登録
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          チャットやイベント参加で使う表示名を入力してください。
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-200">
              ユーザー名
            </span>
            <input
              autoFocus
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-base text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
              disabled={isSubmitting}
              maxLength={32}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="例: saku"
              type="text"
              value={userName}
            />
          </label>

          {validationError || error ? (
            <p className="rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {validationError || error}
            </p>
          ) : null}

          <button
            className="w-full rounded-md bg-violet-600 px-4 py-3 text-base font-bold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? '登録中...' : 'はじめる'}
          </button>
        </form>
      </section>
    </div>
  )
}
