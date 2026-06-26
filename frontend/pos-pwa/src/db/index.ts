import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Bill, Customer, Product, SyncQueueItem, Shift } from '@/types'

interface PosDB extends DBSchema {
  products: { key: string; value: Product; indexes: { byBarcode: string; byCode: string } }
  customers: { key: string; value: Customer; indexes: { byMobile: string; byCode: string } }
  bills: { key: string; value: Bill; indexes: { byShift: string; byStatus: string } }
  shifts: { key: string; value: Shift }
  syncQueue: { key: string; value: SyncQueueItem; indexes: { byStatus: string } }
  invoiceBlock: { key: string; value: { start: number; end: number; current: number } }
  metadata: { key: string; value: { value: string } }
}

let db: IDBPDatabase<PosDB>

export async function getDb(): Promise<IDBPDatabase<PosDB>> {
  if (db) return db
  db = await openDB<PosDB>('smartpos', 1, {
    upgrade(database) {
      const products = database.createObjectStore('products', { keyPath: 'id' })
      products.createIndex('byBarcode', 'barcode')
      products.createIndex('byCode', 'code')

      const customers = database.createObjectStore('customers', { keyPath: 'id' })
      customers.createIndex('byMobile', 'mobile')
      customers.createIndex('byCode', 'code')

      const bills = database.createObjectStore('bills', { keyPath: 'id' })
      bills.createIndex('byShift', 'shiftId')
      bills.createIndex('byStatus', 'status')

      database.createObjectStore('shifts', { keyPath: 'id' })

      const syncQueue = database.createObjectStore('syncQueue', { keyPath: 'id' })
      syncQueue.createIndex('byStatus', 'status')

      database.createObjectStore('invoiceBlock', { keyPath: 'id' })
      database.createObjectStore('metadata', { keyPath: 'key' })
    },
  })
  return db
}

export async function getNextInvoiceNumber(locationPrefix: string): Promise<string> {
  const database = await getDb()
  const block = await database.get('invoiceBlock', 'current')
  if (!block || block.current > block.end) throw new Error('Invoice number block exhausted')
  const num = block.current
  await database.put('invoiceBlock', { ...block, current: num + 1 }, 'current')
  return `${locationPrefix}${String(num).padStart(7, '0')}`
}

export async function enqueueSync(item: Omit<SyncQueueItem, 'id' | 'retryCount' | 'status'>): Promise<void> {
  const database = await getDb()
  const { v4: uuidv4 } = await import('uuid')
  await database.add('syncQueue', { ...item, id: uuidv4(), retryCount: 0, status: 'Pending' })
}

export async function searchProducts(query: string): Promise<Product[]> {
  const database = await getDb()
  const all = await database.getAll('products')
  const q = query.toLowerCase()
  return all
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(query) ||
        p.code.toLowerCase().includes(q) ||
        (p.pluCode && p.pluCode.includes(query)),
    )
    .slice(0, 50)
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  const database = await getDb()
  return database.getFromIndex('products', 'byBarcode', barcode)
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const database = await getDb()
  const all = await database.getAll('customers')
  const q = query.toLowerCase()
  return all
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(query) ||
        c.code.toLowerCase().includes(q),
    )
    .slice(0, 20)
}