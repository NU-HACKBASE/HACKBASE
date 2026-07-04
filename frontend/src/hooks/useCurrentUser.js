import { useContext } from 'react'

import { UserContext } from '../contexts/user-context'

export function useCurrentUser() {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error('useCurrentUser must be used within UserProvider')
  }

  return context
}
