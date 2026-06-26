import { useEffect, useCallback, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useBillStore } from '@/store/billStore'
import ProductPanel from './ProductPanel'
import BillLinesPanel from './BillLinesPanel'
import TotalsPanel from './TotalsPanel'
import TopBar from './TopBar'
import CustomerModal from '@/features/customer/CustomerModal'

export default function BillingPage() {
  const { user, shiftId } = useAuthStore()
  const { activeBill, newBill } = useBillStore()
  const [showCustomer, setShowCustomer] = useState(false)

  useEffect(() => {
    if (!activeBill && user && shiftId) {
      newBill(shiftId, user.terminalId, user.locationId, user.id)
    }
  }, [activeBill, user, shiftId, newBill])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      switch (e.key) {
        case 'F1':
          e.preventDefault()
          if (user && shiftId) newBill(shiftId, user.terminalId, user.locationId, user.id)
          break
        case 'F4':
          e.preventDefault()
          setShowCustomer(true)
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
        <TotalsPanel className="w-[25%]" onCustomer={() => setShowCustomer(true)} />
      </div>

      {showCustomer && <CustomerModal onClose={() => setShowCustomer(false)} />}
    </div>
  )
}