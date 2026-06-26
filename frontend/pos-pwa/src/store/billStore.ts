import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Bill, BillLine, Customer, Payment } from '@/types'
import { calculateLineTotal } from '@/lib/utils'

interface BillState {
  activeBill: Bill | null
  heldBills: Bill[]
  payments: Payment[]
  customer: Customer | null
}

interface BillActions {
  newBill: (shiftId: string, terminalId: string, locationId: string, cashierId: string) => void
  addLine: (line: Omit<BillLine, 'id' | 'lineTotal' | 'discountAmount'>) => void
  updateQty: (lineId: string, qty: number) => void
  updateDiscount: (lineId: string, discountPercent: number) => void
  voidLine: (lineId: string) => void
  attachCustomer: (customer: Customer) => void
  detachCustomer: () => void
  holdBill: () => void
  recallBill: (holdRef: string) => void
  addPayment: (payment: Payment) => void
  clearPayments: () => void
  applyBillDiscount: (percent: number) => void
  finaliseBill: (invoiceNumber: string) => void
  voidBill: () => void
}

function recalcBill(bill: Bill): Bill {
  const activeLines = bill.lines.filter((l) => !l.isVoided)
  const subtotal = activeLines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const totalDiscount = activeLines.reduce(
    (s, l) => s + (l.qty * l.unitPrice * l.discountPercent) / 100,
    0,
  )
  const taxTotal = activeLines.reduce((s, l) => s + l.taxAmount, 0)
  const netTotal = parseFloat((subtotal - totalDiscount + taxTotal).toFixed(2))
  return { ...bill, subtotal, totalDiscount, taxTotal, netTotal, payableAmount: netTotal + bill.roundingAmount }
}

export const useBillStore = create<BillState & BillActions>((set, get) => ({
  activeBill: null,
  heldBills: [],
  payments: [],
  customer: null,

  newBill: (shiftId, terminalId, locationId, cashierId) =>
    set({
      activeBill: {
        id: uuidv4(),
        shiftId,
        terminalId,
        locationId,
        cashierId,
        lines: [],
        subtotal: 0,
        totalDiscount: 0,
        taxTotal: 0,
        netTotal: 0,
        roundingAmount: 0,
        payableAmount: 0,
        status: 'Active',
        createdAt: new Date().toISOString(),
      },
      payments: [],
      customer: null,
    }),

  addLine: (lineData) =>
    set((state) => {
      if (!state.activeBill) return state
      const existing = state.activeBill.lines.find(
        (l) => l.productId === lineData.productId && !l.isVoided && l.modifiers.length === 0,
      )
      let lines: BillLine[]
      if (existing) {
        lines = state.activeBill.lines.map((l) =>
          l.id === existing.id
            ? {
                ...l,
                qty: l.qty + lineData.qty,
                lineTotal: calculateLineTotal(l.qty + lineData.qty, l.unitPrice, l.discountPercent),
              }
            : l,
        )
      } else {
        const newLine: BillLine = {
          ...lineData,
          id: uuidv4(),
          discountAmount: 0,
          lineTotal: calculateLineTotal(lineData.qty, lineData.unitPrice, lineData.discountPercent),
        }
        lines = [...state.activeBill.lines, newLine]
      }
      return { activeBill: recalcBill({ ...state.activeBill, lines }) }
    }),

  updateQty: (lineId, qty) =>
    set((state) => {
      if (!state.activeBill) return state
      const lines = state.activeBill.lines.map((l) =>
        l.id === lineId
          ? { ...l, qty, lineTotal: calculateLineTotal(qty, l.unitPrice, l.discountPercent) }
          : l,
      )
      return { activeBill: recalcBill({ ...state.activeBill, lines }) }
    }),

  updateDiscount: (lineId, discountPercent) =>
    set((state) => {
      if (!state.activeBill) return state
      const lines = state.activeBill.lines.map((l) =>
        l.id === lineId
          ? {
              ...l,
              discountPercent,
              lineTotal: calculateLineTotal(l.qty, l.unitPrice, discountPercent),
            }
          : l,
      )
      return { activeBill: recalcBill({ ...state.activeBill, lines }) }
    }),

  voidLine: (lineId) =>
    set((state) => {
      if (!state.activeBill) return state
      const lines = state.activeBill.lines.map((l) =>
        l.id === lineId ? { ...l, isVoided: true } : l,
      )
      return { activeBill: recalcBill({ ...state.activeBill, lines }) }
    }),

  attachCustomer: (customer) =>
    set((state) => ({
      customer,
      activeBill: state.activeBill
        ? { ...state.activeBill, customerId: customer.id, customerName: customer.name }
        : null,
    })),

  detachCustomer: () =>
    set((state) => ({
      customer: null,
      activeBill: state.activeBill
        ? { ...state.activeBill, customerId: undefined, customerName: undefined }
        : null,
    })),

  holdBill: () =>
    set((state) => {
      if (!state.activeBill) return state
      const holdRef = `H${Date.now()}`
      const held = { ...state.activeBill, holdRef, status: 'OnHold' as const }
      return {
        heldBills: [...state.heldBills, held],
        activeBill: null,
        payments: [],
        customer: null,
      }
    }),

  recallBill: (holdRef) =>
    set((state) => {
      const bill = state.heldBills.find((b) => b.holdRef === holdRef)
      if (!bill) return state
      return {
        activeBill: { ...bill, status: 'Active' },
        heldBills: state.heldBills.filter((b) => b.holdRef !== holdRef),
      }
    }),

  addPayment: (payment) => set((state) => ({ payments: [...state.payments, payment] })),

  clearPayments: () => set({ payments: [] }),

  applyBillDiscount: (percent) =>
    set((state) => {
      if (!state.activeBill) return state
      const lines = state.activeBill.lines.map((l) =>
        l.isVoided
          ? l
          : { ...l, discountPercent: percent, lineTotal: calculateLineTotal(l.qty, l.unitPrice, percent) },
      )
      return { activeBill: recalcBill({ ...state.activeBill, lines }) }
    }),

  finaliseBill: (invoiceNumber) =>
    set((state) => ({
      activeBill: state.activeBill
        ? { ...state.activeBill, invoiceNumber, status: 'Paid' }
        : null,
    })),

  voidBill: () =>
    set((state) => ({
      activeBill: state.activeBill ? { ...state.activeBill, status: 'Voided' } : null,
    })),
}))

export const usePaymentTotal = () => {
  const payments = useBillStore((s) => s.payments)
  return payments.reduce((sum, p) => sum + p.amount, 0)
}