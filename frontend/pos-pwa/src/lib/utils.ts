import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatQuantity(qty: number): string {
  return qty % 1 === 0 ? qty.toString() : qty.toFixed(3)
}

export function roundToNearest(amount: number, nearest: 0.5 | 1): number {
  return Math.round(amount / nearest) * nearest
}

export function calculateLineTotal(qty: number, unitPrice: number, discountPercent: number): number {
  const gross = qty * unitPrice
  return parseFloat((gross - (gross * discountPercent) / 100).toFixed(2))
}