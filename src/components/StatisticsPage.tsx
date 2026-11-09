import type { Transaction } from '../types'
import { CategoryChart } from './CategoryChart'
import { TrendChart } from './TrendChart'

interface Props {
  /** Semua transaksi (untuk grafik tren) */
  transactions: Transaction[]
  /** Transaksi dalam periode terpilih (untuk donat kategori) */
  periodTransactions: Transaction[]
  /** Bulan terakhir grafik tren (YYYY-MM) */
  endMonth: string
}

/** Dimuat terpisah (lazy) supaya library grafik tidak memperberat halaman awal */
export default function StatisticsPage({ transactions, periodTransactions, endMonth }: Props) {
  return (
    <>
      <CategoryChart transactions={periodTransactions} />
      <TrendChart transactions={transactions} month={endMonth} />
    </>
  )
}
