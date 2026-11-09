import type { BillPayment, RecurringBill, RecurringBillInput } from '../types'
import { useStoredList } from './useStoredList'

export function useRecurringBills() {
  const [bills, setBills] = useStoredList<RecurringBill>('keuangan:recurring-bills')

  function updateWith(id: string, change: (bill: RecurringBill) => RecurringBill) {
    setBills((prev) => prev.map((b) => (b.id === id ? change(b) : b)))
  }

  function addBill(input: RecurringBillInput) {
    const bill: RecurringBill = { ...input, id: crypto.randomUUID(), payments: [], createdAt: new Date().toISOString() }
    setBills((prev) => [...prev, bill])
  }

  function updateBill(id: string, input: RecurringBillInput) {
    updateWith(id, (b) => ({ ...b, ...input }))
  }

  function deleteBill(id: string) {
    setBills((prev) => prev.filter((b) => b.id !== id))
  }

  function addBillPayment(billId: string, payment: BillPayment) {
    updateWith(billId, (b) => ({ ...b, payments: [...b.payments, payment] }))
  }

  function deleteBillPayment(billId: string, paymentId: string) {
    updateWith(billId, (b) => ({ ...b, payments: b.payments.filter((p) => p.id !== paymentId) }))
  }

  /** Dipanggil saat pengeluaran hasil bayar tagihan dihapus dari daftar transaksi */
  function removePaymentByTransaction(transactionId: string) {
    setBills((prev) =>
      prev.map((b) =>
        b.payments.some((p) => p.transactionId === transactionId)
          ? { ...b, payments: b.payments.filter((p) => p.transactionId !== transactionId) }
          : b,
      ),
    )
  }

  return {
    bills,
    addBill,
    updateBill,
    deleteBill,
    addBillPayment,
    deleteBillPayment,
    removePaymentByTransaction,
    /** Ganti seluruh data (dipakai fitur undo) */
    restoreBills: setBills,
  }
}
