import { Wifi, WifiOff, AlertCircle, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useConnectivityStore } from '@/store/connectivityStore'
import { cn } from '@/lib/utils'

export default function TopBar() {
  const { user, lock } = useAuthStore()
  const { online, wsConnected, lastSyncAt } = useConnectivityStore()

  const statusColor = online && wsConnected ? 'text-green-500' : online ? 'text-amber-500' : 'text-red-500'
  const statusLabel = online && wsConnected ? 'Online' : online ? 'Reconnecting' : 'Offline'

  return (
    <header className="bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <span className="font-bold text-blue-700 text-lg">Smart POS</span>
        <span className="text-gray-400 text-sm">|</span>
        <span className="text-sm text-gray-600">{user?.terminalId}</span>
        <span className="text-sm text-gray-600">{user?.displayName}</span>
      </div>

      <div className="flex items-center gap-4">
        {lastSyncAt && (
          <span className="text-xs text-gray-400">
            Synced {new Date(lastSyncAt).toLocaleTimeString()}
          </span>
        )}
        <div className={cn('flex items-center gap-1 text-sm font-medium', statusColor)}>
          {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {statusLabel}
        </div>
        <button
          onClick={lock}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
        >
          <LogOut className="w-4 h-4" />
          Lock
        </button>
      </div>
    </header>
  )
}