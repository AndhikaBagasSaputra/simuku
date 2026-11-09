import { useState } from 'react'
import { getCategory } from '../../lib/categories'
import { getDebtStats } from '../../lib/debt'
import { formatRupiah, formatShortDate } from '../../lib/format'
import { buildSplitText, calculateSplit, getPayerName, toSplitInput } from '../../lib/splitBill'
import { dangerButtonClass } from '../../lib/ui'
import type { Debt, SplitBill } from '../../types'
import { DebtStatusBadge } from '../debts/DebtStatusBadge'
import { Sheet } from '../ui/Sheet'
import { SplitResultView } from './SplitResultView'

interface Props {
  bill: SplitBill
  debts: Debt[]
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onOpenDebt: (debtId: string) => void
}

export function SplitBillDetail({ bill, debts, onClose, onEdit, onDelete, onOpenDebt }: Props) {
  const [copied, setCopied] = useState(false)
  const input = toSplitInput(bill)
  const calc = calculateSplit(input)
  const category = getCategory(bill.categoryId)
  const linkedDebts = Object.values(bill.links.debts)
    .map((id) => debts.find((d) => d.id === id))
    .filter((d): d is Debt => Boolean(d))

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildSplitText(input, calc))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.alert('Gagal menyalin. Coba lagi.')
    }
  }

  return (
    <Sheet title={bill.title} onClose={onClose}>
      <p className="-mt-2 mb-4 text-sm text-slate-500">
        📅 {formatShortDate(bill.date)} · {category.icon} {category.name} · Dibayar {getPayerName(input)}
      </p>

      <button
        type="button"
        onClick={handleCopy}
        className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover"
      >
        {copied ? '✅ Tersalin! Tinggal tempel ke WhatsApp' : '📋 Salin teks split bill'}
      </button>

      {linkedDebts.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 font-semibold text-slate-800">Status pembayaran</p>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {linkedDebts.map((d) => {
              const stats = getDebtStats(d)
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onOpenDebt(d.id)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-slate-800">
                        {d.direction === 'owed_to_me' ? `${d.person} → kamu` : `Kamu → ${d.person}`}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {stats.remaining > 0
                          ? `Sisa ${formatRupiah(stats.remaining)}`
                          : stats.overpaid > 0
                            ? `Lebih ${formatRupiah(stats.overpaid)}`
                            : `${formatRupiah(d.amount)} sudah dibayar`}
                      </span>
                    </span>
                    <DebtStatusBadge status={stats.status} />
                    <span className="text-slate-300">›</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-1 text-xs text-slate-500">Klik untuk mencatat pembayaran/cicilan.</p>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-2 font-semibold text-slate-800">Rincian</p>
        <SplitResultView bill={input} calc={calc} />
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onDelete}
          className={dangerButtonClass}
        >
          Hapus
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          ✏️ Edit
        </button>
      </div>
    </Sheet>
  )
}
