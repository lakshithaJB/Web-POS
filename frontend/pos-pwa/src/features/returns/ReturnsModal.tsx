import { useState } from 'react'
import { X, Search, ArrowLeftRight, AlertTriangle, CheckCircle } from 'lucide-react'
import apiClient from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { enqueueSync } from '@/db'
import { formatCurrency, cn } from '@/lib/utils'
import type { PaymentMethod } from '@/types'

interface OriginalLine {
  id: string
  productId: string
  productName: string
  qty: number
  unitPrice: number
  lineTotal: number
}

interface OriginalBill {
  invoiceNumber: string
  invoiceDate: string
  customerName?: string
  netTotal: number
  lines: OriginalLine[]
}

interface ReturnLine extends OriginalLine {
  returnQty: number
  returnReason: ReturnReason
}

type ReturnReason = 'NormalReturn' | 'Defective' | 'WrongItem' | 'CustomerChangedMind' | 'Damage'
type RefundMethod = Extract<PaymentMethod, 'Cash' | 'Card' | 'Credit' | 'LoyaltyPoints'>
type FlowStep = 'lookup' | 'select' | 'confirm' | 'done'

const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: 'NormalReturn', label: 'Normal Return' },
  { value: 'Defective', label: 'Defective Item' },
  { value: 'WrongItem', label: 'Wrong Item Supplied' },
  { value: 'CustomerChangedMind', label: 'Customer Changed Mind' },
  { value: 'Damage', label: 'Damaged' },
]

const REFUND_METHODS: { value: RefundMethod; label: string }[] = [
  { value: 'Cash', label: 'Cash Refund' },
  { value: 'Card', label: 'Card Refund' },
  { value: 'Credit', label: 'Credit Note' },
  { value: 'LoyaltyPoints', label: 'Loyalty Points' },
]

interface Props { onClose: () => void }

