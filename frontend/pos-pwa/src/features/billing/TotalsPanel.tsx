import { useState } from 'react'
import { CreditCard, Banknote, ReceiptText } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useBillStore, usePaymentTotal } from '@/store/billStore'
import PaymentModal from '@/features/payment/PaymentModal'

interface Props { className?: string; onCustomer?: () => void }

export default function TotalsPanel({ className, onCustomer }: Props) {
  const bill = useBillStore((s) => s.activeBill)
  const customer = useBillStore((s) => s.customer)
  const [showPayment, setShowPayment] = useState(false)

  const paid = usePaymentTotal()
  const balance = (bill?.payableAmount ?? 0) - paid

  if (!bill) return null

  return (
    <div className={cn('bg-white rounded-xl shadow-sm flex flex-col overflow-hidden', className)}>
      <div className="p-4 border-b">
        {customer ? (
          <div className="bg-blue-50 rounded-lg p-3 mb-3">
            <p className="font-semibold text-blue-800 text-sm">{customer.name}</p>
            <p className="text-xs text-blue-600">{customer.code}</p>
            <div className="flex justify-between mt-2 text-xs text-blue-700">
              <span>Points: {customer.loyaltyPoints.toLocaleString()}</span>
              <span>Credit: {formatCurrency(customer.availableCredit)}</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onCustomer}
            className="w-full bg-gray-50 rounded-lg p-3 mb-3 text-center text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            + Attach Customer (F4)
          </button>
        )}
      </div>

      <div className="flex-1 p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(bill.subtotal)}</span>
        </div>
        {bill.totalDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-{formatCurrency(bill.totalDiscount)}</span>
          </div>
        )}
        {bill.taxTotal > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span>
            <span>{formatCurrency(bill.taxTotal)}</span>
          </div>
        )}
        {bill.roundingAmount !== 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Rounding</span>
            <span>{bill.roundingAmount > 0 ? '+' : ''}{formatCurrency(bill.roundingAmount)}</span>
          </div>
        )}
        <div className="border-t pt-3 flex justify-between font-bold text-xl text-gray-900">
          <span>Total</span>
          <span>{formatCurrency(bill.payableAmount)}</span>
        </div>

        {paid > 0 && (
          <>
            <div className="flex justify-between text-sm text-green-600">
              <span>Paid</span>
              <span>{formatCurrency(paid)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-orange-600">
              <span>Balance</span>
              <span>{formatCurrency(Math.max(0, balance))}</span>
            </div>
          </>
        )}
      </div>

      <div className="p-3 space-y-2 border-t">
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 h-11 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
            <Banknote className="w-4 h-4" />
            Cash (F9)
          </button>
          <button className="flex items-center justify-center gap-2 h-11 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
            <CreditCard className="w-4 h-4" />
            Card (F10)
          </button>
        </div>
        <button
          onClick={() => setShowPayment(true)}
          disabled={bill.lines.filter((l) => !l.isVoided).length === 0}
          className="w-full h-14 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
        >
          <ReceiptText className="w-5 h-5" />
          Finalise (F12)
        </button>
      </div>

      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
    </div>
  )
}