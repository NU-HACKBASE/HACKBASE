import { useCallback, useEffect, useMemo, useState } from 'react'

import { UserRegistrationDialog } from '../components/UserRegistrationDialog'
import { UserContext } from './user-context'
import { createAnonymousUser, fetchCurrentUser } from '../lib/userApi'

const userIdStorageKey = 'hackbase:userId'
const userTokenStorageKey = 'hackbase:userToken'
const userNameStorageKey = 'hackbase:userName'

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const initializeUser = async () => {
      const storedUserId = localStorage.getItem(userIdStorageKey)
      const storedToken = localStorage.getItem(userTokenStorageKey)
      const storedUserName = localStorage.getItem(userNameStorageKey)

      if (!storedUserId) {
        setStatus('needs-registration')
        return
      }

      try {
        const currentUser = await fetchCurrentUser({
          userId: storedUserId,
          token: storedToken,
        })

        if (ignore) {
          return
        }

        persistUser(currentUser)
        setUser(currentUser)
        setStatus('ready')
        setError('')
      } catch (fetchError) {
        if (ignore) {
          return
        }

        setUser({
          id: storedUserId,
          userId: storedUserId,
          userName: storedUserName ?? '',
          token: storedToken,
          raw: null,
        })
        setStatus('ready')
        setError(fetchError.message)
      }
    }

    initializeUser()

    return () => {
      ignore = true
    }
  }, [])

  const registerUser = useCallback(async ({ userName }) => {
    setStatus('creating')
    setError('')

    try {
      const createdUser = await createAnonymousUser({ userName })

      persistUser(createdUser)
      setUser(createdUser)
      setStatus('ready')

      return createdUser
    } catch (createError) {
      setStatus('needs-registration')
      setError(createError.message)
      throw createError
    }
  }, [])

  const clearUser = useCallback(() => {
    localStorage.removeItem(userIdStorageKey)
    localStorage.removeItem(userTokenStorageKey)
    localStorage.removeItem(userNameStorageKey)
    setUser(null)
    setStatus('needs-registration')
    setError('')
  }, [])

  const value = useMemo(
    () => ({
      user,
      userId: user?.userId ?? null,
      userName: user?.userName ?? '',
      status,
      isReady: status === 'ready',
      isLoading: status === 'loading' || status === 'creating',
      error,
      registerUser,
      clearUser,
    }),
    [clearUser, error, registerUser, status, user],
  )

  return (
    <UserContext.Provider value={value}>
      {children}
      <UserRegistrationDialog
        error={error}
        isSubmitting={status === 'creating'}
        onSubmit={registerUser}
        open={status === 'needs-registration' || status === 'creating'}
      />
    </UserContext.Provider>
  )
}

function persistUser(user) {
  localStorage.setItem(userIdStorageKey, user.userId)

  if (user.token) {
    localStorage.setItem(userTokenStorageKey, user.token)
  }

  if (user.userName) {
    localStorage.setItem(userNameStorageKey, user.userName)
  }
}