export default function ReturnsModal({ onClose }: Props) {
  const { user, shiftId } = useAuthStore()
  const [step, setStep] = useState<FlowStep>('lookup')
  const [invoiceQuery, setInvoiceQuery] = useState('')
  const [originalBill, setOriginalBill] = useState<OriginalBill | null>(null)
  const [returnLines, setReturnLines] = useState<ReturnLine[]>([])
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('Cash')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [srnNumber, setSrnNumber] = useState('')

  const totalRefund = returnLines.reduce(
    (s, l) => s + l.unitPrice * l.returnQty,
    0,
  )

  const handleLookup = async () => {
    if (!invoiceQuery.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.get(
        `/invoices/${encodeURIComponent(invoiceQuery.trim())}`,
      )
      setOriginalBill(data)
      setReturnLines(
        data.lines.map((l: OriginalLine) => ({
          ...l,
          returnQty: 0,
          returnReason: 'NormalReturn' as ReturnReason,
        })),
      )
      setStep('select')
    } catch {
      setError('Invoice not found. Check the number and try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateReturnQty = (lineId: string, qty: number) =>
    setReturnLines((prev) =>
      prev.map((l) =>
        l.id === lineId ? { ...l, returnQty: Math.max(0, Math.min(qty, l.qty)) } : l,
      ),
    )

  const updateReason = (lineId: string, reason: ReturnReason) =>
    setReturnLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, returnReason: reason } : l)),
    )

  const selectedLines = returnLines.filter((l) => l.returnQty > 0)

  const handleSubmitReturn = async () => {
    if (selectedLines.length === 0) return
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        originalInvoiceNumber: originalBill!.invoiceNumber,
        shiftId,
        cashierId: user?.id,
        terminalId: user?.terminalId,
        locationId: user?.locationId,
        refundMethod,
        totalRefund,
        lines: selectedLines.map((l) => ({
          originalLineId: l.id,
          productId: l.productId,
          productName: l.productName,
          returnQty: l.returnQty,
          unitPrice: l.unitPrice,
          returnTotal: l.unitPrice * l.returnQty,
          reason: l.returnReason,
        })),
        returnedAt: new Date().toISOString(),
      }

      let srnRef: string
      try {
        const { data } = await apiClient.post('/returns', payload)
        srnRef = data.srnNumber
      } catch {
        await enqueueSync({ type: 'SRN', payload, createdAt: new Date().toISOString() })
        srnRef = `SRN-OFFLINE-${Date.now()}`
      }

      setSrnNumber(srnRef)
      setStep('done')
    } catch {
      setError('Failed to process return. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-800">Sales Return / Refund</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b shrink-0">
          {(['lookup', 'select', 'confirm', 'done'] as FlowStep[]).map((s, i) => (
            <div
              key={s}
              className={cn(
                'flex-1 py-2 text-xs text-center font-medium',
                step === s ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400',
              )}
            >
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1: Invoice Lookup */}
          {step === 'lookup' && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Enter the original invoice number. For returns without receipt, a Manager PIN is required (enforced server-side).
              </p>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={invoiceQuery}
                    onChange={(e) => setInvoiceQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    placeholder="Invoice number e.g. LOC-0001234"
                    className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleLookup}
                  disabled={loading || !invoiceQuery.trim()}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40"
                >
                  {loading ? 'Searching...' : 'Find'}
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select items to return */}
          {step === 'select' && originalBill && (
            <div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice</span>
                  <span className="font-semibold">{originalBill.invoiceNumber}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500">Date</span>
                  <span>{new Date(originalBill.invoiceDate).toLocaleDateString()}</span>
                </div>
                {originalBill.customerName && (
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">Customer</span>
                    <span>{originalBill.customerName}</span>
                  </div>
                )}
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500">Total</span>
                  <span className="font-semibold">{formatCurrency(originalBill.netTotal)}</span>
                </div>
              </div>

              <h3 className="font-semibold text-gray-700 mb-3 text-sm">
                Select items and quantities to return:
              </h3>

              <div className="space-y-3">
                {returnLines.map((line) => (
                  <div key={line.id} className="border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{line.productName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Purchased: {line.qty} × {formatCurrency(line.unitPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Return qty:</span>
                        <input
                          type="number"
                          min={0}
                          max={line.qty}
                          value={line.returnQty || ''}
                          onChange={(e) =>
                            updateReturnQty(line.id, parseInt(e.target.value) || 0)
                          }
                          className="w-16 border rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {line.returnQty > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 shrink-0">Reason:</span>
                        <select
                          value={line.returnReason}
                          onChange={(e) =>
                            updateReason(line.id, e.target.value as ReturnReason)
                          }
                          className="flex-1 border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {RETURN_REASONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setStep('lookup')}
                  className="flex-1 h-11 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={selectedLines.length === 0}
                  className="flex-1 h-11 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-40 text-sm"
                >
                  Review Return ({selectedLines.length} item{selectedLines.length !== 1 ? 's' : ''}) →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm */}
          {step === 'confirm' && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Confirm Return</h3>

              <div className="border rounded-xl overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-4 py-2">Item</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Refund</th>
                      <th className="px-3 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLines.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="px-4 py-3 font-medium text-gray-800">{l.productName}</td>
                        <td className="px-3 py-3 text-center text-gray-600">{l.returnQty}</td>
                        <td className="px-3 py-3 text-right font-semibold text-orange-600">
                          {formatCurrency(l.unitPrice * l.returnQty)}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500">
                          {RETURN_REASONS.find((r) => r.value === l.returnReason)?.label}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-orange-50">
                      <td className="px-4 py-3 font-bold text-gray-800" colSpan={2}>
                        Total Refund
                      </td>
                      <td className="px-3 py-3 font-bold text-orange-700 text-right text-base">
                        {formatCurrency(totalRefund)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Refund Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {REFUND_METHODS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setRefundMethod(value)}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors',
                        refundMethod === value
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-gray-200 text-gray-700 hover:border-orange-300',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 mb-4">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 h-11 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmitReturn}
                  disabled={submitting}
                  className="flex-1 h-11 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-40 text-sm"
                >
                  {submitting ? 'Processing...' : 'Process Return & Print SRN'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Return Processed</h2>
              <p className="text-gray-500 text-sm mb-2">SRN: <span className="font-semibold text-gray-700">{srnNumber}</span></p>
              <p className="text-gray-500 text-sm mb-6">
                Refund of <span className="font-semibold text-orange-600">{formatCurrency(totalRefund)}</span> via {refundMethod}.
                Stock restored in ERP.
              </p>
              <button
                onClick={onClose}
                className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                Done — Back to Billing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}