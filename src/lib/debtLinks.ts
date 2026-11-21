/**
 * Hubungan hutang/piutang dengan transaksi.
 *
 * Hutang biasa (bukan dari split bill) bisa ikut tercatat di transaksi:
 * - piutang baru (kamu meminjamkan)  -> pengeluaran
 * - hutang baru (kamu meminjam)      -> pemasukan
 * - teman membayar cicilan ke kamu   -> pemasukan
 * - kamu membayar cicilan hutang     -> pengeluaran
 * - pengembalian kelebihan bayar     -> kebalikan dari pembayaran
 *
 * Hutang dari split bill tidak pernah dicatat lagi: bagianmu sudah jadi pengeluaran saat split bill dibuat.
 */
import type { Debt, DebtInput, DebtPayment, TransactionInput, TransactionType } from '../types'

export const DEBT_EXPENSE_CATEGORY = 'hutang-keluar'
export const DEBT_INCOME_CATEGORY = 'hutang-masuk'

/** Hutang dari split bill tidak boleh dicatat lagi sebagai transaksi (supaya tidak dobel) */
export function canRecordDebt(debt: Pick<Debt, 'splitBillId'>) {
  return !debt.splitBillId
}

function tx(type: TransactionType, amount: number, date: string, note: string, debtId: string): TransactionInput {
  return {
    type,
    amount,
    date,
    note,
    categoryId: type === 'income' ? DEBT_INCOME_CATEGORY : DEBT_EXPENSE_CATEGORY,
    debtId,
  }
}

function withNote(base: string, extra: string) {
  return extra ? `${base} (${extra})` : base
}

/** Transaksi saat hutang/piutang dibuat */
export function debtCreationTransaction(input: DebtInput, debtId: string): TransactionInput {
  return input.direction === 'owed_to_me'
    ? tx('expense', input.amount, input.date, withNote(`Pinjamkan ke ${input.person}`, input.note), debtId)
    : tx('income', input.amount, input.date, withNote(`Pinjam dari ${input.person}`, input.note), debtId)
}

/** Transaksi untuk satu pembayaran/cicilan */
export function debtPaymentTransaction(
  debt: Pick<Debt, 'id' | 'direction' | 'person'>,
  payment: Pick<DebtPayment, 'kind' | 'amount' | 'date' | 'note'>,
): TransactionInput {
  const owedToMe = debt.direction === 'owed_to_me'
  if (payment.kind === 'refund') {
    return owedToMe
      ? tx('expense', payment.amount, payment.date, `Kembalikan kelebihan bayar ke ${debt.person}`, debt.id)
      : tx('income', payment.amount, payment.date, `Kelebihan bayar dikembalikan ${debt.person}`, debt.id)
  }
  return owedToMe
    ? tx('income', payment.amount, payment.date, withNote(`Cicilan dari ${debt.person}`, payment.note), debt.id)
    : tx('expense', payment.amount, payment.date, withNote(`Bayar hutang ke ${debt.person}`, payment.note), debt.id)
}

/** Semua transaksi yang terhubung ke sebuah hutang (dibuat + tiap pembayaran) */
export function linkedTransactionIds(debt: Debt) {
  return [debt.transactionId, ...debt.payments.map((p) => p.transactionId)].filter((id): id is string => Boolean(id))
}
