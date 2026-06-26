import { create } from 'zustand'
import type { ConnectivityStatus } from '@/types'

interface ConnectivityActions {
  setOnline: (online: boolean) => void
  setWs: (connected: boolean) => void
  setSyncTime: () => void
}

export const useConnectivityStore = create<ConnectivityStatus & ConnectivityActions>((set) => ({
  online: navigator.onLine,
  wsConnected: false,
  lastSyncAt: null,

  setOnline: (online) => set({ online }),
  setWs: (wsConnected) => set({ wsConnected }),
  setSyncTime: () => set({ lastSyncAt: new Date().toISOString() }),
}))

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useConnectivityStore.getState().setOnline(true))
  window.addEventListener('offline', () => useConnectivityStore.getState().setOnline(false))
}