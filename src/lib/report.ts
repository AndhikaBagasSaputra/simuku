/**
 * Laporan per periode gajian: ringkasan, kategori, pengeluaran terbesar, tagihan, hutang & piutang.
 */
import { getCategory } from './categories'
import { daysBetween, todayISO } from './format'
import { cycleRange, salaryDatesOf, shiftCycle, shiftDays } from './payday'
import { dueDateAt } from './recurring'
import type { Debt, RecurringBill, Transaction } from '../types'

export interface CategoryLine {
  categoryId: string
  name: string
  amount: number
  percent: number
}

export interface MonthlyReport {
  start: string
  end: string
  /** Periode ini masih berjalan */
  current: boolean
  income: number
  expense: number
  balance: number
  /** Perubahan pengeluaran dibanding periode sebelumnya, dalam persen (null = tidak ada pembanding) */
  expenseChange: number | null
  perDay: number
  /** Semua kategori pengeluaran, terbesar di atas */
  topCategories: CategoryLine[]
  /** Semua kategori pemasukan, terbesar di atas */
  incomeCategories: CategoryLine[]
  /** Kategori yang naik paling banyak dibanding periode sebelumnya */
  risingCategory: { name: string; increase: number } | null
  biggestExpenses: Transaction[]
  busiestDay: { date: string; amount: number } | null
  billsPaid: { name: string; amount: number; paidDate: string }[]
  billsPaidTotal: number
  billsMissed: { name: string; amount: number; dueDate: string }[]
  receivable: number
  payable: number
  settledDebts: { person: string; direction: Debt['direction'] }[]
}

function inRange(date: string, start: string, end: string) {
  return date >= start && date <= end
}

function sumByCategory(transactions: Transaction[], type: Transaction['type'] = 'expense') {
  const map = new Map<string, number>()
  for (const t of transactions) if (t.type === type) map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
  return map
}

function toLines(map: Map<string, number>, total: number): CategoryLine[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([categoryId, amount]) => ({
      categoryId,
      name: getCategory(categoryId).name,
      amount,
      percent: total ? (amount / total) * 100 : 0,
    }))
}

/** Sisa hutang pada akhir suatu tanggal */
function remainingAt(debt: Debt, date: string) {
  if (debt.date > date) return null
  const paid = debt.payments
    .filter((p) => p.date <= date)
    .reduce((sum, p) => sum + (p.kind === 'refund' ? -p.amount : p.amount), 0)
  return Math.max(debt.amount - paid, 0)
}

export function buildReport(
  cycle: string,
  data: { transactions: Transaction[]; bills: RecurringBill[]; debts: Debt[] },
): MonthlyReport {
  const salaryDates = salaryDatesOf(data.transactions)
  const { start, end } = cycleRange(cycle, salaryDates)
  const prev = cycleRange(shiftCycle(cycle, -1), salaryDates)
  const today = todayISO()
  const current = inRange(today, start, end)

  const txs = data.transactions.filter((t) => inRange(t.date, start, end))
  // Rata-rata per hari: periode berjalan dihitung sampai hari ini
  const days = daysBetween(start, current ? today : end) + 1
  // Pembanding adil: periode berjalan dibandingkan dengan jumlah hari yang sama di periode lalu
  const prevEnd = current ? [prev.end, shiftDays(prev.start, days - 1)].sort()[0] : prev.end
  const prevTxs = data.transactions.filter((t) => inRange(t.date, prev.start, prevEnd))
  const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = txs.filter((t) => t.type === 'expense')
  const expense = expenses.reduce((s, t) => s + t.amount, 0)
  const prevExpense = prevTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const byCategory = sumByCategory(txs)
  const prevByCategory = sumByCategory(prevTxs)
  const topCategories = toLines(byCategory, expense)
  const incomeCategories = toLines(sumByCategory(txs, 'income'), income)
  let risingCategory: MonthlyReport['risingCategory'] = null
  for (const [id, amount] of byCategory) {
    const increase = amount - (prevByCategory.get(id) ?? 0)
    if (increase > 0 && (!risingCategory || increase > risingCategory.increase)) {
      risingCategory = { name: getCategory(id).name, increase }
    }
  }

  const byDay = new Map<string, number>()
  for (const t of expenses) byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.amount)
  const busiest = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0]

  // Tagihan: yang dibayar di periode ini, dan jatuh tempo di periode ini yang belum dibayar
  const billsPaid: MonthlyReport['billsPaid'] = []
  const billsMissed: MonthlyReport['billsMissed'] = []
  const lastDue = current ? today : end
  for (const bill of data.bills) {
    for (const p of bill.payments) {
      if (inRange(p.paidDate, start, end)) billsPaid.push({ name: bill.name, amount: p.amount, paidDate: p.paidDate })
    }
    const limit = bill.kind === 'installment' && bill.installments > 0 ? bill.installments : Infinity
    for (let n = 0; n < limit; n++) {
      const due = dueDateAt(bill, n)
      if (due > lastDue) break
      if (due < start) continue
      // Belum dibayar pada akhir periode (atau hari ini kalau periodenya masih berjalan)
      const payment = bill.payments.find((p) => p.dueDate === due)
      if (!payment || payment.paidDate > lastDue) billsMissed.push({ name: bill.name, amount: bill.amount, dueDate: due })
    }
  }
  billsPaid.sort((a, b) => a.paidDate.localeCompare(b.paidDate))
  billsMissed.sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  // Hutang & piutang: posisi di akhir periode (atau hari ini kalau masih berjalan)
  const asOf = current ? today : end
  const before = prev.end
  let receivable = 0
  let payable = 0
  const settledDebts: MonthlyReport['settledDebts'] = []
  for (const debt of data.debts) {
    const remaining = remainingAt(debt, asOf)
    if (remaining === null) continue
    if (debt.direction === 'owed_to_me') receivable += remaining
    else payable += remaining
    const earlier = remainingAt(debt, before)
    if (remaining === 0 && (earlier === null || earlier > 0)) settledDebts.push({ person: debt.person, direction: debt.direction })
  }

  return {
    start,
    end,
    current,
    income,
    expense,
    balance: income - expense,
    expenseChange: prevExpense ? ((expense - prevExpense) / prevExpense) * 100 : null,
    perDay: days > 0 ? expense / days : 0,
    topCategories,
    incomeCategories,
    risingCategory,
    biggestExpenses: [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 3),
    busiestDay: busiest ? { date: busiest[0], amount: busiest[1] } : null,
    billsPaid,
    billsPaidTotal: billsPaid.reduce((s, b) => s + b.amount, 0),
    billsMissed,
    receivable,
    payable,
    settledDebts,
  }
}
