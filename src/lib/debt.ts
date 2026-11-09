import type { Debt } from '../types'

export type DebtStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid'

export interface DebtStats {
  /** Total yang sudah dibayar (pembayaran dikurangi pengembalian) */
  paid: number
  /** Sisa yang belum dibayar (0 kalau sudah lunas/lebih) */
  remaining: number
  /** Kelebihan bayar (0 kalau tidak lebih) */
  overpaid: number
  /** 0–100, untuk progress bar */
  progress: number
  status: DebtStatus
}

export function getDebtStats(debt: Debt): DebtStats {
  const paid = debt.payments.reduce(
    (sum, p) => sum + (p.kind === 'refund' ? -p.amount : p.amount),
    0,
  )
  const diff = debt.amount - paid

  let status: DebtStatus
  if (paid <= 0) status = 'unpaid'
  else if (diff > 0) status = 'partial'
  else if (diff === 0) status = 'paid'
  else status = 'overpaid'

  return {
    paid,
    remaining: Math.max(diff, 0),
    overpaid: Math.max(-diff, 0),
    progress: debt.amount > 0 ? Math.min((paid / debt.amount) * 100, 100) : 0,
    status,
  }
}

export const STATUS_INFO: Record<DebtStatus, { label: string; icon: string; className: string }> = {
  unpaid: { label: 'Belum dibayar', icon: '⏳', className: 'bg-rose-50 text-rose-700' },
  partial: { label: 'Dicicil', icon: '🔄', className: 'bg-amber-50 text-amber-700' },
  paid: { label: 'Lunas', icon: '✅', className: 'bg-emerald-50 text-emerald-700' },
  overpaid: { label: 'Lebih bayar', icon: '⚠️', className: 'bg-sky-50 text-sky-700' },
}

/** Status yang masih perlu ditindaklanjuti */
export function isActive(status: DebtStatus) {
  return status !== 'paid'
}
