import { Check, Copy, ListChecks } from 'lucide-react'
import { useState } from 'react'
import { getCategory } from '../../lib/categories'
import { getDebtStats } from '../../lib/debt'
import { formatRupiah, formatShortDate } from '../../lib/format'
import { buildSplitText, buildSplitTextShort, calculateSplit, getPayerName, toSplitInput } from '../../lib/splitBill'
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
  const [copied, setCopied] = useState<'short' | 'full' | null>(null)
  const input = toSplitInput(bill)
  const calc = calculateSplit(input)
  const category = getCategory(bill.categoryId)
  const linkedDebts = Object.values(bill.links.debts)
    .map((id) => debts.find((d) => d.id === id))
    .filter((d): d is Debt => Boolean(d))

  async function handleCopy(kind: 'short' | 'full') {
    try {
      await navigator.clipboard.writeText(kind === 'short' ? buildSplitTextShort(input, calc) : buildSplitText(input, calc))
      setCopied(kind)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      window.alert('Gagal menyalin. Coba lagi.')
    }
  }

  return (
    <Sheet title={bill.title} onClose={onClose}>
      <p className="-mt-2 mb-4 text-sm text-slate-500">
        {formatShortDate(bill.date)} · {category.name} · Dibayar {getPayerName(input)}
      </p>

      {/* Ringkas: nama, barang, total. Lengkap: rincian harga, diskon, dan biaya lain */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void handleCopy('short')}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white shadow-sm transition hover:bg-primary-hover active:scale-[0.98] active:bg-primary-active"
        >
          {copied === 'short' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied === 'short' ? 'Tersalin' : 'Salin ringkas'}
        </button>
        {/* Tombol kedua senada (hijau lembut), bukan abu-abu, supaya terlihat satu pasangan */}
        <button
          type="button"
          onClick={() => void handleCopy('full')}
          className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
        >
          {copied === 'full' ? <Check className="h-4 w-4" aria-hidden="true" /> : <ListChecks className="h-4 w-4" aria-hidden="true" />}
          {copied === 'full' ? 'Tersalin' : 'Salin lengkap'}
        </button>
      </div>

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
          Edit
        </button>
      </div>
    </Sheet>
  )
}
