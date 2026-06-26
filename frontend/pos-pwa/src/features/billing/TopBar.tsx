import { useState } from 'react'
import { Wifi, WifiOff, LogOut, ArrowLeftRight, BarChart2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useConnectivityStore } from '@/store/connectivityStore'
import { useBillStore } from '@/store/billStore'
import { cn } from '@/lib/utils'
import ReturnsModal from '@/features/returns/ReturnsModal'

export default function TopBar() {
  const { user, lock } = useAuthStore()
  const { online, wsConnected, lastSyncAt } = useConnectivityStore()
  const { activeBill, holdBill, heldBills, recallBill } = useBillStore()
  const navigate = useNavigate()
  const [showReturns, setShowReturns] = useState(false)

  const statusColor = online && wsConnected ? 'text-green-500' : online ? 'text-amber-500' : 'text-red-500'
  const statusLabel = online && wsConnected ? 'Online' : online ? 'Reconnecting' : 'Offline'

  const hasLines = (activeBill?.lines.filter((l) => !l.isVoided).length ?? 0) > 0

  return (
    <>
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <span className="font-bold text-blue-700 text-lg">Smart POS</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600">{user?.terminalId}</span>
          <span className="text-sm text-gray-500">{user?.displayName}</span>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => hasLines && holdBill()}
            disabled={!hasLines}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
            title="Hold bill (F2)"
          >
            Hold (F2)
          </button>

          {heldBills.length > 0 && (
            <button
              onClick={() => recallBill(heldBills[0].holdRef!)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Recall held bill (F3)"
            >
              Recall ({heldBills.length}) F3
            </button>
          )}

          <button
            onClick={() => setShowReturns(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Process return / refund"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Return
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="X-Report"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            X-Report
          </button>

          <button
            onClick={() => navigate('/shift/close')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Close shift"
          >
            <XCircle className="w-3.5 h-3.5" />
            Close Shift
          </button>
        </div>

        {/* Right: status + lock */}
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

      {showReturns && <ReturnsModal onClose={() => setShowReturns(false)} />}
    </>
  )
}