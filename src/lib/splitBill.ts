import type { SplitBill, SplitBillInput, SplitDiscount, SplitParticipant } from '../types'
import { formatRupiah, formatShortDate } from './format'

export const ME_ID = 'me'
export const ME_NAME = 'Saya'

export interface ShareLine {
  itemName: string
  /** Harga satuan asli */
  price: number
  qty: number
  /** Jumlah orang yang patungan (1 = tidak patungan) */
  sharedBy: number
  amount: number
}

export interface PersonShare {
  participant: SplitParticipant
  lines: ShareLine[]
  subtotal: number
  discount: number
  fee: number
  /** Total yang harus dibayar (sudah dibulatkan) */
  total: number
}

export interface SplitCalculation {
  /** Hanya orang yang punya item */
  shares: PersonShare[]
  itemsTotal: number
  discountTotal: number
  feesTotal: number
  feePerPerson: number
  grandTotal: number
  /** Masalah yang harus dibereskan sebelum disimpan */
  issues: string[]
}

/** Hitung diskon total, termasuk batas maksimal */
export function calculateDiscount(discount: SplitDiscount, itemsTotal: number) {
  let raw = 0
  if (discount.type === 'percent') {
    raw = (itemsTotal * discount.value) / 100
    if (discount.max > 0) raw = Math.min(raw, discount.max)
  } else if (discount.type === 'fixed') {
    raw = discount.value
  }
  return Math.round(Math.max(0, Math.min(raw, itemsTotal)))
}

export function calculateSplit(bill: SplitBillInput): SplitCalculation {
  const issues: string[] = []
  const shares = new Map<string, PersonShare>(
    bill.participants.map((p) => [p.id, { participant: p, lines: [], subtotal: 0, discount: 0, fee: 0, total: 0 }]),
  )

  // 1. Bagi item ke tiap orang
  let itemsTotal = 0
  for (const item of bill.items) {
    const name = item.name.trim() || 'Item tanpa nama'
    itemsTotal += item.price * item.qty

    if (item.mode === 'qty') {
      let taken = 0
      for (const p of bill.participants) {
        const qty = item.allocations[p.id] ?? 0
        const share = shares.get(p.id)
        if (qty <= 0 || !share) continue
        taken += qty
        const amount = item.price * qty
        share.lines.push({ itemName: name, price: item.price, qty, sharedBy: 1, amount })
        share.subtotal += amount
      }
      if (taken < item.qty) issues.push(`${item.qty - taken} ${name} belum ada yang ambil`)
      if (taken > item.qty) issues.push(`${name} diambil ${taken}, padahal jumlahnya cuma ${item.qty}`)
    } else {
      const members = bill.participants.filter((p) => (item.allocations[p.id] ?? 0) > 0)
      if (members.length === 0) {
        issues.push(`${name} belum dipilih siapa yang patungan`)
        continue
      }
      const amount = (item.price * item.qty) / members.length
      for (const p of members) {
        const share = shares.get(p.id)
        if (!share) continue
        share.lines.push({ itemName: name, price: item.price, qty: item.qty, sharedBy: members.length, amount })
        share.subtotal += amount
      }
    }
  }

  // 2. Diskon dibagi sesuai porsi belanja, biaya lain dibagi rata.
  //    Keduanya hanya untuk orang yang punya item.
  const active = [...shares.values()].filter((s) => s.subtotal > 0)
  const allocatedTotal = active.reduce((sum, s) => sum + s.subtotal, 0)
  const discountTotal = calculateDiscount(bill.discount, itemsTotal)
  const feesTotal = bill.fees.reduce((sum, f) => sum + f.amount, 0)
  const feePerPerson = active.length ? feesTotal / active.length : 0

  for (const s of active) {
    s.discount = allocatedTotal ? (discountTotal * s.subtotal) / allocatedTotal : 0
    s.fee = feePerPerson
    s.total = Math.round(s.subtotal - s.discount + s.fee)
  }

  // 3. Selisih pembulatan dibebankan ke orang yang bayar, supaya totalnya pas
  const target = Math.round(allocatedTotal - discountTotal + feesTotal)
  const diff = target - active.reduce((sum, s) => sum + s.total, 0)
  if (diff !== 0 && active.length) {
    const payer = active.find((s) => s.participant.id === bill.payerId) ?? active[0]
    payer.total += diff
  }

  return {
    shares: active,
    itemsTotal,
    discountTotal,
    feesTotal,
    feePerPerson,
    grandTotal: itemsTotal - discountTotal + feesTotal,
    issues,
  }
}

export function getPayerName(bill: SplitBillInput) {
  return bill.participants.find((p) => p.id === bill.payerId)?.name ?? ME_NAME
}

/** "2 x Rp 25.000" atau "1/3 dari 1 x Rp 90.000" */
export function describeLineQty(line: ShareLine) {
  const base = `${line.qty} x ${formatRupiah(line.price)}`
  return line.sharedBy > 1 ? `1/${line.sharedBy} dari ${base}` : base
}

export function describeDiscount(discount: SplitDiscount) {
  if (discount.type === 'percent') {
    return `Diskon ${discount.value}%${discount.max > 0 ? ` (maks ${formatRupiah(discount.max)})` : ''}`
  }
  return 'Diskon'
}

/** Teks siap tempel ke WhatsApp */
export function buildSplitText(bill: SplitBillInput, calc: SplitCalculation) {
  const lines: string[] = [
    `🧾 Split Bill – ${bill.title}`,
    `📅 ${formatShortDate(bill.date)} · Dibayar oleh: ${getPayerName(bill)}`,
  ]

  for (const s of calc.shares) {
    lines.push('', `👤 ${s.participant.name}`)
    for (const l of s.lines) {
      lines.push(`  ${l.itemName}  ${describeLineQty(l)} = ${formatRupiah(l.amount)}`)
    }
    const parts = [`Subtotal ${formatRupiah(s.subtotal)}`]
    if (calc.discountTotal > 0) parts.push(`Diskon -${formatRupiah(s.discount)}`)
    if (calc.feesTotal > 0) parts.push(`Biaya lain +${formatRupiah(s.fee)}`)
    lines.push(`  ${parts.join(' · ')}`, `  ➜ ${formatRupiah(s.total)}`)
  }

  lines.push('', `Total belanja : ${formatRupiah(calc.itemsTotal)}`)
  if (calc.discountTotal > 0) {
    lines.push(`${describeDiscount(bill.discount)}: -${formatRupiah(calc.discountTotal)}`)
  }
  if (calc.feesTotal > 0) {
    const fees = bill.fees.map((f) => `${f.name} ${formatRupiah(f.amount)}`).join(' + ')
    lines.push(`${fees} (rata ${formatRupiah(calc.feePerPerson)}/org)`)
  }
  lines.push(`TOTAL BAYAR   : ${formatRupiah(calc.grandTotal)}`)

  if (bill.paymentInfo.trim()) lines.push('', `Transfer ke: ${bill.paymentInfo.trim()} 🙏`)
  return lines.join('\n')
}

/** Ambil bagian yang bisa diedit dari split bill yang sudah tersimpan */
export function toSplitInput(bill: SplitBill): SplitBillInput {
  return {
    title: bill.title,
    date: bill.date,
    categoryId: bill.categoryId,
    payerId: bill.payerId,
    participants: bill.participants,
    items: bill.items,
    fees: bill.fees,
    discount: bill.discount,
    paymentInfo: bill.paymentInfo,
  }
}
