import { create } from 'zustand'
import type { User, AuthState } from '@/types'

interface AuthActions {
  login: (user: User, token: string) => void
  logout: () => void
  lock: () => void
  unlock: (token: string) => void
  setShift: (shiftId: string) => void
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  token: null,
  shiftId: null,
  isAuthenticated: false,
  isLocked: false,

  login: (user, token) => {
    sessionStorage.setItem('pos_token', token)
    set({ user, token, isAuthenticated: true, isLocked: false })
  },

  logout: () => {
    sessionStorage.removeItem('pos_token')
    set({ user: null, token: null, shiftId: null, isAuthenticated: false, isLocked: false })
  },

  lock: () => set({ isLocked: true }),

  unlock: (token) => {
    sessionStorage.setItem('pos_token', token)
    set({ token, isLocked: false })
  },

  setShift: (shiftId) => set({ shiftId }),
}))