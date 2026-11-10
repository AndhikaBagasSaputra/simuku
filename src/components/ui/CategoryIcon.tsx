import {
  BookOpen,
  Briefcase,
  Car,
  CircleHelp,
  Gamepad2,
  Gift,
  Laptop,
  Package,
  Pill,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { getCategory } from '../../lib/categories'

/** Ikon garis tiap kategori (kunci = id kategori) */
const ICONS: Record<string, LucideIcon> = {
  makan: Utensils,
  transportasi: Car,
  belanja: ShoppingBag,
  tagihan: ReceiptText,
  hiburan: Gamepad2,
  kesehatan: Pill,
  pendidikan: BookOpen,
  'lainnya-keluar': Package,
  gaji: Briefcase,
  bonus: Gift,
  freelance: Laptop,
  investasi: TrendingUp,
  'lainnya-masuk': Wallet,
}

const SIZES = {
  sm: { box: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10', icon: 'h-5 w-5' },
}

interface Props {
  categoryId: string
  size?: keyof typeof SIZES
}

/** Lingkaran berwarna sesuai warna kategori di grafik, berisi ikon garis kategori */
export function CategoryIcon({ categoryId, size = 'md' }: Props) {
  const category = getCategory(categoryId)
  const Icon = ICONS[categoryId] ?? CircleHelp
  const s = SIZES[size]
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${s.box}`}
      // Latar = warna kategori yang ditipiskan, jadi tetap pas di tema terang & gelap
      style={{ color: category.color, backgroundColor: `${category.color}24` }}
      aria-hidden="true"
    >
      <Icon className={s.icon} strokeWidth={2} />
    </span>
  )
}
