import { useState, useEffect, useRef } from 'react'
import { Search, X, UserPlus, Phone, CreditCard, Star, AlertTriangle } from 'lucide-react'
import { useBillStore } from '@/store/billStore'
import { searchCustomers } from '@/db'
import apiClient from '@/api/client'
import { formatCurrency, cn } from '@/lib/utils'
import type { Customer } from '@/types'

interface Props {
  onClose: () => void
}

export default function CustomerModal({ onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [searching, setSearching] = useState(false)
  const [tab, setTab] = useState<'search' | 'new'>('search')
  const [newName, setNewName] = useState('')
  const [newMobile, setNewMobile] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { attachCustomer, detachCustomer, customer: attached } = useBillStore()

  useEffect(() => {
    inputRef.current?.focus()
  }, [tab])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const local = await searchCustomers(query)
      setResults(local)
      // Fall back to ERP live search if fewer than 3 local results
      if (local.length < 3) {
        try {
          const { data } = await apiClient.get(`/customers/search?q=${encodeURIComponent(query)}`)
          const merged = [...local, ...data.filter((d: Customer) => !local.find((l) => l.id === d.id))]
          setResults(merged.slice(0, 20))
        } catch { /* stay with local results */ }
      }
      setSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const handleAttach = (customer: Customer) => {
    attachCustomer(customer)
    onClose()
  }

  const handleDetach = () => {
    detachCustomer()
    onClose()
  }

  const handleRegister = async () => {
    if (!newName.trim() || !newMobile.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      const { data } = await apiClient.post('/customers', {
        name: newName.trim(),
        mobile: newMobile.trim(),
        email: newEmail.trim() || undefined,
      })
      attachCustomer(data)
      onClose()
    } catch {
      setSaveError('Failed to register. Check connection.')
    } finally {
      setSaving(false)
    }
  }

  const statusBadge = (status: Customer['status']) => {
    if (status === 'Active') return null
    return (
      <span className={cn(
        'text-xs font-bold px-2 py-0.5 rounded-full',
        status === 'Suspended' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700',
      )}>
        {status}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Customer (F4)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Attached customer banner */}
        {attached && (
          <div className="mx-5 mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <p className="font-semibold text-blue-800">{attached.name}</p>
              <p className="text-xs text-blue-600">{attached.code} · {attached.mobile}</p>
            </div>
            <button
              onClick={handleDetach}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b mx-5 mt-4 shrink-0">
          {(['search', 'new'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 text-sm font-medium border-b-2 transition-colors',
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {t === 'search' ? '🔍 Search Customer' : '➕ Quick Register'}
            </button>
          ))}
        </div>

        {/* Search tab */}
        {tab === 'search' && (
          <>
            <div className="px-5 pt-4 pb-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, mobile, customer code..."
                  className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {searching && (
                <p className="text-center text-sm text-gray-400 py-6">Searching...</p>
              )}
              {!searching && query && results.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-3">No customer found for "{query}"</p>
                  <button
                    onClick={() => { setNewName(query); setTab('new') }}
                    className="text-blue-600 text-sm font-medium flex items-center gap-1 mx-auto"
                  >
                    <UserPlus className="w-4 h-4" /> Register as new customer
                  </button>
                </div>
              )}
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => c.status !== 'Blacklisted' && handleAttach(c)}
                  disabled={c.status === 'Blacklisted'}
                  className={cn(
                    'w-full text-left border rounded-xl p-4 mb-2 transition-colors',
                    c.status === 'Blacklisted'
                      ? 'opacity-50 cursor-not-allowed bg-gray-50'
                      : 'hover:border-blue-400 hover:bg-blue-50 cursor-pointer',
                    attached?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{c.name}</span>
                        {statusBadge(c.status)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.mobile}</span>
                        <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{c.code}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="flex items-center gap-1 text-amber-600 font-medium">
                        <Star className="w-3 h-3" />
                        {c.loyaltyPoints.toLocaleString()} pts
                      </div>
                      {c.creditAllowed && (
                        <div className={cn(
                          'mt-1 font-medium',
                          c.availableCredit < 0 ? 'text-red-600' : 'text-green-600',
                        )}>
                          {formatCurrency(c.availableCredit)} credit
                        </div>
                      )}
                    </div>
                  </div>

                  {c.outstandingBalance > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1">
                      <AlertTriangle className="w-3 h-3" />
                      Outstanding: {formatCurrency(c.outstandingBalance)}
                    </div>
                  )}

                  {/* Birthday banner */}
                  {c.birthday && new Date(c.birthday).toDateString().slice(4, 10) === new Date().toDateString().slice(4, 10) && (
                    <div className="mt-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-2 py-1">
                      🎂 Birthday today!
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* New customer tab */}
        {tab === 'new' && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="text-sm text-gray-500 mb-4">
              Minimum: name + mobile. Full profile can be completed in Smart ERP later.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name *</label>
                <input
                  ref={tab === 'new' ? inputRef : undefined}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Customer full name"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Mobile Number *</label>
                <input
                  type="tel"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  placeholder="07X XXXXXXX"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Email (optional)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {saveError && <p className="text-red-500 text-sm mt-3">{saveError}</p>}

            <button
              onClick={handleRegister}
              disabled={!newName.trim() || !newMobile.trim() || saving}
              className="w-full mt-5 h-12 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {saving ? 'Registering...' : 'Register & Attach to Bill'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}