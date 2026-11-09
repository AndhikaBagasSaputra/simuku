import { useEffect, useState } from 'react'
import { loadFromStorage, saveToStorage } from '../lib/storage'
import type { Debt, DebtInput, DebtPaymentInput } from '../types'

const STORAGE_KEY = 'keuangan:debts'

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>(() => loadFromStorage<Debt[]>(STORAGE_KEY, []))

  useEffect(() => saveToStorage(STORAGE_KEY, debts), [debts])

  function updateDebtWith(id: string, change: (debt: Debt) => Debt) {
    setDebts((prev) => prev.map((d) => (d.id === id ? change(d) : d)))
  }

  function addDebt(input: DebtInput) {
    const debt: Debt = {
      ...input,
      id: crypto.randomUUID(),
      payments: [],
      createdAt: new Date().toISOString(),
    }
    setDebts((prev) => [...prev, debt])
  }

  function updateDebt(id: string, input: DebtInput) {
    updateDebtWith(id, (d) => ({ ...d, ...input }))
  }

  function deleteDebt(id: string) {
    setDebts((prev) => prev.filter((d) => d.id !== id))
  }

  function addPayment(debtId: string, input: DebtPaymentInput) {
    updateDebtWith(debtId, (d) => ({
      ...d,
      payments: [...d.payments, { ...input, id: crypto.randomUUID() }],
    }))
  }

  function deletePayment(debtId: string, paymentId: string) {
    updateDebtWith(debtId, (d) => ({
      ...d,
      payments: d.payments.filter((p) => p.id !== paymentId),
    }))
  }

  /** Buat baru dengan id tertentu, atau update kalau sudah ada (riwayat bayar tetap) */
  function upsertDebt(id: string, input: DebtInput) {
    setDebts((prev) =>
      prev.some((d) => d.id === id)
        ? prev.map((d) => (d.id === id ? { ...d, ...input } : d))
        : [...prev, { ...input, id, payments: [], createdAt: new Date().toISOString() }],
    )
  }

  return {
    debts,
    addDebt,
    updateDebt,
    deleteDebt,
    addPayment,
    deletePayment,
    upsertDebt,
    /** Ganti seluruh data (dipakai fitur undo) */
    restoreDebts: setDebts,
  }
}
