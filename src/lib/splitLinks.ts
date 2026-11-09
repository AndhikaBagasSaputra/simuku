import type { Debt, DebtInput, SplitBillInput, SplitLinks, TransactionInput } from '../types'
import { getPayerName, ME_ID, type SplitCalculation } from './splitBill'

export interface LinkPlan {
  /** Pengeluaran bagian saya (null = tidak ada) */
  transaction: { id: string; input: TransactionInput } | null
  deleteTransactionId: string | null
  upsertDebts: { id: string; input: DebtInput }[]
  deleteDebtIds: string[]
  links: SplitLinks
}

/**
 * Tentukan transaksi & hutang apa saja yang harus dibuat/diubah/dihapus
 * supaya selalu sinkron dengan isi split bill.
 */
export function planSplitLinks(
  billId: string,
  bill: SplitBillInput,
  calc: SplitCalculation,
  prev: SplitLinks,
  debts: Debt[],
): LinkPlan {
  const note = `Split bill: ${bill.title}`
  const myShare = calc.shares.find((s) => s.participant.id === ME_ID)?.total ?? 0

  // 1. Pengeluaran bagian saya
  let transaction: LinkPlan['transaction'] = null
  let deleteTransactionId: string | null = null
  let transactionId = prev.transactionId
  if (myShare > 0) {
    transactionId ??= crypto.randomUUID()
    transaction = {
      id: transactionId,
      input: { type: 'expense', amount: myShare, categoryId: bill.categoryId, date: bill.date, note, splitBillId: billId },
    }
  } else if (transactionId) {
    deleteTransactionId = transactionId
    transactionId = null
  }

  // 2. Hutang/piutang yang seharusnya ada
  const wanted = new Map<string, Omit<DebtInput, 'dueDate'>>()
  if (bill.payerId === ME_ID) {
    // Saya yang bayar: teman-teman berhutang ke saya
    for (const s of calc.shares) {
      if (s.participant.id === ME_ID || s.total <= 0) continue
      wanted.set(`owed_to_me:${s.participant.id}`, {
        direction: 'owed_to_me',
        person: s.participant.name,
        amount: s.total,
        date: bill.date,
        note,
        splitBillId: billId,
      })
    }
  } else if (myShare > 0) {
    // Teman yang bayar: saya berhutang ke dia
    wanted.set(`i_owe:${bill.payerId}`, {
      direction: 'i_owe',
      person: getPayerName(bill),
      amount: myShare,
      date: bill.date,
      note,
      splitBillId: billId,
    })
  }

  const upsertDebts: LinkPlan['upsertDebts'] = []
  const deleteDebtIds: string[] = []
  const linkedDebts: Record<string, string> = {}

  for (const [key, input] of wanted) {
    const id = prev.debts[key] ?? crypto.randomUUID()
    const existing = debts.find((d) => d.id === id)
    upsertDebts.push({ id, input: { ...input, dueDate: existing?.dueDate ?? '' } })
    linkedDebts[key] = id
  }

  // 3. Hutang lama yang sudah tidak relevan
  for (const [key, id] of Object.entries(prev.debts)) {
    if (wanted.has(key)) continue
    const existing = debts.find((d) => d.id === id)
    if (!existing) continue
    if (existing.payments.length > 0) {
      // Sudah ada pembayaran: jangan dihapus, jadikan 0 supaya kelebihannya terlihat
      upsertDebts.push({ id, input: { ...existing, amount: 0 } })
      linkedDebts[key] = id
    } else {
      deleteDebtIds.push(id)
    }
  }

  return {
    transaction,
    deleteTransactionId,
    upsertDebts,
    deleteDebtIds,
    links: { transactionId, debts: linkedDebts },
  }
}
