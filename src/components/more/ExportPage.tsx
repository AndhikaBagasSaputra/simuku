import { useState } from 'react'
import { downloadCsv, downloadExcel, transactionRows, type ExportData } from '../../lib/export'
import { todayISO } from '../../lib/format'
import { defaultPeriod, getRange, isInRange, type Period } from '../../lib/period'
import { primaryButtonClass } from '../../lib/ui'
import { PeriodPicker } from '../PeriodPicker'

interface Props {
  data: ExportData
}

export function ExportPage({ data }: Props) {
  const [period, setPeriod] = useState<Period>(() => ({ ...defaultPeriod(), preset: 'all' }))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const range = getRange(period)
  const transactions = data.transactions.filter((t) => isInRange(t.date, range))
  const today = todayISO()
  const suffix = period.preset === 'all' ? `semua_${today}` : `${range.start}_sd_${range.end}`

  async function handleExcel() {
    setBusy(true)
    setMessage('')
    try {
      await downloadExcel({ ...data, transactions }, today, `keuangan_${suffix}.xlsx`)
      setMessage('✅ File Excel berhasil di-download')
    } catch {
      setMessage('⚠ Gagal membuat file Excel. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  function handleCsv() {
    if (transactions.length === 0) return setMessage('⚠ Belum ada transaksi di periode ini')
    downloadCsv(transactionRows(transactions), `transaksi_${suffix}.csv`)
    setMessage('✅ File CSV berhasil di-download')
  }

  const counts = [
    ['Transaksi', transactions.length],
    ['Hutang & piutang', data.debts.length],
    ['Split bill', data.splitBills.length],
    ['Target tabungan', data.goals.length],
    ['Tagihan rutin', data.bills.length],
  ] as const

  return (
    <div className="space-y-4 lg:max-w-xl">
      <div className="rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">Periode transaksi</p>
        <div className="mt-2">
          <PeriodPicker period={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">Data yang akan diekspor</p>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {counts.map(([label, count]) => (
            <li key={label} className="flex justify-between py-2">
              <span className="text-slate-600">{label}</span>
              <span className="font-semibold text-slate-800 tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Periode hanya berlaku untuk transaksi. Data lain selalu diekspor semua.
        </p>
      </div>

      <button type="button" onClick={handleExcel} disabled={busy} className={`w-full ${primaryButtonClass}`}>
        {busy ? 'Menyiapkan file…' : '📊 Download Excel (.xlsx)'}
      </button>
      <p className="-mt-2 text-center text-xs text-slate-500">
        Berisi semua data, satu sheet per jenis (transaksi, hutang, split bill, tabungan, tagihan).
      </p>

      <button
        type="button"
        onClick={handleCsv}
        className="w-full rounded-xl border border-slate-200 bg-surface py-3 font-semibold text-slate-700 hover:bg-slate-50"
      >
        📄 Download CSV (transaksi)
      </button>

      {message && <p className="text-center text-sm font-medium text-slate-700">{message}</p>}
    </div>
  )
}
