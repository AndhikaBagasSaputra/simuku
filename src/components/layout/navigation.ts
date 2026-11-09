import {
  BellRing,
  DatabaseBackup,
  Download,
  HandCoins,
  Menu,
  ReceiptText,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

/** Semua halaman di aplikasi */
export type PageKey = 'transaksi' | 'hutang' | 'splitbill' | 'lainnya' | 'tabungan' | 'tagihan' | 'ekspor' | 'backup'

export interface NavItem {
  key: PageKey
  label: string
  icon: LucideIcon
}

/** Menu sidebar desktop (semua langsung terlihat) */
export const SIDEBAR_ITEMS: NavItem[] = [
  { key: 'transaksi', label: 'Transaksi', icon: Wallet },
  { key: 'hutang', label: 'Hutang & Piutang', icon: HandCoins },
  { key: 'splitbill', label: 'Split Bill', icon: ReceiptText },
  { key: 'tabungan', label: 'Target Tabungan', icon: Target },
  { key: 'tagihan', label: 'Tagihan Rutin', icon: BellRing },
  { key: 'ekspor', label: 'Ekspor Data', icon: Download },
  { key: 'backup', label: 'Backup & Restore', icon: DatabaseBackup },
]

/** Navigasi bawah HP (sisanya ada di "Lainnya") */
export const BOTTOM_LEFT: NavItem[] = [
  { key: 'transaksi', label: 'Transaksi', icon: Wallet },
  { key: 'hutang', label: 'Hutang', icon: HandCoins },
]
export const BOTTOM_RIGHT: NavItem[] = [
  { key: 'splitbill', label: 'Split Bill', icon: ReceiptText },
  { key: 'lainnya', label: 'Lainnya', icon: Menu },
]

/** Halaman yang ada di dalam menu "Lainnya" versi HP */
export const MORE_PAGES: PageKey[] = ['lainnya', 'tabungan', 'tagihan', 'ekspor', 'backup']

export const PAGE_INFO: Record<PageKey, { title: string; subtitle: string; addLabel: string }> = {
  transaksi: { title: 'Transaksi', subtitle: 'Catat dan pantau pemasukan & pengeluaranmu', addLabel: 'Tambah Transaksi' },
  hutang: { title: 'Hutang & Piutang', subtitle: 'Pantau siapa hutang ke siapa', addLabel: 'Catat Hutang' },
  splitbill: { title: 'Split Bill', subtitle: 'Bagi tagihan bareng teman', addLabel: 'Split Bill Baru' },
  lainnya: { title: 'Lainnya', subtitle: 'Fitur tambahan', addLabel: 'Tambah Transaksi' },
  tabungan: { title: 'Target Tabungan', subtitle: 'Wujudkan rencanamu', addLabel: 'Target Baru' },
  tagihan: { title: 'Tagihan Rutin', subtitle: 'Langganan & cicilan', addLabel: 'Tagihan Baru' },
  ekspor: { title: 'Ekspor Data', subtitle: 'Download data ke Excel / CSV', addLabel: 'Tambah Transaksi' },
  backup: { title: 'Backup & Restore', subtitle: 'Amankan datamu dalam satu file', addLabel: 'Tambah Transaksi' },
}
