import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { searchProducts, getProductByBarcode } from '@/db'
import { useBillStore } from '@/store/billStore'
import type { Product } from '@/types'

interface Props { className?: string }

export default function ProductPanel({ className }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const addLine = useBillStore((s) => s.addLine)
  const barcodeBuffer = useRef('')
  const barcodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = async () => {
      const res = await searchProducts(query)
      setResults(res)
    }
    if (query) handler()
    else setResults([])
  }, [query])

  // USB barcode scanner keyboard wedge handler
  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      if (document.activeElement === searchRef.current) return
      if (e.key === 'Enter' && barcodeBuffer.current.length > 3) {
        const barcode = barcodeBuffer.current
        barcodeBuffer.current = ''
        const product = await getProductByBarcode(barcode)
        if (product) addProductToBill(product)
        else setQuery(barcode)
        return
      }
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current)
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = '' }, 100)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const addProductToBill = (product: Product) => {
    addLine({
      productId: product.id,
      productName: product.name,
      barcode: product.barcode,
      qty: 1,
      unitPrice: product.unitPrice,
      originalPrice: product.unitPrice,
      discountPercent: 0,
      taxAmount: product.taxInclusive ? 0 : (product.unitPrice * product.taxRate) / 100,
      isFree: false,
      isVoided: false,
      modifiers: [],
    })
  }

  return (
    <div className={cn('bg-white rounded-xl shadow-sm flex flex-col overflow-hidden', className)}>
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product or scan barcode (F6)"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {results.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => addProductToBill(p)}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-3 text-left transition-colors min-h-[80px] flex flex-col justify-between"
              >
                <span className="text-xs font-medium text-gray-800 line-clamp-2">{p.name}</span>
                <span className="text-sm font-bold text-blue-700 mt-1">{formatCurrency(p.unitPrice)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300 text-sm">
            Search or scan a product
          </div>
        )}
      </div>
    </div>
  )
}