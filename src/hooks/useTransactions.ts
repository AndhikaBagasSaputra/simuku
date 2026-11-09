import { useEffect, useState } from 'react'
import { loadFromStorage, saveToStorage } from '../lib/storage'
import type { Transaction, TransactionInput } from '../types'

/**
 * Untuk sementara data disimpan di browser (localStorage).
 * Nanti bagian ini yang diganti ke Supabase, komponen lain tidak perlu diubah.
 */
const STORAGE_KEY = 'keuangan:transactions'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage<Transaction[]>(STORAGE_KEY, []),
  )

  useEffect(() => saveToStorage(STORAGE_KEY, transactions), [transactions])

  function addTransaction(input: TransactionInput) {
    const newTransaction: Transaction = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setTransactions((prev) => [...prev, newTransaction])
  }

  function updateTransaction(id: string, input: TransactionInput) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...input } : t)))
  }

  function deleteTransaction(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  /** Buat baru dengan id tertentu, atau update kalau sudah ada (dipakai split bill) */
  function upsertTransaction(id: string, input: TransactionInput) {
    setTransactions((prev) =>
      prev.some((t) => t.id === id)
        ? prev.map((t) => (t.id === id ? { ...t, ...input } : t))
        : [...prev, { ...input, id, createdAt: new Date().toISOString() }],
    )
  }

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    upsertTransaction,
    /** Ganti seluruh data (dipakai fitur undo) */
    restoreTransactions: setTransactions,
  }
}
