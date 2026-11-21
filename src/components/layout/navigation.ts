import {
  BellRing,
  Cloud,
  DatabaseBackup,
  Download,
  HandCoins,
  Lock,
  Menu,
  ReceiptText,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

/** Semua halaman di aplikasi */
export type PageKey = 'transaksi' | 'hutang' | 'splitbill' | 'lainnya' | 'tabungan' | 'tagihan' | 'ekspor' | 'backup' | 'keamanan' | 'akun'

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
  { key: 'keamanan', label: 'Kunci Aplikasi', icon: Lock },
  { key: 'akun', label: 'Akun & Sinkron', icon: Cloud },
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
export const MORE_PAGES: PageKey[] = ['lainnya', 'tabungan', 'tagihan', 'ekspor', 'backup', 'keamanan', 'akun']

/** addLabel kosong = halaman tanpa tombol tambah (tidak ada daftar yang bisa ditambah di sana) */
export const PAGE_INFO: Record<PageKey, { title: string; addLabel?: string }> = {
  transaksi: { title: 'Transaksi', addLabel: 'Tambah Transaksi' },
  hutang: { title: 'Hutang & Piutang', addLabel: 'Catat Hutang' },
  splitbill: { title: 'Split Bill', addLabel: 'Split Bill Baru' },
  lainnya: { title: 'Lainnya', },
  tabungan: { title: 'Target Tabungan', addLabel: 'Target Baru' },
  tagihan: { title: 'Tagihan Rutin', addLabel: 'Tagihan Baru' },
  ekspor: { title: 'Ekspor Data', },
  backup: { title: 'Backup & Restore', },
  keamanan: { title: 'Kunci Aplikasi', },
  akun: { title: 'Akun & Sinkron', },
}
