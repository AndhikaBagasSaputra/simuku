import type { Debt, RecurringBill, SavingsGoal, SplitBill, Transaction } from '../types'
import { getCategory } from './categories'
import { getDebtStats, STATUS_INFO } from './debt'
import { downloadBlob } from './download'
import { FREQUENCY_LABEL, getBillStatus } from './recurring'
import { getSavingsStats } from './savings'
import { calculateSplit, getPayerName, toSplitInput } from './splitBill'

type Row = Record<string, string | number>

export interface ExportData {
  transactions: Transaction[]
  debts: Debt[]
  splitBills: SplitBill[]
  goals: SavingsGoal[]
  bills: RecurringBill[]
}

const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date)

export function transactionRows(transactions: Transaction[]): Row[] {
  return [...transactions].sort(byDate).map((t) => ({
    Tanggal: t.date,
    Jenis: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    Kategori: getCategory(t.categoryId).name,
    Nominal: t.amount,
    Catatan: t.note,
    Sumber: t.splitBillId ? 'Split bill' : t.recurringBillId ? 'Tagihan rutin' : 'Manual',
  }))
}

function debtRows(debts: Debt[]): Row[] {
  return [...debts].sort(byDate).map((d) => {
    const s = getDebtStats(d)
    return {
      Tanggal: d.date,
      Jenis: d.direction === 'owed_to_me' ? 'Piutang (orang ke saya)' : 'Hutang saya',
      Nama: d.person,
      Total: d.amount,
      'Sudah dibayar': s.paid,
      Sisa: s.remaining,
      'Lebih bayar': s.overpaid,
      Status: STATUS_INFO[s.status].label,
      'Jatuh tempo': d.dueDate,
      Catatan: d.note,
    }
  })
}

function debtPaymentRows(debts: Debt[]): Row[] {
  return debts
    .flatMap((d) =>
      d.payments.map((p) => ({
        Tanggal: p.date,
        Nama: d.person,
        Hutang: d.direction === 'owed_to_me' ? 'Piutang' : 'Hutang saya',
        Jenis: p.kind === 'refund' ? 'Pengembalian' : 'Pembayaran',
        Nominal: p.amount,
        Catatan: p.note,
      })),
    )
    .sort((a, b) => a.Tanggal.localeCompare(b.Tanggal))
}

function splitRows(splitBills: SplitBill[]): Row[] {
  return [...splitBills].sort(byDate).flatMap((bill) => {
    const input = toSplitInput(bill)
    const calc = calculateSplit(input)
    return calc.shares.map((s) => ({
      Tanggal: bill.date,
      Judul: bill.title,
      'Dibayar oleh': getPayerName(input),
      Nama: s.participant.name,
      Item: s.lines.map((l) => (l.sharedBy > 1 ? `${l.itemName} (1/${l.sharedBy})` : `${l.itemName} x${l.qty}`)).join(', '),
      Subtotal: Math.round(s.subtotal),
      Diskon: Math.round(s.discount),
      'Biaya lain': Math.round(s.fee),
      Total: s.total,
    }))
  })
}

function savingsRows(goals: SavingsGoal[], today: string): Row[] {
  return goals.map((g) => {
    const s = getSavingsStats(g, today)
    return {
      Target: `${g.icon} ${g.name}`,
      'Nominal target': g.target,
      Terkumpul: s.saved,
      Kurang: s.remaining,
      'Progres (%)': Math.round(s.progress),
      Tenggat: g.deadline,
      Status: s.achieved ? 'Tercapai' : 'Berjalan',
    }
  })
}

function savingsEntryRows(goals: SavingsGoal[]): Row[] {
  return goals
    .flatMap((g) =>
      g.entries.map((e) => ({
        Tanggal: e.date,
        Target: g.name,
        Jenis: e.kind === 'deposit' ? 'Menabung' : 'Ambil',
        Nominal: e.amount,
        Catatan: e.note,
      })),
    )
    .sort((a, b) => a.Tanggal.localeCompare(b.Tanggal))
}

function billRows(bills: RecurringBill[], today: string): Row[] {
  return bills.map((b) => {
    const s = getBillStatus(b, today)
    return {
      Nama: b.name,
      Jenis: b.kind === 'installment' ? 'Cicilan' : 'Langganan',
      Nominal: b.amount,
      Frekuensi: FREQUENCY_LABEL[b.frequency],
      Kategori: getCategory(b.categoryId).name,
      'Jatuh tempo berikutnya': s.nextDue ?? '-',
      'Sudah dibayar (kali)': s.paidCount,
      'Total cicilan': b.kind === 'installment' && b.installments > 0 ? b.installments : '-',
    }
  })
}

function billPaymentRows(bills: RecurringBill[]): Row[] {
  return bills
    .flatMap((b) =>
      b.payments.map((p) => ({
        'Tanggal bayar': p.paidDate,
        Tagihan: b.name,
        'Jatuh tempo': p.dueDate,
        Nominal: p.amount,
      })),
    )
    .sort((a, b) => a['Tanggal bayar'].localeCompare(b['Tanggal bayar']))
}

/** Lebar kolom otomatis mengikuti isi terpanjang */
function columnWidths(rows: Row[]) {
  const keys = Object.keys(rows[0] ?? {})
  return keys.map((k) => ({
    wch: Math.min(Math.max(k.length, ...rows.map((r) => String(r[k] ?? '').length)) + 2, 50),
  }))
}

/** Semua data dalam satu file Excel, satu sheet per jenis data */
export async function downloadExcel(data: ExportData, today: string, filename: string) {
  // Library Excel cukup besar, jadi baru dimuat saat tombol ditekan
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  const sheets: [string, Row[]][] = [
    ['Transaksi', transactionRows(data.transactions)],
    ['Hutang & Piutang', debtRows(data.debts)],
    ['Pembayaran Hutang', debtPaymentRows(data.debts)],
    ['Split Bill', splitRows(data.splitBills)],
    ['Target Tabungan', savingsRows(data.goals, today)],
    ['Riwayat Tabungan', savingsEntryRows(data.goals)],
    ['Tagihan Rutin', billRows(data.bills, today)],
    ['Pembayaran Tagihan', billPaymentRows(data.bills)],
  ]

  for (const [name, rows] of sheets) {
    const content = rows.length ? rows : [{ Info: 'Belum ada data' }]
    const ws = XLSX.utils.json_to_sheet(content)
    ws['!cols'] = columnWidths(content)
    XLSX.utils.book_append_sheet(wb, ws, name)
  }

  XLSX.writeFile(wb, filename)
}

/** CSV memakai pemisah titik koma (;) supaya langsung rapi saat dibuka di Excel versi Indonesia */
export function downloadCsv(rows: Row[], filename: string) {
  const headers = Object.keys(rows[0] ?? { Info: '' })
  const escape = (value: string | number) => {
    const s = String(value)
    return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(';'), ...rows.map((r) => headers.map((h) => escape(r[h] ?? '')).join(';'))]
  // \uFEFF (BOM) supaya Excel membaca huruf/emoji dengan benar
  downloadBlob(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), filename)
}
