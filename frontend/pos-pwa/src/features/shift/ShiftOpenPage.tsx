import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { getDb } from '@/db'
import { LKR_DENOMINATIONS, type CashDenomination } from '@/types'
import { formatCurrency } from '@/lib/utils'

export default function ShiftOpenPage() {
  const { user, setShift } = useAuthStore()
  const navigate = useNavigate()
  const [denoms, setDenoms] = useState<CashDenomination[]>(
    LKR_DENOMINATIONS.map((d) => ({ ...d, count: 0 })),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const float = denoms.reduce((s, d) => s + d.value * d.count, 0)

  const updateCount = (value: number, count: number) =>
    setDenoms((prev) => prev.map((d) => (d.value === value ? { ...d, count: Math.max(0, count) } : d)))

  const handleOpen = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.post('/shifts/open', {
        terminalId: user?.terminalId,
        locationId: user?.locationId,
        openingFloat: float,
        denominations: denoms.filter((d) => d.count > 0),
      })

      const db = await getDb()
      await db.put('shifts', data.shift)
      await db.put('invoiceBlock', {
        id: 'current',
        start: data.invoiceBlock.start,
        end: data.invoiceBlock.end,
        current: data.invoiceBlock.start,
      })

      if (data.products?.length) {
        const tx = db.transaction('products', 'readwrite')
        await Promise.all(data.products.map((p: Parameters<typeof tx.store.put>[0]) => tx.store.put(p)))
        await tx.done
      }

      setShift(data.shift.id)
      navigate('/billing')
    } catch {
      setError('Failed to open shift. Check connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Open Shift</h1>
        <p className="text-gray-500 text-sm mb-6">
          {user?.displayName} · {user?.terminalId}
        </p>

        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Opening Float — Count Cash in Drawer
        </h2>

        <div className="space-y-2 mb-6">
          {denoms.map((d) => (
            <div key={d.value} className="flex items-center gap-3">
              <span className="w-16 text-right font-medium text-gray-700">{d.label}</span>
              <input
                type="number"
                min={0}
                value={d.count || ''}
                onChange={(e) => updateCount(d.value, parseInt(e.target.value) || 0)}
                className="w-20 border rounded-lg px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <span className="text-gray-400 text-sm">=</span>
              <span className="text-gray-700 text-sm font-medium">
                {formatCurrency(d.value * d.count)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3 mb-6">
          <span className="font-semibold text-gray-700">Total Float</span>
          <span className="text-xl font-bold text-blue-700">{formatCurrency(float)}</span>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleOpen}
          disabled={loading}
          className="w-full h-12 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Opening Shift...' : 'Open Shift & Start Billing'}
        </button>
      </div>
    </div>
  )
}