import type { BillFrequency, RecurringBill } from '../types'
import { addDays, addMonths, daysBetween, formatShortDate } from './format'

export const FREQUENCY_LABEL: Record<BillFrequency, string> = {
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
}

/** Jatuh tempo ke-n (0 = pertama) */
export function dueDateAt(bill: Pick<RecurringBill, 'firstDueDate' | 'frequency'>, n: number) {
  switch (bill.frequency) {
    case 'weekly':
      return addDays(bill.firstDueDate, 7 * n)
    case 'monthly':
      return addMonths(bill.firstDueDate, n)
    case 'yearly':
      return addMonths(bill.firstDueDate, 12 * n)
  }
}

export type BillState = 'overdue' | 'today' | 'soon' | 'upcoming' | 'finished'

export interface BillStatus {
  /** Jatuh tempo berikutnya yang belum dibayar (null = sudah selesai) */
  nextDue: string | null
  paidCount: number
  daysLeft: number | null
  state: BillState
}

/** Dianggap "segera" kalau jatuh tempo dalam 7 hari */
const SOON_DAYS = 7

export function getBillStatus(bill: RecurringBill, today: string): BillStatus {
  const paidCount = bill.payments.length
  const finished = bill.kind === 'installment' && bill.installments > 0 && paidCount >= bill.installments
  if (finished) return { nextDue: null, paidCount, daysLeft: null, state: 'finished' }

  // Jadwal dihitung dari jumlah pembayaran, jadi tetap konsisten walau tanggal/frekuensi diedit
  const nextDue = dueDateAt(bill, paidCount)
  const daysLeft = daysBetween(today, nextDue)
  const state: BillState =
    daysLeft < 0 ? 'overdue' : daysLeft === 0 ? 'today' : daysLeft <= SOON_DAYS ? 'soon' : 'upcoming'
  return { nextDue, paidCount, daysLeft, state }
}

export function describeDue(status: BillStatus) {
  switch (status.state) {
    case 'overdue':
      return { text: `Lewat ${-(status.daysLeft ?? 0)} hari`, className: 'text-rose-600' }
    case 'today':
      return { text: 'Jatuh tempo hari ini', className: 'text-amber-700' }
    case 'soon':
      return { text: `${status.daysLeft} hari lagi`, className: 'text-amber-700' }
    case 'upcoming':
      return { text: formatShortDate(status.nextDue ?? ''), className: 'text-slate-500' }
    case 'finished':
      return { text: 'Cicilan lunas', className: 'text-emerald-700' }
  }
}

/** Perkiraan biaya per bulan (untuk ringkasan) */
export function monthlyEstimate(bill: RecurringBill) {
  if (bill.frequency === 'weekly') return (bill.amount * 52) / 12
  if (bill.frequency === 'yearly') return bill.amount / 12
  return bill.amount
}

export function isAttention(state: BillState) {
  return state === 'overdue' || state === 'today' || state === 'soon'
}
