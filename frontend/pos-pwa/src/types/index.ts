export type UserRole = 'Cashier' | 'SeniorCashier' | 'Supervisor' | 'Manager' | 'Admin'

export interface User {
  id: string
  username: string
  displayName: string
  role: UserRole
  tenantId: string
  locationId: string
  terminalId: string
}

export interface AuthState {
  user: User | null
  token: string | null
  shiftId: string | null
  isAuthenticated: boolean
  isLocked: boolean
}

export interface Shift {
  id: string
  terminalId: string
  locationId: string
  cashierId: string
  cashierName: string
  openedAt: string
  closedAt?: string
  openingFloat: number
  status: 'Open' | 'Closed'
  invoiceNumberBlockStart: number
  invoiceNumberBlockEnd: number
  invoiceNumberCurrent: number
}

export interface Product {
  id: string
  code: string
  barcode: string
  name: string
  invoiceName: string
  categoryId: string
  categoryName: string
  unitPrice: number
  costPrice: number
  minPrice: number
  taxRate: number
  taxInclusive: boolean
  hasModifiers: boolean
  isWeighted: boolean
  trackStock: boolean
  stockQty: number
  pluCode?: string
  refCode1?: string
  refCode2?: string
  imageUrl?: string
}

export interface ModifierGroup {
  id: string
  name: string
  required: boolean
  multiSelect: boolean
  options: ModifierOption[]
}

export interface ModifierOption {
  id: string
  name: string
  priceAdjustment: number
}

export interface BillLine {
  id: string
  productId: string
  productName: string
  barcode: string
  qty: number
  unitPrice: number
  originalPrice: number
  discountPercent: number
  discountAmount: number
  lineTotal: number
  taxAmount: number
  isFree: boolean
  isVoided: boolean
  note?: string
  modifiers: SelectedModifier[]
  weight?: number
  unit?: string
}

export interface SelectedModifier {
  groupId: string
  groupName: string
  optionId: string
  optionName: string
  priceAdjustment: number
}

export interface Bill {
  id: string
  holdRef?: string
  shiftId: string
  terminalId: string
  locationId: string
  cashierId: string
  customerId?: string
  customerName?: string
  lines: BillLine[]
  subtotal: number
  totalDiscount: number
  taxTotal: number
  netTotal: number
  roundingAmount: number
  payableAmount: number
  status: 'Active' | 'OnHold' | 'Paid' | 'Voided'
  createdAt: string
  invoiceNumber?: string
}

export interface Payment {
  method: PaymentMethod
  amount: number
  reference?: string
  cardType?: string
  cardLastFour?: string
  gvCode?: string
  walletType?: string
}

export type PaymentMethod =
  | 'Cash'
  | 'Card'
  | 'Cheque'
  | 'Credit'
  | 'GiftVoucher'
  | 'LoyaltyPoints'
  | 'MobileWallet'
  | 'BankTransfer'
  | 'Advance'

export interface Customer {
  id: string
  code: string
  name: string
  mobile: string
  email?: string
  customerType: 'Retail' | 'Wholesale' | 'Trade'
  creditLimit: number
  availableCredit: number
  outstandingBalance: number
  loyaltyPoints: number
  redeemablePoints: number
  redeemableValue: number
  defaultDiscount: number
  creditAllowed: boolean
  status: 'Active' | 'Suspended' | 'Blacklisted'
  birthday?: string
  anniversary?: string
  priceLevel: string
}

export interface SyncQueueItem {
  id: string
  type: 'Invoice' | 'SRN' | 'NewCustomer' | 'GVRedemption' | 'LoyaltyUpdate' | 'CashMovement'
  payload: unknown
  createdAt: string
  retryCount: number
  status: 'Pending' | 'Syncing' | 'Failed'
}

export interface ConnectivityStatus {
  online: boolean
  wsConnected: boolean
  lastSyncAt: string | null
}

export interface CashDenomination {
  value: number
  label: string
  count: number
}

export const LKR_DENOMINATIONS: Pick<CashDenomination, 'value' | 'label'>[] = [
  { value: 5000, label: '5000' },
  { value: 2000, label: '2000' },
  { value: 1000, label: '1000' },
  { value: 500, label: '500' },
  { value: 100, label: '100' },
  { value: 50, label: '50' },
  { value: 20, label: '20' },
  { value: 10, label: '10' },
  { value: 5, label: '5' },
  { value: 1, label: '1' },
]