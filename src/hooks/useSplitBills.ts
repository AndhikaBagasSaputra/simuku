import { useEffect, useState } from 'react'
import { loadFromStorage, saveToStorage } from '../lib/storage'
import type { SplitBill } from '../types'

const STORAGE_KEY = 'keuangan:split-bills'

export function useSplitBills() {
  const [splitBills, setSplitBills] = useState<SplitBill[]>(() =>
    loadFromStorage<SplitBill[]>(STORAGE_KEY, []),
  )

  useEffect(() => saveToStorage(STORAGE_KEY, splitBills), [splitBills])

  function saveSplitBill(bill: SplitBill) {
    setSplitBills((prev) =>
      prev.some((b) => b.id === bill.id) ? prev.map((b) => (b.id === bill.id ? bill : b)) : [...prev, bill],
    )
  }

  function deleteSplitBill(id: string) {
    setSplitBills((prev) => prev.filter((b) => b.id !== id))
  }

  return {
    splitBills,
    saveSplitBill,
    deleteSplitBill,
    /** Ganti seluruh data (dipakai fitur undo) */
    restoreSplitBills: setSplitBills,
  }
}
