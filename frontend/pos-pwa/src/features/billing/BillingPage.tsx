import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useBillStore } from '@/store/billStore'
import ProductPanel from './ProductPanel'
import BillLinesPanel from './BillLinesPanel'
import TotalsPanel from './TotalsPanel'
import TopBar from './TopBar'

export default function BillingPage() {
  const { user, shiftId } = useAuthStore()
  const { activeBill, newBill } = useBillStore()

  useEffect(() => {
    if (!activeBill && user && shiftId) {
      newBill(shiftId, user.terminalId, user.locationId, user.id)
    }
  }, [activeBill, user, shiftId, newBill])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'F1':
          e.preventDefault()
          if (user && shiftId) newBill(shiftId, user.terminalId, user.locationId, user.id)
          break
      }
    },
    [newBill, user, shiftId],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <TopBar />
      <div className="flex flex-1 gap-2 p-2 overflow-hidden">
        <ProductPanel className="w-[45%]" />
        <BillLinesPanel className="w-[30%]" />
        <TotalsPanel className="w-[25%]" />
      </div>
    </div>
  )
}