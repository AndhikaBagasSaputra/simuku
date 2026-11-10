export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  /** Format: YYYY-MM-DD */
  date: string
  note: string
  createdAt: string
  /** Terisi kalau transaksi ini dibuat otomatis dari split bill */
  splitBillId?: string
  /** Terisi kalau transaksi ini pembayaran tagihan rutin */
  recurringBillId?: string
}

/** Data yang diisi user di form (id & createdAt dibuat otomatis) */
export type TransactionInput = Omit<Transaction, 'id' | 'createdAt'>

/** owed_to_me = piutang (orang berhutang ke saya), i_owe = hutang saya ke orang */
export type DebtDirection = 'owed_to_me' | 'i_owe'

export interface DebtPayment {
  id: string
  /** payment = cicilan/pembayaran, refund = pengembalian kelebihan bayar */
  kind: 'payment' | 'refund'
  amount: number
  date: string
  note: string
}

export interface Debt {
  id: string
  direction: DebtDirection
  person: string
  amount: number
  date: string
  /** Jatuh tempo (opsional), format YYYY-MM-DD */
  dueDate: string
  note: string
  payments: DebtPayment[]
  createdAt: string
  /** Terisi kalau hutang ini dibuat otomatis dari split bill */
  splitBillId?: string
}

export type DebtInput = Omit<Debt, 'id' | 'createdAt' | 'payments'>
export type DebtPaymentInput = Omit<DebtPayment, 'id'>

// ===== Split Bill =====

export interface SplitParticipant {
  id: string
  name: string
}

export interface SplitItem {
  id: string
  name: string
  /** Harga satuan asli */
  price: number
  qty: number
  /** qty = tiap orang ambil jumlah tertentu, shared = dibagi rata ke beberapa orang */
  mode: 'qty' | 'shared'
  /** participantId -> jumlah yang diambil (mode qty) atau 1 = ikut patungan (mode shared) */
  allocations: Record<string, number>
}

export interface SplitFee {
  id: string
  name: string
  amount: number
}

export interface SplitDiscount {
  type: 'none' | 'percent' | 'fixed'
  /** Persen (mode percent) atau nominal (mode fixed) */
  value: number
  /** Maksimal diskon untuk mode percent, 0 = tanpa batas */
  max: number
}

/** Data yang otomatis dibuat dari split bill (transaksi & hutang) */
export interface SplitLinks {
  transactionId: string | null
  /** key "arah:participantId" -> id hutang */
  debts: Record<string, string>
}

export interface SplitBill {
  id: string
  title: string
  date: string
  /** Kategori untuk pengeluaran bagian saya */
  categoryId: string
  payerId: string
  participants: SplitParticipant[]
  items: SplitItem[]
  fees: SplitFee[]
  discount: SplitDiscount
  /** Contoh: "BCA 1234567 a.n. Budi" */
  paymentInfo: string
  links: SplitLinks
  createdAt: string
}

export type SplitBillInput = Omit<SplitBill, 'id' | 'createdAt' | 'links'>

// ===== Target Tabungan =====

export interface SavingsEntry {
  id: string
  /** deposit = menabung, withdraw = mengambil */
  kind: 'deposit' | 'withdraw'
  amount: number
  date: string
  note: string
}

export interface SavingsGoal {
  id: string
  name: string
  icon: string
  target: number
  /** Tenggat (opsional), format YYYY-MM-DD */
  deadline: string
  note: string
  entries: SavingsEntry[]
  createdAt: string
}

export type SavingsGoalInput = Omit<SavingsGoal, 'id' | 'createdAt' | 'entries'>
export type SavingsEntryInput = Omit<SavingsEntry, 'id'>

// ===== Tagihan Rutin =====

export type BillFrequency = 'weekly' | 'monthly' | 'yearly'

export interface BillPayment {
  id: string
  /** Jatuh tempo yang dibayar */
  dueDate: string
  paidDate: string
  amount: number
  /** Pengeluaran yang dicatat otomatis (null = tidak dicatat) */
  transactionId: string | null
}

export interface RecurringBill {
  id: string
  name: string
  /** subscription = langganan tanpa batas, installment = cicilan dengan jumlah tertentu */
  kind: 'subscription' | 'installment'
  amount: number
  categoryId: string
  frequency: BillFrequency
  /** Jatuh tempo pertama; jadwal berikutnya dihitung dari sini */
  firstDueDate: string
  /** Jumlah cicilan (khusus cicilan), 0 = tanpa batas */
  installments: number
  note: string
  payments: BillPayment[]
  createdAt: string
}

export type RecurringBillInput = Omit<RecurringBill, 'id' | 'createdAt' | 'payments'>

export interface Category {
  id: string
  name: string
  type: TransactionType
  /** Warna tetap untuk grafik (tidak berubah walau urutan/ranking berubah) */
  color: string
}
