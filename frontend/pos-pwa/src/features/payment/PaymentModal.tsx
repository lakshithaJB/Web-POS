import { useState } from 'react'
import { X } from 'lucide-react'
import { useBillStore, usePaymentTotal } from '@/store/billStore'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import { getNextInvoiceNumber } from '@/db'
import { enqueueSync } from '@/db'
import apiClient from '@/api/client'
import type { Payment, PaymentMethod } from '@/types'

interface Props { onClose: () => void }

const PAYMENT_METHODS: { method: PaymentMethod; label: string }[] = [
  { method: 'Cash', label: 'Cash' },
  { method: 'Card', label: 'Card' },
  { method: 'Cheque', label: 'Cheque' },
  { method: 'Credit', label: 'Credit' },
  { method: 'GiftVoucher', label: 'Gift Voucher' },
  { method: 'LoyaltyPoints', label: 'Loyalty Pts' },
  { method: 'MobileWallet', label: 'Mobile Wallet' },
  { method: 'BankTransfer', label: 'Bank Transfer' },
]

export default function PaymentModal({ onClose }: Props) {
  const { activeBill, payments, addPayment, clearPayments, finaliseBill, newBill } = useBillStore()
  const { user, shiftId } = useAuthStore()
  const paid = usePaymentTotal()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Cash')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!activeBill) return null

  const balance = Math.max(0, activeBill.payableAmount - paid)
  const change = selectedMethod === 'Cash' ? Math.max(0, parseFloat(amount || '0') - balance) : 0

  const handleAddPayment = () => {
    const value = parseFloat(amount)
    if (!value || value <= 0) return
    addPayment({ method: selectedMethod, amount: Math.min(value, balance) })
    setAmount('')
  }

  const handleFinalise = async () => {
    if (paid < activeBill.payableAmount) return
    setSubmitting(true)
    setError('')
    try {
      const invoiceNumber = await getNextInvoiceNumber(`${user?.locationId}-`)
      const payload = {
        ...activeBill,
        invoiceNumber,
        payments,
        finalisedAt: new Date().toISOString(),
      }
      try {
        await apiClient.post('/invoices', payload)
      } catch {
        await enqueueSync({ type: 'Invoice', payload, createdAt: new Date().toISOString() })
      }
      finaliseBill(invoiceNumber)
      clearPayments()
      if (user && shiftId) newBill(shiftId, user.terminalId, user.locationId, user.id)
      onClose()
    } catch (err) {
      setError('Failed to finalise. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold">Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4 bg-gray-50 rounded-xl p-4">
            <span className="font-semibold text-gray-700">Amount Due</span>
            <span className="text-2xl font-bold text-blue-700">{formatCurrency(activeBill.payableAmount)}</span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {PAYMENT_METHODS.map(({ method, label }) => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  selectedMethod === method
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPayment()}
              placeholder={`Amount (balance: ${formatCurrency(balance)})`}
              className="flex-1 border rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddPayment}
              disabled={!amount || balance === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {change > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center">
              <span className="text-sm text-green-700">Change Due: </span>
              <span className="text-xl font-bold text-green-700">{formatCurrency(change)}</span>
            </div>
          )}

          {payments.length > 0 && (
            <div className="mb-4 space-y-1">
              {payments.map((p, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-600">
                  <span>{p.method}</span>
                  <span className="font-medium">{formatCurrency(p.amount)}</span>
                </div>
              ))}
              <div className="border-t pt-1 flex justify-between text-sm font-semibold">
                <span>Total Paid</span>
                <span>{formatCurrency(paid)}</span>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <button
            onClick={handleFinalise}
            disabled={paid < activeBill.payableAmount || submitting}
            className="w-full h-14 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            {submitting ? 'Processing...' : `Finalise & Print Receipt`}
          </button>
        </div>
      </div>
    </div>
  )
}