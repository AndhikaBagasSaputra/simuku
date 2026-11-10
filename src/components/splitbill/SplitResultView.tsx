import { formatRupiah } from '../../lib/format'
import { describeDiscount, describeLineQty, type SplitCalculation } from '../../lib/splitBill'
import type { SplitBillInput } from '../../types'

interface Props {
  bill: SplitBillInput
  calc: SplitCalculation
}

/** Rincian per orang + total (dipakai di preview form & detail) */
export function SplitResultView({ bill, calc }: Props) {
  if (calc.shares.length === 0) {
    return <p className="text-sm text-slate-500">Isi item dan siapa yang ambil untuk melihat hasilnya.</p>
  }

  return (
    <div className="space-y-3">
      {calc.shares.map((s) => (
        <div key={s.participant.id} className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-800">
              {s.participant.name}
              {s.participant.id === bill.payerId && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  yang bayar
                </span>
              )}
            </span>
            <span className="font-bold text-slate-800">{formatRupiah(s.total)}</span>
          </div>
          <ul className="mt-2 space-y-0.5 text-sm text-slate-600">
            {s.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="min-w-0">
                  {l.itemName} <span className="text-xs text-slate-400">{describeLineQty(l)}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formatRupiah(l.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-0.5 border-t border-slate-200 pt-2 text-xs text-slate-500">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatRupiah(s.subtotal)}</span>
            </p>
            {calc.discountTotal > 0 && (
              <p className="flex justify-between">
                <span>Diskon</span>
                <span className="tabular-nums">-{formatRupiah(s.discount)}</span>
              </p>
            )}
            {calc.feesTotal > 0 && (
              <p className="flex justify-between">
                <span>Biaya lain (rata)</span>
                <span className="tabular-nums">+{formatRupiah(s.fee)}</span>
              </p>
            )}
          </div>
        </div>
      ))}

      <div className="space-y-1 rounded-xl border border-slate-200 p-3 text-sm">
        <p className="flex justify-between text-slate-600">
          <span>Total belanja</span>
          <span className="tabular-nums">{formatRupiah(calc.itemsTotal)}</span>
        </p>
        {calc.discountTotal > 0 && (
          <p className="flex justify-between text-slate-600">
            <span>{describeDiscount(bill.discount)}</span>
            <span className="tabular-nums">-{formatRupiah(calc.discountTotal)}</span>
          </p>
        )}
        {bill.fees.map((f) => (
          <p key={f.id} className="flex justify-between text-slate-600">
            <span>{f.name}</span>
            <span className="tabular-nums">+{formatRupiah(f.amount)}</span>
          </p>
        ))}
        <p className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-800">
          <span>Total bayar</span>
          <span className="tabular-nums">{formatRupiah(calc.grandTotal)}</span>
        </p>
      </div>
    </div>
  )
}
