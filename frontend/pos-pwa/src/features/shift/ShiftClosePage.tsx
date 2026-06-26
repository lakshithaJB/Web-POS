import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Printer, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useBillStore } from '@/store/billStore'
import { getDb } from '@/db'
import apiClient from '@/api/client'
import { LKR_DENOMINATIONS, type CashDenomination } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'

interface ShiftTotals {
  cashSales: number
  cardSales: number
  creditSales: number
  gvSales: number
  loyaltySales: number
  otherSales: number
  totalSales: number
  billCount: number
  voidCount: number
  discountTotal: number
  openingFloat: number
  cashIn: number
  cashOut: number
  systemCashTotal: number
}

export default function ShiftClosePage() {
  const { user, shiftId, logout } = useAuthStore()
  const { heldBills } = useBillStore()
  const navigate = useNavigate()

  const [denoms, setDenoms] = useState<CashDenomination[]>(
    LKR_DENOMINATIONS.map((d) => ({ ...d, count: 0 })),
  )
  const [totals, setTotals] = useState<ShiftTotals | null>(null)
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)
  const [step, setStep] = useState<'count' | 'confirm' | 'done'>('count')
  const [error, setError] = useState('')
  const [zReportData, setZReportData] = useState<string | null>(null)

  const countedCash = useMemo(
    () => denoms.reduce((s, d) => s + d.value * d.count, 0),
    [denoms],
  )

  const variance = totals ? countedCash - totals.systemCashTotal : 0
  const varianceSign = variance > 0 ? 'OVER' : variance < 0 ? 'SHORT' : 'BALANCED'
  const varianceColor =
    variance === 0 ? 'text-green-600' : Math.abs(variance) > 100 ? 'text-red-600' : 'text-amber-600'

  const updateCount = (value: number, count: number) =>
    setDenoms((prev) => prev.map((d) => (d.value === value ? { ...d, count: Math.max(0, count) } : d)))

  const loadTotals = async () => {
    setLoading(true)
    setError('')
    try {
      const db = await getDb()
      const bills = await db.getAllFromIndex('bills', 'byShift', shiftId!)
      const paidBills = bills.filter((b) => b.status === 'Paid')
      const voidedBills = bills.filter((b) => b.status === 'Voided')

      const shift = await db.get('shifts', shiftId!)
      const openingFloat = shift?.openingFloat ?? 0

      const cashSales = paidBills.reduce((s, _b) => {
        return s // payments not stored on bill object directly — would come from ERP API
      }, 0)

      // In real system these come from ERP — using local estimates for now
      const totalSales = paidBills.reduce((s, b) => s + b.netTotal, 0)
      const discountTotal = paidBills.reduce((s, b) => s + b.totalDiscount, 0)

      setTotals({
        cashSales,
        cardSales: 0,
        creditSales: 0,
        gvSales: 0,
        loyaltySales: 0,
        otherSales: 0,
        totalSales,
        billCount: paidBills.length,
        voidCount: voidedBills.length,
        discountTotal,
        openingFloat,
        cashIn: 0,
        cashOut: 0,
        systemCashTotal: openingFloat + cashSales,
      })
      setStep('count')
    } catch {
      setError('Failed to load shift totals.')
    } finally {
      setLoading(false)
    }
  }

  const handleProceedToConfirm = async () => {
    if (!totals) await loadTotals()
    setStep('confirm')
  }

  const handleCloseShift = async () => {
    if (heldBills.length > 0) {
      setError(`${heldBills.length} bill(s) still on hold. Recall and finalise them before closing.`)
      return
    }
    setClosing(true)
    setError('')
    try {
      const { data } = await apiClient.post(`/shifts/${shiftId}/close`, {
        countedCash,
        denominations: denoms.filter((d) => d.count > 0),
        variance,
      })
      setZReportData(data.zReport ?? 'Z-Report posted to ERP.')
      setStep('done')
    } catch {
      setError('Failed to close shift. Check connectivity and try again.')
    } finally {
      setClosing(false)
    }
  }

  const handleDone = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Close Shift</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {user?.displayName} · {user?.terminalId}
            </p>
          </div>
          <div className="flex gap-2">
            {['count', 'confirm', 'done'].map((s, i) => (
              <div
                key={s}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  step === s
                    ? 'bg-blue-600 text-white'
                    : ['count', 'confirm', 'done'].indexOf(step) > i
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-400',
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* STEP 1: Cash Count */}
          {step === 'count' && (
            <>
              <h2 className="font-semibold text-gray-700 mb-4">Count Cash in Drawer</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
                {denoms.map((d) => (
                  <div key={d.value} className="flex items-center gap-3">
                    <span className="w-16 text-right font-medium text-gray-700 text-sm">{d.label}</span>
                    <span className="text-gray-400 text-sm">×</span>
                    <input
                      type="number"
                      min={0}
                      value={d.count || ''}
                      onChange={(e) => updateCount(d.value, parseInt(e.target.value) || 0)}
                      className="w-20 border rounded-lg px-3 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <span className="text-gray-500 text-sm w-24 text-right">
                      {formatCurrency(d.value * d.count)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-blue-50 rounded-xl px-5 py-4 mb-6">
                <span className="font-semibold text-gray-700">Counted Cash Total</span>
                <span className="text-2xl font-bold text-blue-700">{formatCurrency(countedCash)}</span>
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/billing')}
                  className="flex-1 h-11 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Back to Billing
                </button>
                <button
                  onClick={handleProceedToConfirm}
                  disabled={loading}
                  className="flex-1 h-11 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Review & Confirm →'}
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Confirm & Z-Report */}
          {step === 'confirm' && totals && (
            <>
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Sales Summary */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Sales Summary</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Bills Processed', totals.billCount.toString()],
                      ['Voids', totals.voidCount.toString()],
                      ['Total Sales', formatCurrency(totals.totalSales)],
                      ['Total Discounts', formatCurrency(totals.discountTotal)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cash Reconciliation */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Cash Reconciliation</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Opening Float', formatCurrency(totals.openingFloat)],
                      ['Cash Sales', formatCurrency(totals.cashSales)],
                      ['Cash In', formatCurrency(totals.cashIn)],
                      ['Cash Out', formatCurrency(totals.cashOut)],
                      ['System Total', formatCurrency(totals.systemCashTotal)],
                      ['Counted Cash', formatCurrency(countedCash)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Variance Banner */}
              <div
                className={cn(
                  'rounded-xl px-5 py-4 mb-6 flex items-center justify-between',
                  variance === 0
                    ? 'bg-green-50 border border-green-200'
                    : Math.abs(variance) > 100
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-amber-50 border border-amber-200',
                )}
              >
                <div className="flex items-center gap-3">
                  {variance === 0 ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertTriangle className={cn('w-6 h-6', varianceColor)} />
                  )}
                  <div>
                    <p className={cn('font-bold text-lg', varianceColor)}>
                      {varianceSign}
                    </p>
                    <p className="text-xs text-gray-500">
                      {variance === 0 ? 'Drawer balanced perfectly' : 'Variance requires supervisor acknowledgement'}
                    </p>
                  </div>
                </div>
                <span className={cn('text-2xl font-bold', varianceColor)}>
                  {variance > 0 ? '+' : ''}{formatCurrency(Math.abs(variance))}
                </span>
              </div>

              {heldBills.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-orange-700 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {heldBills.length} held bill(s) will be discarded on shift close.
                </div>
              )}

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('count')}
                  className="flex-1 h-11 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  ← Recount Cash
                </button>
                <button
                  onClick={handleCloseShift}
                  disabled={closing}
                  className="flex-1 h-11 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {closing ? 'Closing...' : 'Post Z-Report & Close Shift'}
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Done */}
          {step === 'done' && (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Shift Closed</h2>
              <p className="text-gray-500 mb-6">
                Z-Report has been posted to Smart ERP. This terminal is now locked.
              </p>
              {zReportData && (
                <div className="bg-gray-50 rounded-xl p-4 text-left text-sm text-gray-600 mb-6 font-mono whitespace-pre-wrap">
                  {zReportData}
                </div>
              )}
              <button
                onClick={handleDone}
                className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}