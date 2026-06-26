import { Trash2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useBillStore } from '@/store/billStore'

interface Props { className?: string }

export default function BillLinesPanel({ className }: Props) {
  const { activeBill, updateQty, voidLine } = useBillStore()
  const lines = activeBill?.lines.filter((l) => !l.isVoided) ?? []

  return (
    <div className={cn('bg-white rounded-xl shadow-sm flex flex-col overflow-hidden', className)}>
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-gray-700">Bill Lines</h2>
        {activeBill?.invoiceNumber && (
          <p className="text-xs text-gray-400">{activeBill.invoiceNumber}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-300 text-sm">
            No items — scan or tap to add
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-3 py-2">Item</th>
                <th className="px-2 py-2 text-center w-16">Qty</th>
                <th className="px-2 py-2 text-right w-20">Price</th>
                <th className="px-2 py-2 text-right w-20">Total</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <span className="font-medium text-gray-800 text-xs line-clamp-2">
                      {line.productName}
                    </span>
                    {line.discountPercent > 0 && (
                      <span className="text-xs text-green-600 block">
                        -{line.discountPercent}% off
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="number"
                      min={0.001}
                      step={1}
                      value={line.qty}
                      onChange={(e) => updateQty(line.id, parseFloat(e.target.value) || 1)}
                      className="w-14 text-center border rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2 text-right text-gray-600">
                    {formatCurrency(line.unitPrice)}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold text-gray-800">
                    {formatCurrency(line.lineTotal)}
                  </td>
                  <td className="px-1 py-2">
                    <button
                      onClick={() => voidLine(line.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded"
                      title="Void line (F8)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t px-4 py-2 text-xs text-gray-400">
        {lines.length} item{lines.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}